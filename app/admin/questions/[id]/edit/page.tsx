import { notFound } from "next/navigation";
import { getQuestion } from "@/db/queries/get-question";
import EditQuestionForm from "@/components/other/EditQuestionForm";

type Params = Promise<{ id: string }>;

export default async function EditQuestionPage({ params }: { params: Params }) {
  const { id } = await params;

  if (!id) return notFound();

  const question = await getQuestion(id);
  if (!question) return notFound();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Edit Question</h2>
      <EditQuestionForm question={question} />
    </div>
  );
}
