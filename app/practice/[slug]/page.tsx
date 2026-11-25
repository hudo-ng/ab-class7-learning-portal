import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getServerSession } from "next-auth";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPracticeQuestionsByTopicSlug } from "@/db/queries/practice";
import { getLocalizedTopics } from "@/db/queries/localized";
import { PracticeCards } from "@/components/other/PracticeCards";
import { TopicHeader } from "@/components/other/TopicHeader";
import { ProgressBar } from "@/components/other/TopicProgress";
import { Button } from "@/components/ui/button";
import { sortByStudyOrder, topicStyle } from "@/lib/learn-topics";
import { getProgressBySlug } from "@/lib/progress";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();

  const topics = sortByStudyOrder(await getLocalizedTopics(locale));
  const index = topics.findIndex((topic) => topic.slug === slug);
  if (index === -1) notFound();
  const topic = topics[index];

  const session = await getServerSession(authOptions);
  const t = await getTranslations("Common");
  const tProgress = await getTranslations("Progress");
  const descriptions: Record<string, string> = (await getMessages()).Learn
    .topics;
  const { accent } = topicStyle(slug);

  const header = (extra?: React.ReactNode) => (
    <TopicHeader
      slug={slug}
      title={topic.title}
      description={descriptions[slug]}
      number={index + 1}
      total={topics.length}
      backHref="/practice"
      backLabel={tProgress("allPracticeTopics")}
    >
      <Link
        href={`/learn/${slug}`}
        className={`inline-flex items-center gap-1.5 text-sm font-medium ${accent.text} hover:underline`}
      >
        <BookOpen className="size-4" aria-hidden="true" />
        {tProgress("readLessonFirst")}
      </Link>
      {extra}
    </TopicHeader>
  );

  // Guests and unapproved accounts see the topic, plus what they need to do
  if (!session?.user?.isApproved) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-6">
        {header()}
        <div className="rounded-2xl border bg-white p-5 sm:p-6 shadow-sm space-y-3">
          <p className="font-semibold text-slate-900">
            {t("practicePromptTitle")}
          </p>
          <p className="text-sm text-slate-600">
            {session ? t("notApproved") : t("signupPromptBody")}
          </p>
          {!session && (
            <Button asChild>
              <Link href="/register">{t("createFreeAccount")}</Link>
            </Button>
          )}
        </div>
      </main>
    );
  }

  let data;
  try {
    data = await getPracticeQuestionsByTopicSlug(slug, session.user.id, locale);
  } catch (err) {
    console.error("Practice questions failed to load:", err);
    return notFound();
  }
  if (!data || Array.isArray(data)) return notFound();

  const topicProgress = (await getProgressBySlug(locale))?.get(slug);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-6">
      {header(
        topicProgress && (
          <div className="max-w-sm pt-2">
            <ProgressBar progress={topicProgress} accent={accent} />
          </div>
        ),
      )}
      <PracticeCards questions={data.questions} />
    </main>
  );
}
