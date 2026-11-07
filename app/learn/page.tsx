import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocalizedTopics } from "@/db/queries/localized";
import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

export default async function LearnIndexPage() {
  const allTopics = await getLocalizedTopics(await getLocale());
  const t = await getTranslations("Learn");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allTopics.map((topic) => (
          <Link key={topic.id} href={`/learn/${topic.slug}`}>
            <Card className="h-full hover:shadow-md transition cursor-pointer">
              <CardHeader>
                <CardTitle>{topic.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-end">
                <span className="text-sm text-muted-foreground">
                  {t("startLearning")}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
