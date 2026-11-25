import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { getLocalizedTopics } from "@/db/queries/localized";
import { sortByStudyOrder } from "@/lib/learn-topics";
import { getProgressBySlug } from "@/lib/progress";
import { TopicCard } from "@/components/other/TopicCard";
import { MasterySummary } from "@/components/other/TopicProgress";
import { Button } from "@/components/ui/button";

export default async function LearnIndexPage() {
  const locale = await getLocale();
  const topics = sortByStudyOrder(await getLocalizedTopics(locale));
  const progress = await getProgressBySlug(locale);
  const t = await getTranslations("Learn");
  const tProgress = await getTranslations("Progress");

  // Descriptions are keyed by slug; a new topic without one still gets a card
  const descriptions: Record<string, string> = (await getMessages()).Learn
    .topics;
  const mastered = progress
    ? topics.filter((topic) => progress.get(topic.slug)?.complete).length
    : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10 space-y-8">
      <header className="flex items-start gap-4 rounded-2xl bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-50 p-6 sm:p-8">
        <span className="hidden sm:flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <GraduationCap className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {t("title")}
            </h1>
            <p className="text-slate-600">{t("subtitle")}</p>
          </div>
          {progress && (
            <MasterySummary done={mastered} total={topics.length}>
              {mastered === topics.length && (
                <Button asChild size="sm">
                  <Link href="/mock-exam">{tProgress("takeMockExam")}</Link>
                </Button>
              )}
            </MasterySummary>
          )}
        </div>
      </header>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic, i) => (
          <li key={topic.id}>
            <TopicCard
              slug={topic.slug}
              title={topic.title}
              description={descriptions[topic.slug]}
              number={i + 1}
              href={`/learn/${topic.slug}`}
              cta={t("readLesson")}
              progress={progress?.get(topic.slug)}
              startHere={i === 0}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
