import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ResetPasswordForm from "@/components/other/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const t = await getTranslations("ResetPassword");

  return (
    <div className="max-w-sm mx-auto mt-20 space-y-4 px-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <p className="text-sm text-destructive">
              {t("errors.invalidLink")}{" "}
              <Link href="/forgot-password" className="font-medium underline">
                {t("requestNew")}
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
