import {
  getLocalizedLessonBlocks,
  getLocalizedTopicBySlug,
} from "@/db/queries/localized";
import { LessonBlock } from "@/components/other/LessonBlock";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export default async function TopicPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const topic = await getLocalizedTopicBySlug(slug, locale);

  if (!topic) return null;
  const t = await getTranslations("Learn");
  const tCommon = await getTranslations("Common");

  const blocks = await getLocalizedLessonBlocks(topic.id, locale);
  const hasTranslation = blocks.some((b) => b.translated);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{topic.title}</h1>
        <p className="text-muted-foreground">{t("topicSubtitle")}</p>
        {hasTranslation && (
          <p className="text-xs text-muted-foreground italic">
            {tCommon("unofficialTranslation")}
          </p>
        )}
      </header>

      {blocks.map((block) => (
        <LessonBlock key={block.id} block={block} />
      ))}

      <div className="flex justify-end pt-6">
        <Button asChild>
          <Link href={`/practice/${topic.slug}`}>{t("practiceTopic")}</Link>
        </Button>
      </div>
    </div>
  );
}
