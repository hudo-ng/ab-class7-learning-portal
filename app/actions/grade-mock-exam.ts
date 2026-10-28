"use server";

import { db } from "@/db/index";
import { choices } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { requireApprovedUser } from "@/lib/auth";

interface Answer {
  questionId: string;
  choiceId: string | null;
}

const MAX_QUESTIONS = 100;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function gradeMockExam(answers: Answer[]) {
  await requireApprovedUser();

  if (
    !Array.isArray(answers) ||
    answers.length === 0 ||
    answers.length > MAX_QUESTIONS
  ) {
    throw new Error("Invalid answers");
  }

  // One answer per question; unanswered = null
  const byQuestion = new Map<string, string | null>();
  for (const a of answers) {
    if (typeof a?.questionId !== "string" || !UUID_RE.test(a.questionId)) {
      throw new Error("Invalid answers");
    }
    const choiceId =
      typeof a.choiceId === "string" && UUID_RE.test(a.choiceId)
        ? a.choiceId
        : null;
    byQuestion.set(a.questionId, choiceId);
  }
  const questionIds = [...byQuestion.keys()];

  // The correct choice for each submitted question
  const correctRows = await db
    .select({ questionId: choices.questionId, choiceId: choices.id })
    .from(choices)
    .where(
      and(
        inArray(choices.questionId, questionIds),
        eq(choices.isCorrect, true),
      ),
    );

  const correctByQuestion = new Map(
    correctRows.map((r) => [r.questionId, r.choiceId]),
  );

  let correctCount = 0;
  const details = questionIds.map((questionId) => {
    const choiceId = byQuestion.get(questionId) ?? null;
    const correctChoiceId = correctByQuestion.get(questionId) ?? null;
    const isCorrect = choiceId !== null && choiceId === correctChoiceId;
    if (isCorrect) correctCount++;
    return { questionId, choiceId, correctChoiceId, isCorrect };
  });

  return {
    total: questionIds.length,
    correct: correctCount,
    score: Math.round((correctCount / questionIds.length) * 100),
    details,
  };
}
