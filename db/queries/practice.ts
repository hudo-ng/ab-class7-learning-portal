import { db } from "@/db/index";
import { topics, questions } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function getPracticeQuestionsByTopicSlug(
  topicSlug: string,
  limit = 5,
) {
  const topic = await db.query.topics.findFirst({
    where: eq(topics.slug, topicSlug),
  });
  if (!topic) {
    return [];
  }

  const rows = await db.query.questions.findMany({
    where: and(eq(questions.topicId, topic.id), eq(questions.isActive, true)),
    orderBy: sql`random()`,
    limit,
    columns: { id: true, prompt: true, explanation: true, imgUrl: true },
    with: {
      choices: {
        columns: { id: true, text: true },
        orderBy: (c, { asc }) => [asc(c.sortOrder)],
      },
    },
  });

  const questionsArray = rows.map((q) => ({
    questionId: q.id,
    prompt: q.prompt,
    explanation: q.explanation,
    imgUrl: q.imgUrl,
    choices: q.choices.map((c) => ({ choiceId: c.id, text: c.text })),
  }));

  return { questions: questionsArray, topicTitle: topic.title };
}
