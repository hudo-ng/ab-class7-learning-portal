"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  resetPassword,
  type ResetPasswordResult,
} from "@/app/actions/password-reset";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";

type ResetError = Extract<ResetPasswordResult, { error: string }>["error"];

export default function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("ResetPassword");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<ResetError | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await resetPassword(fd);
      if ("error" in res) setError(res.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <Alert className="border-green-500 bg-green-50">
        <AlertTitle className="text-green-700">{t("successTitle")}</AlertTitle>
        <AlertDescription className="space-y-3 text-green-700">
          <p>{t("successBody")}</p>
          <Button asChild>
            <Link href="/login">{t("goToLogin")}</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="space-y-2">
            <p>{t(`errors.${error}`, { min: MIN_PASSWORD_LENGTH })}</p>
            {error === "invalidLink" && (
              <Link href="/forgot-password" className="font-medium underline">
                {t("requestNew")}
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}
      <input type="hidden" name="token" value={token} />
      <div className="grid gap-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
