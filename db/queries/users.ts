import { db } from "@/db/index";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";

const findByEmail = (email: string) =>
  db.query.users.findFirst({
    where: sql`lower(${users.email}) = ${email}`,
    columns: { id: true, role: true, isApproved: true, sessionVersion: true },
  });

export async function findOrCreateGoogleUser(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();

  const existing = await findByEmail(email);
  if (existing) return existing;

  // onConflictDoNothing: if two first-time logins race, the second insert
  // is skipped instead of crashing on the unique email
  await db
    .insert(users)
    .values({ email, hashedPassword: null, role: "USER", isApproved: false })
    .onConflictDoNothing({ target: users.email });

  const created = await findByEmail(email);
  if (!created) throw new Error("Could not create user for Google sign-in");
  return created;
}
