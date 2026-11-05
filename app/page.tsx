import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("Home");

  return (
    <main className="mx-auto max-w-5xl px-4 py-20 space-y-16">

      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {t("subtitle")}
        </p>

        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/learn">{t("startLearning")}</Link>
          </Button>

          {!session && (
            <Button variant="outline" asChild>
              <Link href="/register">{t("createAccount")}</Link>
            </Button>
          )}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 text-center">
        <Feature title={t("learnTitle")}>{t("learnBody")}</Feature>
        <Feature title={t("practiceTitle")}>{t("practiceBody")}</Feature>
        <Feature title={t("mockTitle")}>{t("mockBody")}</Feature>
      </section>

      {!session && (
        <section className="rounded-xl border bg-muted/30 p-8 text-center space-y-4">
          <h2 className="text-2xl font-semibold">{t("ctaTitle")}</h2>
          <p className="text-muted-foreground">{t("ctaBody")}</p>
          <Button asChild>
            <Link href="/register">{t("ctaButton")}</Link>
          </Button>
        </section>
      )}
    </main>
  );
}

function Feature({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
