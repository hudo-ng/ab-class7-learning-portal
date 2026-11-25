import Link from "next/link";
import { ClipboardCheck, Lock } from "lucide-react";
import { getServerSession } from "next-auth";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getMockExamQuestions } from "@/db/queries/get-mock-exam";
import { getLocalizedTopics } from "@/db/queries/localized";
import MockExamUI from "@/components/other/MockExam";
import { TopicCard } from "@/components/other/TopicCard";
import { MasterySummary } from "@/components/other/TopicProgress";
import { Button } from "@/components/ui/button";
import { sortByStudyOrder } from "@/lib/learn-topics";
import { getProgressBySlug } from "@/lib/progress";

function Header({
  title,
  subtitle,
  locked = false,
  children,
}: {
  title: string;
  subtitle: string;
  locked?: boolean;
  children?: React.ReactNode;
}) {
  const Icon = locked ? Lock : ClipboardCheck;
  return (
    <header className="flex items-start gap-4 rounded-2xl bg-gradient-to-br from-violet-50 via-indigo-50 to-sky-50 p-6 sm:p-8">
      <span className="hidden sm:flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {title}
          </h1>
          <p className="text-slate-600">{subtitle}</p>
        </div>
        {children}
      </div>
    </header>
  );
}

export default async function MockExamPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();
  const t = await getTranslations("MockExam");
  const tCommon = await getTranslations("Common");
  const tProgress = await getTranslations("Progress");

  // Guests are normally sent to /login by proxy.ts; this is a fallback
  if (!session?.user?.isApproved) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <Header title={t("title")} subtitle={t("subtitle")}>
          <div className="space-y-3 rounded-xl bg-white/70 p-4 shadow-sm">
            <p className="text-sm text-slate-700">
              {session ? tCommon("notApproved") : tCommon("signupPromptBody")}
            </p>
            {!session && (
              <Button asChild size="sm">
                <Link href="/register">{tCommon("createFreeAccount")}</Link>
              </Button>
            )}
          </div>
        </Header>
      </main>
    );
  }

  // Locked until every topic is mastered in practice (admins can always enter)
  if (session.user.role !== "ADMIN") {
    const topics = sortByStudyOrder(await getLocalizedTopics(locale));
    const progress = await getProgressBySlug(locale);
    const mastered = topics.filter(
      (topic) => progress?.get(topic.slug)?.complete,
    ).length;

    if (mastered < topics.length) {
      const descriptions: Record<string, string> = (await getMessages()).Learn
        .topics;
      // Topics still to master first, then the ones already done
      const ordered = [
        ...topics.filter((topic) => !progress?.get(topic.slug)?.complete),
        ...topics.filter((topic) => progress?.get(topic.slug)?.complete),
      ];
      return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10 space-y-8">
          <Header title={t("lockedTitle")} subtitle={t("lockedBody")} locked>
            <MasterySummary done={mastered} total={topics.length} />
          </Header>

          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ordered.map((topic) => {
              const p = progress?.get(topic.slug);
              return (
                <li key={topic.id}>
                  <TopicCard
                    slug={topic.slug}
                    title={topic.title}
                    description={descriptions[topic.slug]}
                    number={topics.indexOf(topic) + 1}
                    href={`/practice/${topic.slug}`}
                    cta={
                      p?.complete
                        ? tProgress("practiseAgain")
                        : p && p.answered > 0
                          ? tProgress("continuePractice")
                          : tProgress("startPractice")
                    }
                    progress={p}
                  />
                </li>
              );
            })}
          </ol>
        </main>
      );
    }
  }

  const questions = await getMockExamQuestions(locale);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10 space-y-6">
      <Header title={t("title")} subtitle={t("subtitle")} />
      <MockExamUI questions={questions} />
    </main>
  );
}
