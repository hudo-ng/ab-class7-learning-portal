import { db } from "@/db/index";
import { topics, questions, choices } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getPracticeQuestionsByTopicSlug(
  topicSlug: string,
  limit = 5
) {
  const topic = await db.query.topics.findFirst({
    where: eq(topics.slug, topicSlug),
  });
  if (!topic) {
    return [];
  }

  const response = await db
    .select({
      questionId: questions.id,
      prompt: questions.prompt,
      explanation: questions.explanation,
      imgUrl: questions.imgUrl,
      choiceId: choices.id,
      text: choices.text,
    })
    .from(questions)
    .innerJoin(choices, eq(questions.id, choices.questionId))
    .where(eq(questions.topicId, topic.id))
    .limit(limit * 4);

  const map = new Map<string, any>();

  for (const row of response) {
    if (!map.has(row.questionId)) {
      map.set(row.questionId, {
        questionId: row.questionId,
        prompt: row.prompt,
        explanation: row.explanation,
        imgUrl: row.imgUrl,
        choices: [],
      });
    }
    map.get(row.questionId).choices.push({
      choiceId: row.choiceId,
      text: row.text,
    });
  }
  const questionsArray = Array.from(map.values()).slice(0, limit);
  return { questions: questionsArray, topicTitle: topic.title };
}
