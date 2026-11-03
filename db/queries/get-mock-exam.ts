import { db } from "@/db/index";
import { questions, topics } from "@/db/schema";
import { eq, sql, inArray, notInArray, and } from "drizzle-orm";
import { EXAM_BLUEPRINT, EXAM_QUESTION_COUNT } from "@/lib/exam-blueprint";

function pick(where: ReturnType<typeof and>, limit: number) {
  return db.query.questions.findMany({
    where,
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
}

export async function getMockExamQuestions() {
  const topicRows = await db
    .select({ id: topics.id, slug: topics.slug })
    .from(topics)
    .where(inArray(topics.slug, Object.keys(EXAM_BLUEPRINT)));

  // One random draw per topic, in parallel
  const perTopic = await Promise.all(
    topicRows.map((t) =>
      pick(
        and(eq(questions.isActive, true), eq(questions.topicId, t.id)),
        EXAM_BLUEPRINT[t.slug],
      ),
    ),
  );
  const rows = perTopic.flat();

  // Top up from any topic if one was short (or a slug was renamed)
  const missing = EXAM_QUESTION_COUNT - rows.length;
  if (missing > 0) {
    const used = rows.map((q) => q.id);
    rows.push(
      ...(await pick(
        and(
          eq(questions.isActive, true),
          used.length ? notInArray(questions.id, used) : undefined,
        ),
        missing,
      )),
    );
  }

  // Fisher–Yates shuffle so topics are mixed, not grouped
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }

  return rows.map((q) => ({
    questionId: q.id,
    prompt: q.prompt,
    explanation: q.explanation,
    imgUrl: q.imgUrl ?? undefined,
    choices: q.choices.map((c) => ({ choiceId: c.id, choiceText: c.text })),
  }));
}
