"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export type UserActionResult = { ok: true } | { error: string };

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/*
 * Every change that could remove an admin runs in a transaction that first
 * LOCKS all admin rows (SELECT ... FOR UPDATE). If two admins act at the same
 * moment (e.g. the last two delete each other), the second request waits for
 * the first to finish, then sees the real admin count and is refused. Without
 * the lock both could pass the check and leave the site with no admin.
 */
async function lockAdmins(tx: Tx) {
  return tx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "ADMIN"))
    .for("update");
}

async function lockUser(tx: Tx, userId: string) {
  const [row] = await tx
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .for("update");
  return row ?? null;
}

const LAST_ADMIN = "This is the only admin. Make another user an admin first.";

function done(): UserActionResult {
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setUserApproved(
  userId: string,
  approved: boolean,
): Promise<UserActionResult> {
  await requireAdmin();
  const updated = await db
    .update(users)
    .set({ isApproved: approved })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  if (updated.length === 0) return { error: "User not found." };
  return done();
}

export async function setUserRole(
  userId: string,
  role: "USER" | "ADMIN",
): Promise<UserActionResult> {
  const session = await requireAdmin();
  if (role !== "USER" && role !== "ADMIN") return { error: "Invalid role." };
  if (userId === session.user.id && role !== "ADMIN") {
    return {
      error: "You can't remove your own admin role. Ask another admin.",
    };
  }

  const error = await db.transaction(async (tx) => {
    const admins = await lockAdmins(tx);
    const target = await lockUser(tx, userId);
    if (!target) return "User not found.";
    if (target.role === "ADMIN" && role === "USER" && admins.length <= 1) {
      return LAST_ADMIN;
    }
    // Admins can always use the site, so promoting also approves the account
    await tx
      .update(users)
      .set(role === "ADMIN" ? { role, isApproved: true } : { role })
      .where(eq(users.id, userId));
    return null;
  });

  return error ? { error } : done();
}

export async function deleteUser(userId: string): Promise<UserActionResult> {
  const session = await requireAdmin();
  if (userId === session.user.id) {
    return { error: "You can't delete your own account here." };
  }

  const error = await db.transaction(async (tx) => {
    const admins = await lockAdmins(tx);
    const target = await lockUser(tx, userId);
    if (!target) return "User not found.";
    if (target.role === "ADMIN" && admins.length <= 1) return LAST_ADMIN;
    // Answer history and reset tokens are removed by ON DELETE CASCADE.
    // Their next page load signs them out (the session check finds no user).
    await tx.delete(users).where(eq(users.id, userId));
    return null;
  });

  return error ? { error } : done();
}
