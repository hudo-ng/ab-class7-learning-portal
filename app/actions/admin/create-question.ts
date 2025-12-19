"use server";
import { db } from "@/db/index";
import { questions, choices } from "@/db/schema";

interface Question {
  topicId: string;
  prompt: string;
  explanation: string;
  imgUrl: string | undefined;
  choices: { text: string; isCorrect: boolean }[];
}

export async function createQuesion(data: Question) {
  if (!data.prompt.trim()) {
    throw new Error("Question prompt is required");
  }

  if (data.choices.length < 2) {
    throw new Error("At least two choices are are requried");
  }

  if (data.choices.filter((c) => c.isCorrect === true).length !== 1) {
    throw new Error("Only one correct choice for each question");
  }

  await db.transaction(async (tx) => {
    const [question] = await tx
      .insert(questions)
      .values({
        topicId: data.topicId,
        prompt: data.prompt,
        explanation: data.explanation,
        imgUrl: data.imgUrl || null,
      })
      .returning({ id: questions.id });

    await tx.insert(choices).values(
      data.choices.map((c, idx) => ({
        questionId: question.id,
        text: c.text,
        isCorrect: c.isCorrect,
        sortOrder: idx,
      }))
    );
  });
}
