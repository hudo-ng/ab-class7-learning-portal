"use server";

import { db } from "@/db/index";
import { choices, questions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

interface Answer {
  questionId: string;
  choiceId: string;
}

export async function gradeMockExam(answers: Answer[]) {
  if (!answers || answers.length === 0) {
    throw new Error("No answers provided");
  }
  const choiceIds = answers.map((a) => a.choiceId);

  const rows = await db
    .select({
      choiceId: choices.id,
      isCorrect: choices.isCorrect,
      questionId: choices.questionId,
    })
    .from(choices)
    .where(inArray(choices.id, choiceIds));

  const result = new Map(rows.map((r) => [r.choiceId, r]));

  const correctChoices = await db
    .select({
      questionId: choices.questionId,
      choiceId: choices.id,
    })
    .from(choices)
    .where(eq(choices.isCorrect, true));

  let correctCount = 0;

  const graded = answers.map((answer) => {
    const record = result.get(answer.choiceId);
    const isCorrect = record?.isCorrect ?? false;
    const correctChoiceId = correctChoices.find(
      (c) => c.questionId === answer.questionId
    )?.choiceId;

    if (isCorrect) {
      correctCount++;
    }
    return {
      questionId: answer.questionId,
      choiceId: answer.choiceId,
      correctChoiceId: correctChoiceId,
      isCorrect,
    };
  });

  return {
    total: answers.length,
    correct: correctCount,
    score: Math.round((correctCount / answers.length) * 100),
    details: graded,
  };
}
