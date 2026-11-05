"use client";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";

export default function LogoutButton() {
  const t = useTranslations("Nav");
  return (
    <Button
      variant="outline"
      onClick={() => {
        if (confirm(t("logoutConfirm"))) {
          signOut({ callbackUrl: "/login" });
        }
      }}
    >
      {t("logout")}
    </Button>
  );
}
