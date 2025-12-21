import { db } from "@/db/index";
import { questions, topics } from "../schema";
import { eq, desc, ilike, and, sql } from "drizzle-orm";

const PAGE_SIZE = 10;

export async function getQuestions(params: { page: number; q?: string }) {
  const { page, q } = params;
  const offset = (page - 1) * PAGE_SIZE;

  const where = q ? and(ilike(questions.prompt, `%${q}%`)) : undefined;

  const rows = await db
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
    .where(where)
    .orderBy(desc(questions.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const [{ count }] = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(questions)
    .where(where);

  return {
    rows,
    page,
    pageSize: PAGE_SIZE,
    totalQuestions: Number(count),
    totalPages: Math.ceil(Number(count) / PAGE_SIZE),
  };
}
