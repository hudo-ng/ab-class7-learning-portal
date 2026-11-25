import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { questions, topics } from "@/db/schema";
import { AdminPageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { sortByStudyOrder, topicStyle } from "@/lib/learn-topics";
import { cn } from "@/lib/utils";

export default async function AdminTopicIndexPage() {
  const rows = await db
    .select({
      id: topics.id,
      slug: topics.slug,
      title: topics.title,
      active: sql<number>`(count(${questions.id}) filter (where ${questions.isActive}))::int`,
      review: sql<number>`(count(${questions.id}) filter (where not ${questions.isActive}))::int`,
    })
    .from(topics)
    .leftJoin(questions, eq(questions.topicId, topics.id))
    .groupBy(topics.id);
  const allTopics = sortByStudyOrder(rows);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={BookOpen}
        title="Topics"
        description="Lessons and their question banks, in study order. Lesson text is edited in db/data/lessons."
      >
        <Button asChild size="sm">
          <Link href="/admin/topics/new">
            <Plus className="size-4" aria-hidden="true" />
            Add topic
          </Link>
        </Button>
      </AdminPageHeader>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allTopics.map((topic, i) => {
          const { icon: Icon, accent } = topicStyle(topic.slug);
          return (
            <li
              key={topic.id}
              className={cn(
                "flex flex-col gap-4 rounded-2xl border border-t-4 bg-white p-5 shadow-sm",
                accent.bar,
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    accent.icon,
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wide",
                      accent.text,
                    )}
                  >
                    Topic {i + 1}
                  </p>
                  <h2 className="font-semibold leading-snug text-slate-900">
                    {topic.title}
                  </h2>
                  <p className="text-xs text-slate-500">/{topic.slug}</p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-2">
                  <dd className="text-xl font-bold tabular-nums text-slate-900">
                    {topic.active}
                  </dd>
                  <dt className="text-xs text-slate-600">Active questions</dt>
                </div>
                <div
                  className={cn(
                    "rounded-xl p-2",
                    topic.review > 0 ? "bg-amber-50" : "bg-slate-50",
                  )}
                >
                  <dd className="text-xl font-bold tabular-nums text-slate-900">
                    {topic.review}
                  </dd>
                  <dt className="text-xs text-slate-600">To review</dt>
                </div>
              </dl>

              <div className="mt-auto flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/learn/${topic.slug}`}>View lesson</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={
                      topic.review > 0
                        ? `/admin/questions?status=inactive&topic=${topic.slug}`
                        : `/admin/questions`
                    }
                  >
                    {topic.review > 0 ? "Review questions" : "Manage questions"}
                  </Link>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
