"use server";

import { validateAnswer } from "@/db/queries/validate-answer";

export async function validateUserAnswer(fd: FormData) {
  const questionId = fd.get("questionId") as string;
  const choiceId = fd.get("choiceId") as string;

  if (!questionId || !choiceId) {
    throw new Error("Missing data");
  }
  return validateAnswer(questionId, choiceId);
}
