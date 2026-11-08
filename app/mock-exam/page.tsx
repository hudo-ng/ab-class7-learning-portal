import { getMockExamQuestions } from "@/db/queries/get-mock-exam";
import MockExamUI from "@/components/other/MockExam";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Button } from "@/components/ui/button";
import { getTopicProgress } from "@/db/queries/progress";
import { MASTERY_CORRECT, MASTERY_WINDOW } from "@/lib/exam-blueprint";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export default async function MockExamPage() {
  const session = await getServerSession(authOptions);
  const tCommon = await getTranslations("Common");
  const t = await getTranslations("MockExam");
  if (!session) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 space-y-3">
        <p className="font-medium">{tCommon("mockPromptTitle")}</p>
        <p className="text-sm text-muted-foreground">
          {tCommon("signupPromptBody")}
        </p>
        <Button asChild>
          <a href="/register">{tCommon("createFreeAccount")}</a>
        </Button>
      </div>
    );
  }

  if (!session.user?.isApproved) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 space-y-3">
        <p className="font-medium">{tCommon("mockPromptTitle")}</p>
        <p className="text-sm text-muted-foreground">
          {tCommon("notApproved")}
        </p>
      </div>
    );
  }

  if (session.user.role !== "ADMIN") {
    const progress = await getTopicProgress(
      session.user.id,
      await getLocale(),
    );
    const done = progress.filter((topic) => topic.complete).length;
    if (done < progress.length) {
      return (
        <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{t("lockedTitle")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("lockedIntro", { done, total: progress.length })}{" "}
              {t("lockedRule", {
                correct: MASTERY_CORRECT,
                window: MASTERY_WINDOW,
              })}
            </p>
          </div>
          <ul className="space-y-2">
            {progress.map((topic) => (
              <li
                key={topic.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span>
                  {topic.complete ? "✅" : "⬜"} {topic.title}
                </span>
                {topic.complete ? (
                  <span className="text-sm text-muted-foreground">
                    {t("topicScore", {
                      correct: topic.correct,
                      answered: topic.answered,
                    })}
                  </span>
                ) : (
                  <Link
                    href={`/practice/${topic.slug}`}
                    className="text-sm underline"
                  >
                    {t("practiceLink", {
                      correct: topic.correct,
                      answered: topic.answered,
                    })}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </main>
      );
    }
  }

  const questions = await getMockExamQuestions(await getLocale());

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <MockExamUI questions={questions} />
    </main>
  );
}
