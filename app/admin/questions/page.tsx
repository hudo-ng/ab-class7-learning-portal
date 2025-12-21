import Link from "next/link";
import { getQuestions } from "@/db/queries/get-questions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

type SearchParams = Promise<{ page?: string; q?: string }>;

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const data = await searchParams;
  const page = Number(data.page ?? 1);
  const q = data.q ?? "";

  const { rows, totalPages } = await getQuestions({ page, q });

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-center">
          <CardTitle>Questions</CardTitle>

          <Button asChild>
            <Link href="/admin/questions/new">+ Add Question</Link>
          </Button>
        </div>
        <form className="relative max-w-md">
          <Input
            name="q"
            placeholder="Search..."
            defaultValue={q}
            className="pr-20"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute right-10 top-1/2 -translate-y-1/2"
          >
            <Search className="h-4 w-4" />
          </Button>

          {q && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              asChild
            >
              <a href="/admin/questions">
                <X className="h-4 w-4" />
              </a>
            </Button>
          )}
        </form>
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
              {rows.map((q) => (
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

              {rows.length === 0 && (
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

          {totalPages > 1 && (
            <div className="flex justify-end gap-2 mt-6">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const params = new URLSearchParams();
                params.set("page", String(p));
                if (q) params.set("q", q);
                return (
                  <Link
                    key={p}
                    href={`/admin/questions?${params.toString()}`}
                    className={`px-3 py-1 rounded border ${
                      p === page ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
