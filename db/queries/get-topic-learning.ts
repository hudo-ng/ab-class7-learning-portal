import { db } from "@/db/index";
import { topics, topicContent } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getTopicLearning(slug: string) {
  const topic = await db.query.topics.findFirst({
    where: eq(topics.slug, slug),
  });

  if (!topic) return null;

  const content = await db
    .select()
    .from(topicContent)
    .where(eq(topicContent.topicId, topic.id))
    .orderBy(asc(topicContent.order));

  return { topic, content };
}
