import { getMockExamQuestions } from "@/db/queries/get-mock-exam";
import MockExamUI from "@/components/other/MockExam";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Button } from "@/components/ui/button";

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

  const questionCount = 30;
  const questions = await getMockExamQuestions(questionCount);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">Mock Exam</h1>
      <MockExamUI questions={questions} />
    </main>
  );
}
