import { db } from "@/db";
import { topicContent, topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { LessonBlock } from "@/components/other/LessonBlock";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function TopicPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  const topic = await db.query.topics.findFirst({
    where: eq(topics.slug, slug),
  });

  if (!topic) return null;

  const blocks = await db.query.topicContent.findMany({
    where: eq(topicContent.topicId, topic.id),
    orderBy: topicContent.order,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{topic.title}</h1>
        <p className="text-muted-foreground">
          Learn the key concepts before practicing exam questions.
        </p>
      </header>

      {blocks.map((block) => (
        <LessonBlock key={block.id} block={block} />
      ))}

      <div className="flex justify-end pt-6">
        <Button asChild>
          <Link href={`/practice/${topic.slug}`}>Practice this topic →</Link>
        </Button>
      </div>
    </div>
  );
}
