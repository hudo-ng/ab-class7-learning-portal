"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";

// Codes, not sentences: the form translates them (messages: Register.errors.*)
export type RegisterError =
  | "passwordMismatch"
  | "required"
  | "passwordTooShort"
  | "emailTaken";

type RegisterResult = { error: RegisterError } | { success: true };

export async function registerUser(
  formData: FormData,
): Promise<RegisterResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "passwordMismatch" };
  }

  if (!email || !password || !confirmPassword) {
    return { error: "required" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: "passwordTooShort" };
  }

  const existingUser = await db.query.users.findFirst({
    where: sql`lower(${users.email}) = ${email}`,
  });

  if (existingUser) {
    return { error: "emailTaken" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    email,
    hashedPassword,
    role: "USER",
  });

  return { success: true };
}
