"use server";

import { db } from "@/db/index";
import { questions, choices } from "@/db/schema";
import { eq } from "drizzle-orm";

interface QuestionData {
  id: string;
  topicId: string;
  prompt: string;
  explanation: string;
  imgUrl?: string;
  isActive: boolean;
  choices: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

export async function EditQuestion(data: QuestionData) {
  if (!data.prompt.trim()) {
    throw new Error("Prompt is required");
  }
  if (data.choices.length < 2) {
    throw new Error("At least two choices required");
  }

  if (data.choices.filter((c) => c.isCorrect).length !== 1) {
    throw new Error("Exactly one correct answer required");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(questions)
      .set({
        prompt: data.prompt,
        topicId: data.topicId,
        explanation: data.explanation,
        imgUrl: data.imgUrl || null,
        isActive: data.isActive,
      })
      .where(eq(questions.id, data.id));

    for (const [i, c] of data.choices.entries()) {
      await tx
        .update(choices)
        .set({
          isCorrect: c.isCorrect,
          text: c.text,
          sortOrder: i,
        })
        .where(eq(choices.id, c.id));
    }
  });

  return { ok: true };
}
