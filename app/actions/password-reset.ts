"use server";

import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "next-intl";
import { after } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { sql, and, eq, isNull } from "drizzle-orm";
import { sendEmail, buttonEmail } from "@/lib/email";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";

const TOKEN_TTL_MINUTES = 60;

const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const locale = await getLocale();

  if (email) {
    after(() =>
      sendResetLink(email, locale).catch((err) => {
        console.error("Password reset email failed:", err);
      }),
    );
  }

  return { ok: true as const };
}

async function sendResetLink(email: string, locale: Locale) {
  const user = await db.query.users.findFirst({
    where: sql`lower(${users.email}) = ${email}`,
    columns: { id: true, email: true },
  });

  if (!user) return;

  const t = passwordResetTokens;

  const [recent] = await db
    .select({ id: t.id })
    .from(t)
    .where(
      and(
        eq(t.userId, user.id),
        sql`${t.createdAt} > now() - interval '2 minutes'`,
      ),
    )
    .limit(1);

  if (recent) return; // don't send more than one email every 2 minutes

  const token = crypto.randomBytes(32).toString("base64url");

  await db.transaction(async (tx) => {
    await tx
      .update(t)
      .set({ usedAt: sql`now()` })
      .where(and(eq(t.userId, user.id), sql`${t.usedAt} IS NULL`));

    await tx.insert(t).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: sql`now() + make_interval(mins => ${TOKEN_TTL_MINUTES})`,
    });
  });

  const url = new URL("/reset-password", process.env.NEXTAUTH_URL);
  url.searchParams.set("token", token);

  const tr = await getTranslations({ locale, namespace: "ResetEmail" });
  await sendEmail({
    to: user.email,
    subject: tr("subject"),
    ...buttonEmail({
      heading: tr("heading"),
      intro: tr("intro", { minutes: TOKEN_TTL_MINUTES }),
      button: tr("button"),
      url: url.toString(),
      footer: tr("footer"),
    }),
  });
}

export type ResetPasswordResult =
  | { ok: true }
  | { error: "invalidLink" | "passwordTooShort" | "passwordMismatch" };

export async function resetPassword(
  formData: FormData,
): Promise<ResetPasswordResult> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "invalidLink" };
  if (password.length < MIN_PASSWORD_LENGTH)
    return { error: "passwordTooShort" };
  if (password !== confirm) return { error: "passwordMismatch" };

  const hashedPassword = await bcrypt.hash(password, 10);
  const t = passwordResetTokens;

  const ok = await db.transaction(async (tx) => {
    // Claim the token in one statement: only a request that flips used_at
    // from NULL wins, so the same link can't be used twice, even at once
    const [claimed] = await tx
      .update(t)
      .set({ usedAt: sql`now()` })
      .where(
        and(
          eq(t.tokenHash, hashToken(token)),
          isNull(t.usedAt),
          sql`${t.expiresAt} > now()`,
        ),
      )
      .returning({ userId: t.userId });
    if (!claimed) return false;

    await tx
      .update(users)
      .set({ hashedPassword, sessionVersion: sql`${users.sessionVersion} + 1` })
      .where(eq(users.id, claimed.userId));

    // Any other links for this user stop working too
    await tx
      .update(t)
      .set({ usedAt: sql`now()` })
      .where(and(eq(t.userId, claimed.userId), isNull(t.usedAt)));

    return true;
  });

  return ok ? { ok: true } : { error: "invalidLink" };
}
