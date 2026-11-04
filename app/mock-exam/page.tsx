import { getMockExamQuestions } from "@/db/queries/get-mock-exam";
import MockExamUI from "@/components/other/MockExam";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Button } from "@/components/ui/button";
import { getTopicProgress } from "@/db/queries/progess";
import { MASTERY_CORRECT, MASTERY_WINDOW } from "@/lib/exam-blueprint";
import Link from "next/link";

export default async function MockExamPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 space-y-3">
        <p className="font-medium">Want to take the mock exam?</p>
        <p className="text-sm text-muted-foreground">
          Create a free account to unlock practice questions and mock exams.
        </p>
        <Button asChild>
          <a href="/register">Create free account</a>
        </Button>
      </div>
    );
  }

  if (!session.user?.isApproved) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 space-y-3">
        <p className="font-medium">Want to take the mock exam?</p>
        <p className="text-sm text-muted-foreground">
          Your account is not approved yet.
        </p>
      </div>
    );
  }

  if (session.user.role !== "ADMIN") {
    const progress = await getTopicProgress(session.user.id);
    const done = progress.filter((t) => t.complete).length;
    if (done < progress.length) {
      return (
        <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Mock exam locked</h1>
            <p className="text-muted-foreground mt-1">
              Complete every topic in practice to unlock it ({done} /{" "}
              {progress.length} done). A topic is complete when you get{" "}
              {MASTERY_CORRECT} of your last {MASTERY_WINDOW} questions right.
            </p>
          </div>
          <ul className="space-y-2">
            {progress.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span>
                  {t.complete ? "✅" : "⬜"} {t.title}
                </span>
                {t.complete ? (
                  <span className="text-sm text-muted-foreground">
                    {t.correct} / {t.answered}
                  </span>
                ) : (
                  <Link
                    href={`/practice/${t.slug}`}
                    className="text-sm underline"
                  >
                    {t.correct} / {t.answered} correct · Practice
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </main>
      );
    }
  }

  const questions = await getMockExamQuestions();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">Mock Exam</h1>
      <MockExamUI questions={questions} />
    </main>
  );
}
