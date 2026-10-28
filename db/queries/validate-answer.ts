import { db } from "@/db/index";
import { questions, choices } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function validateAnswer(questionId: string, choiceId: string) {
  const rows = await db
    .select({
      choiceId: choices.id,
      isCorrect: choices.isCorrect,
      explanation: questions.explanation,
    })
    .from(choices)
    .innerJoin(questions, eq(choices.questionId, questions.id))
    .where(eq(choices.questionId, questionId));

  const picked = rows.find((r) => r.choiceId === choiceId);
  if (!picked) {
    throw new Error("Invalid choice for this question");
  }

  const correct = rows.find((r) => r.isCorrect);
  if (!correct) {
    throw new Error("No correct answer found");
  }

  return {
    isCorrect: picked.isCorrect,
    explanation: picked.explanation,
    correctChoiceId: correct.choiceId,
  };
}
