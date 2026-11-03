import { db } from "@/db/index";
import { questions, topics } from "../schema";
import { eq, desc, asc, ilike, and, sql } from "drizzle-orm";

const PAGE_SIZE = 10;

export type QuestionStatus = "all" | "active" | "inactive";

function filters(q?: string, status: QuestionStatus = "all", topicId?: string) {
  return and(
    q ? ilike(questions.prompt, `%${q}%`) : undefined,
    topicId ? eq(questions.topicId, topicId) : undefined,
    status === "active" ? eq(questions.isActive, true) : undefined,
    status === "inactive" ? eq(questions.isActive, false) : undefined,
  );
}

async function countPages(where: ReturnType<typeof filters>) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questions)
    .where(where);
  return {
    totalQuestions: Number(count),
    totalPages: Math.ceil(Number(count) / PAGE_SIZE),
  };
}

export async function getQuestions(params: {
  page: number;
  q?: string;
  status?: QuestionStatus;
  topicId?: string;
}) {
  const { page, q, status, topicId } = params;
  const where = filters(q, status, topicId);

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
    .offset((page - 1) * PAGE_SIZE);

  return { rows, page, pageSize: PAGE_SIZE, ...(await countPages(where)) };
}

// Topics with how many inactive questions each has, for the review filter
export async function getTopicsWithDraftCounts() {
  return db
    .select({
      id: topics.id,
      slug: topics.slug,
      title: topics.title,
      drafts: sql<number>`count(${questions.id}) filter (where ${questions.isActive} = false)`.mapWith(Number),
    })
    .from(topics)
    .leftJoin(questions, eq(questions.topicId, topics.id))
    .groupBy(topics.id)
    .orderBy(asc(topics.title));
}

// Full questions (choices and answer included) for reviewing drafts
export async function getQuestionsForReview(params: {
  page: number;
  q?: string;
  topicId?: string;
}) {
  const { page, q, topicId } = params;
  const where = filters(q, "inactive", topicId);

  const rows = await db.query.questions.findMany({
    where,
    orderBy: [asc(questions.createdAt)],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    with: {
      topic: { columns: { title: true } },
      choices: { orderBy: (c, { asc }) => [asc(c.sortOrder)] },
    },
  });

  return { rows, page, pageSize: PAGE_SIZE, ...(await countPages(where)) };
}
