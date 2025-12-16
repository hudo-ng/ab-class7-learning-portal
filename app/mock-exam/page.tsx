import { getMockExamQuestions } from "@/db/queries/get-mock-exam";
import MockExamUI from "@/components/other/MockExam";

export default async function MockExamPage() {
  const questionCount = 30;
  const questions = await getMockExamQuestions(questionCount);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">Mock Exam</h1>
      <MockExamUI questions={questions} />
    </main>
  );
}
