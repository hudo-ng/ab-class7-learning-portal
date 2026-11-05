"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { registerUser, type RegisterError } from "@/app/actions/register-user";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function RegisterForm() {
  const t = useTranslations("Register");
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<RegisterError | null>(null);

  function onSubmit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await registerUser(fd);

      if ("error" in res) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    });
  }

  if (success) {
    return (
      <Alert className="border-green-500 bg-green-50">
        <AlertTitle className="text-green-700">{t("successTitle")}</AlertTitle>
        <AlertDescription className="space-y-3 text-green-700">
          <p>{t("successBody")}</p>
          <p className="text-sm">{t("redirecting")}</p>
          <Button className="mt-2" onClick={() => router.push("/login")}>
            {t("goToLogin")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {t(`errors.${error}`, { min: MIN_PASSWORD_LENGTH })}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">{t("password")}</Label>
        <Input id="password" name="password" type="password" required />
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {t("submit")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t("login")}
        </Link>
      </p>
    </form>
  );
}
