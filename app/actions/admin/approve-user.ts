"use server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function approveUser(fd: FormData): Promise<void> {
  await requireAdmin();

  const userId = fd.get("userId") as string;
  const approved = fd.get("approved") === "true";

  await db
    .update(users)
    .set({ isApproved: approved })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");
}
