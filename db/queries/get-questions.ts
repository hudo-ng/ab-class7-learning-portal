import { db } from "@/db/index";
import { questions, topics } from "../schema";
import { eq, desc } from "drizzle-orm";

export async function getQuestions() {
  return await db
    .select({
      id: questions.id,
      prompt: questions.prompt,
      isActive: questions.isActive,
      createdAt: questions.createdAt,
      topicTitle: topics.title,
      topicSlug: topics.slug,
    })
    .from(questions)
    .innerJoin(topics, eq(questions.topicId, topics.id))
    .orderBy(desc(questions.createdAt));
}
