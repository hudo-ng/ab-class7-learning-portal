import { db } from "@/db/index";
import { questions, choices } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function validateAnswer(questionId: string, choiceId: string) {
  const [choice] = await db
    .select({ isCorrect: choices.isCorrect })
    .from(choices)
    .where(eq(choices.id, choiceId));

  if (!choice) {
    throw new Error("Invalid choice ID");
  }

  const [question] = await db
    .select({ explanation: questions.explanation })
    .from(questions)
    .where(eq(questions.id, questionId));

  if (!question) {
    throw new Error("Invalid question ID");
  }

  const correctChoice = await db.query.choices.findFirst({
    where: and(eq(choices.questionId, questionId), eq(choices.isCorrect, true)),
  });
  if (!correctChoice) {
    throw new Error("No correct answer found");
  }

  return {
    isCorrect: choice.isCorrect,
    explanation: question.explanation,
    correctChoiceId: correctChoice.id,
  };
}
