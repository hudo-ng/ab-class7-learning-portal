import { db } from "@/db/index";
import { questions } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { PRACTICE_SET_SIZE } from "@/lib/exam-blueprint";
import { getLocalizedTopicBySlug } from "@/db/queries/localized";

export async function getPracticeQuestionsByTopicSlug(
  topicSlug: string,
  userId: string,
  locale: string,
  limit = PRACTICE_SET_SIZE,
) {
  const topic = await getLocalizedTopicBySlug(topicSlug, locale);
  if (!topic) {
    return [];
  }

  const rows = await db.query.questions.findMany({
    where: and(eq(questions.topicId, topic.id), eq(questions.isActive, true)),
    orderBy: (q) => [
      // Never answered first (0), then last answered wrong (1), then right (2)
      sql`coalesce((
        select aa.is_correct::int + 1
        from answer_attempts aa
        where aa.question_id = ${q.id}
          and aa.user_id = ${userId}
          and aa.source = 'practice'
        order by aa.created_at desc
        limit 1
      ), 0)`,
      sql`random()`,
    ],

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
