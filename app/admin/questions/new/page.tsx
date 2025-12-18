import CreateQuestionForm from "@/components/other/CreateQuestionForm";
import getTopics from "@/db/queries/get-topics";

export default async function AddNewQuestionPage() {
  const topics = await getTopics();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Add New Question</h2>

      <CreateQuestionForm topics={topics} />
    </div>
  );
}
