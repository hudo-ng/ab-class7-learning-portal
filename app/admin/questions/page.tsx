import Link from "next/link";
import {
  getQuestions,
  getQuestionsForReview,
  getTopicsWithDraftCounts,
  type QuestionStatus,
} from "@/db/queries/get-questions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmActionButton } from "@/components/admin/ConfirmButton";
import {
  deleteQuestion,
  setQuestionActive,
} from "@/app/actions/admin/review-question";
import { Search, X } from "lucide-react";

type SearchParams = Promise<{
  page?: string;
  q?: string;
  status?: string;
  topic?: string;
}>;

const TABS: { status: QuestionStatus; label: string }[] = [
  { status: "all", label: "All" },
  { status: "active", label: "Active" },
  { status: "inactive", label: "Needs review" },
];

function href(params: {
  page?: number;
  q?: string;
  status: QuestionStatus;
  topic?: string;
}) {
  const sp = new URLSearchParams();
  if (params.status !== "all") sp.set("status", params.status);
  if (params.topic) sp.set("topic", params.topic);
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return `/admin/questions${qs ? `?${qs}` : ""}`;
}

function ActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  return (
    <form action={setQuestionActive} className="inline">
      <input type="hidden" name="questionId" value={id} />
      <input type="hidden" name="active" value={String(!isActive)} />
      <Button type="submit" size="sm" variant={isActive ? "outline" : "default"}>
        {isActive ? "Deactivate" : "Approve"}
      </Button>
    </form>
  );
}

function DeleteButton({ id }: { id: string }) {
  return (
    <form action={deleteQuestion} className="inline">
      <input type="hidden" name="questionId" value={id} />
      <ConfirmActionButton confirmText="Delete this question permanently?">
        Delete
      </ConfirmActionButton>
    </form>
  );
}

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const data = await searchParams;
  const page = Number(data.page ?? 1);
  const q = data.q ?? "";
  const status: QuestionStatus =
    data.status === "active" || data.status === "inactive"
      ? data.status
      : "all";

  const topicList = await getTopicsWithDraftCounts();
  const topic = topicList.find((t) => t.slug === data.topic);
  const topicId = topic?.id;

  const review = status === "inactive";
  const list = review ? null : await getQuestions({ page, q, status, topicId });
  const drafts = review
    ? await getQuestionsForReview({ page, q, topicId })
    : null;
  const { totalPages, totalQuestions } = (list ?? drafts)!;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-center">
          <CardTitle>Questions</CardTitle>

          <Button asChild>
            <Link href="/admin/questions/new">+ Add Question</Link>
          </Button>
        </div>

        <div className="flex gap-2">
          {TABS.map((t) => (
            <Button
              key={t.status}
              asChild
              size="sm"
              variant={t.status === status ? "default" : "outline"}
            >
              <Link href={href({ status: t.status, q, topic: topic?.slug })}>
                {t.label}
              </Link>
            </Button>
          ))}
        </div>

        {review && (
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant={topic ? "ghost" : "secondary"}>
              <Link href={href({ status, q })}>All topics</Link>
            </Button>
            {topicList
              .filter((t) => t.drafts > 0)
              .map((t) => (
                <Button
                  key={t.slug}
                  asChild
                  size="sm"
                  variant={t.slug === topic?.slug ? "secondary" : "ghost"}
                >
                  <Link href={href({ status, q, topic: t.slug })}>
                    {t.title} ({t.drafts})
                  </Link>
                </Button>
              ))}
          </div>
        )}

        <form className="relative max-w-md">
          {status !== "all" && (
            <input type="hidden" name="status" value={status} />
          )}
          {topic && <input type="hidden" name="topic" value={topic.slug} />}
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
              <Link href={href({ status, topic: topic?.slug })}>
                <X className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </form>

        <p className="text-sm text-muted-foreground">
          {totalQuestions} question{totalQuestions === 1 ? "" : "s"}
        </p>
      </CardHeader>

      <CardContent>
        {drafts && (
          <div className="space-y-4">
            {drafts.rows.map((d) => (
              <div key={d.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between gap-4">
                  <p className="font-medium">{d.prompt}</p>
                  <Badge variant="secondary" className="shrink-0">
                    {d.topic.title}
                  </Badge>
                </div>

                {d.imgUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.imgUrl}
                    alt=""
                    className="max-h-32 rounded border object-contain"
                  />
                )}

                <ul className="space-y-1 text-sm">
                  {d.choices.map((c) => (
                    <li
                      key={c.id}
                      className={
                        c.isCorrect
                          ? "font-medium text-green-700"
                          : "text-muted-foreground"
                      }
                    >
                      {c.isCorrect ? "✓ " : "• "}
                      {c.text}
                    </li>
                  ))}
                </ul>

                <p className="text-sm rounded bg-muted/50 p-3">
                  {d.explanation}
                </p>

                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/questions/${d.id}/edit`}>Edit</Link>
                  </Button>
                  <DeleteButton id={d.id} />
                  <ActiveToggle id={d.id} isActive={false} />
                </div>
              </div>
            ))}

            {drafts.rows.length === 0 && (
              <p className="p-6 text-center text-muted-foreground">
                Nothing to review.
              </p>
            )}
          </div>
        )}

        {list && (
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
                {list.rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 max-w-md truncate">{row.prompt}</td>

                    <td className="p-2">{row.topicTitle}</td>

                    <td className="p-2 text-center">
                      {row.isActive ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>

                    <td className="p-2 text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/admin/questions/${row.id}/edit`}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <ActiveToggle id={row.id} isActive={row.isActive} />
                      <DeleteButton id={row.id} />
                    </td>
                  </tr>
                ))}

                {list.rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-6 text-center text-muted-foreground"
                    >
                      No questions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-end gap-2 mt-6">
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <Link
                  key={p}
                  href={href({ page: p, q, status, topic: topic?.slug })}
                  className={`px-3 py-1 rounded border ${
                    p === page ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
