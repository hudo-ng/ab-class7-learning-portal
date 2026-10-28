import { db } from "@/db/index";
import { questions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getMockExamQuestions(limit: number) {
  const rows = await db.query.questions.findMany({
    where: eq(questions.isActive, true),
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

  return rows.map((q) => ({
    questionId: q.id,
    prompt: q.prompt,
    explanation: q.explanation,
    imgUrl: q.imgUrl ?? undefined,
    choices: q.choices.map((c) => ({ choiceId: c.id, choiceText: c.text })),
  }));
}
