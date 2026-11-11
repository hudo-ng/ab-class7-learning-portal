"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requestPasswordReset } from "@/app/actions/password-reset";

export default function ForgotPasswordForm() {
  const t = useTranslations("ForgotPassword");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(fd: FormData) {
    startTransition(async () => {
      await requestPasswordReset(fd);
      setSentTo(String(fd.get("email") ?? ""));
    });
  }

  if (sentTo) {
    return (
      <Alert>
        <AlertTitle>{t("sentTitle")}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{t("sentBody", { email: sentTo })}</p>
          <Link href="/login" className="text-sm font-medium underline">
            {t("backToLogin")}
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t("submitting") : t("submit")}
      </Button>
      <p className="text-center text-sm">
        <Link
          href="/login"
          className="text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
