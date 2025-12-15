import { db } from "@/db/index";
import { questions, choices } from "@/db/schema";
import { eq } from "drizzle-orm";

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

  return {
    isCorrect: choice.isCorrect,
    explanation: question.explanation,
  };
}
