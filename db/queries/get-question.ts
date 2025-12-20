import { db } from "@/db/index";
import { questions } from "../schema";
import { eq } from "drizzle-orm";

export async function getQuestion(questionId: string) {
  const question = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
    with: {
      choices: {
        orderBy: (c, { asc }) => [asc(c.sortOrder)],
      },
      topic: true,
    },
  });

  if (!question) return null;

  return {
    id: question.id,
    topicId: question.topicId,
    topicTitle: question.topic.title,
    topicSlug: question.topic.slug,
    prompt: question.prompt,
    explanation: question.explanation,
    imgUrl: question.imgUrl ?? "",
    isActive: question.isActive,
    choices: question.choices.map((c) => ({
      id: c.id,
      text: c.text,
      isCorrect: c.isCorrect,
    })),
  };
}
