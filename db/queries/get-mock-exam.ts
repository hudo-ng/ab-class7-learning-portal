import { db } from "@/db/index";
import { sql } from "drizzle-orm";
import { questions, choices } from "@/db/schema";

export async function getMockExamQuestions(limit: number) {
  const rows = await db
    .select({
      questionId: questions.id,
      prompt: questions.prompt,
      explanation: questions.explanation,
      choiceId: choices.id,
      choiceText: choices.text,
    })
    .from(questions)
    .innerJoin(choices, sql`${choices.questionId} = ${questions.id}`)
    .orderBy(sql`RANDOM()`)
    .limit(limit * 4);

  const map = new Map<string, any>();

  for (const row of rows) {
    if (!map.has(row.questionId)) {
      map.set(row.questionId, {
        questionId: row.questionId,
        prompt: row.prompt,
        explanation: row.explanation,
        choices: [],
      });
    }
    map.get(row.questionId).choices.push({
      choiceId: row.choiceId,
      choiceText: row.choiceText,
    });
  }
  return Array.from(map.values()).slice(0, limit);
}
