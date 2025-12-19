import CreateNewTopicForm from "@/components/other/CreateTopicForm";
export default function CreateNewTopicPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-xl font-semibold">Add New Topic</h2>
      <CreateNewTopicForm />
    </div>
  );
}
