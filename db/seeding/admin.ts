import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";
import { db } from "../index";
import { users } from "../schema";

/**
 * Create the admin from ADMIN_EMAIL / ADMIN_PASSWORD.
 * Safe to re-run: an existing user is promoted to an approved ADMIN and
 * their password is left unchanged.
 */
export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (e.g. in .env)");
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  const existing = await db.query.users.findFirst({
    where: sql`lower(${users.email}) = ${email}`,
  });

  if (existing) {
    await db
      .update(users)
      .set({ role: "ADMIN", isApproved: true })
      .where(eq(users.id, existing.id));
    console.log(`Admin ${email} already exists (password unchanged).`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    email,
    hashedPassword,
    role: "ADMIN",
    isApproved: true,
  });
  console.log(`Created admin ${email}.`);
}
