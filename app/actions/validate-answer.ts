"use server";

import { validateAnswer } from "@/db/queries/validate-answer";
import { requireApprovedUser } from "@/lib/auth";
import { db } from "@/db";
import { answerAttempts } from "@/db/schema";

export async function validateUserAnswer(fd: FormData) {
  const session = await requireApprovedUser();
  const questionId = fd.get("questionId") as string;
  const choiceId = fd.get("choiceId") as string;

  if (!questionId || !choiceId) {
    throw new Error("Missing data");
  }
  const result = await validateAnswer(questionId, choiceId);

  await db.insert(answerAttempts).values({
    userId: session.user.id,
    questionId,
    isCorrect: result.isCorrect,
    source: "practice",
  });

  return result;
}
