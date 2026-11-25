import Link from "next/link";
import { Target } from "lucide-react";
import { getServerSession } from "next-auth";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getLocalizedTopics } from "@/db/queries/localized";
import { sortByStudyOrder } from "@/lib/learn-topics";
import { getProgressBySlug } from "@/lib/progress";
import { TopicCard } from "@/components/other/TopicCard";
import { MasterySummary } from "@/components/other/TopicProgress";
import { Button } from "@/components/ui/button";

export default async function PracticeIndexPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();
  const topics = sortByStudyOrder(await getLocalizedTopics(locale));
  const progress = await getProgressBySlug(locale);

  const t = await getTranslations("Practice");
  const tCommon = await getTranslations("Common");
  const tProgress = await getTranslations("Progress");
  const descriptions: Record<string, string> = (await getMessages()).Learn
    .topics;

  const mastered = progress
    ? topics.filter((topic) => progress.get(topic.slug)?.complete).length
    : 0;

  const ctaFor = (slug: string) => {
    const p = progress?.get(slug);
    if (!p || p.answered === 0) return tProgress("startPractice");
    return p.complete
      ? tProgress("practiseAgain")
      : tProgress("continuePractice");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10 space-y-8">
      <header className="flex items-start gap-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 p-6 sm:p-8">
        <span className="hidden sm:flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
          <Target className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {t("title")}
            </h1>
            <p className="text-slate-600">{t("subtitle")}</p>
          </div>

          {progress ? (
            <MasterySummary done={mastered} total={topics.length}>
              {mastered === topics.length && (
                <Button asChild size="sm">
                  <Link href="/mock-exam">{tProgress("takeMockExam")}</Link>
                </Button>
              )}
            </MasterySummary>
          ) : session ? (
            // Signed in but not approved yet
            <p className="rounded-xl bg-white/70 p-4 text-sm text-slate-700 shadow-sm">
              {tCommon("notApproved")}
            </p>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-700">
                {tCommon("signupPromptBody")}
              </p>
              <Button asChild size="sm" className="shrink-0">
                <Link href="/register">{tCommon("createFreeAccount")}</Link>
              </Button>
            </div>
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
              href={`/practice/${topic.slug}`}
              cta={ctaFor(topic.slug)}
              progress={progress?.get(topic.slug)}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
