"use server";

import { db } from "@/db/index";
import { questions, choices } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { and, eq, notInArray } from "drizzle-orm";

interface QuestionData {
  id: string;
  topicId: string;
  prompt: string;
  explanation: string;
  imgUrl?: string;
  isActive: boolean;
  choices: {
    id?: string; // missing = new choice
    text: string;
    isCorrect: boolean;
  }[];
}

export async function editQuestion(data: QuestionData) {
  await requireAdmin();
  if (!data.prompt.trim()) {
    throw new Error("Prompt is required");
  }
  if (data.choices.length < 2) {
    throw new Error("At least two choices required");
  }
  if (data.choices.some((c) => !c.text.trim())) {
    throw new Error("Choices cannot be empty");
  }
  if (data.choices.filter((c) => c.isCorrect).length !== 1) {
    throw new Error("Exactly one correct answer required");
  }

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(questions)
      .set({
        prompt: data.prompt,
        topicId: data.topicId,
        explanation: data.explanation,
        imgUrl: data.imgUrl || null,
        isActive: data.isActive,
      })
      .where(eq(questions.id, data.id))
      .returning({ id: questions.id });

    if (updated.length === 0) {
      throw new Error("Question not found");
    }

    const existing = await tx
      .select({ id: choices.id })
      .from(choices)
      .where(eq(choices.questionId, data.id));
    const existingIds = new Set(existing.map((c) => c.id));

    const keptIds = data.choices.flatMap((c) => (c.id ? [c.id] : []));
    if (keptIds.some((id) => !existingIds.has(id))) {
      throw new Error("Invalid choice for this question");
    }

    // Remove choices the admin deleted
    await tx
      .delete(choices)
      .where(
        keptIds.length > 0
          ? and(
              eq(choices.questionId, data.id),
              notInArray(choices.id, keptIds),
            )
          : eq(choices.questionId, data.id),
      );

    // Update kept choices, insert new ones
    for (const [i, c] of data.choices.entries()) {
      if (c.id) {
        await tx
          .update(choices)
          .set({ text: c.text, isCorrect: c.isCorrect, sortOrder: i })
          .where(eq(choices.id, c.id));
      } else {
        await tx.insert(choices).values({
          questionId: data.id,
          text: c.text,
          isCorrect: c.isCorrect,
          sortOrder: i,
        });
      }
    }
  });

  return { ok: true };
}
