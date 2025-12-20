import Link from "next/link";
import { getQuestions } from "@/db/queries/get-questions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminQuestionsPage() {
  const questions = await getQuestions();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Questions</CardTitle>

        <Button asChild>
          <Link href="/admin/questions/new">+ Add Question</Link>
        </Button>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Question</th>
                <th className="p-2">Topic</th>
                <th className="p-2 text-center">Status</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 max-w-md truncate">{q.prompt}</td>

                  <td className="p-2">{q.topicTitle}</td>

                  <td className="p-2 text-center">
                    {q.isActive ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </td>

                  <td className="p-2 text-right space-x-3">
                    <Link
                      href={`/admin/questions/${q.id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}

              {questions.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-6 text-center text-muted-foreground"
                  >
                    No questions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
