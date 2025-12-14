import { db } from "./index";
import { topics, questions, choices } from "./schema";

async function main() {
  const [topic] = await db
    .insert(topics)
    .values({
      slug: "road-signs",
      title: "Road Signs",
    })
    .returning();

  const [question] = await db
    .insert(questions)
    .values({
      topicId: topic.id,
      prompt: "What does a red octagonal sign indicate?",
      explanation:
        "A red octagonal sign indicates a stop sign, requiring drivers to come to a complete stop.",
      difficulty: 1,
    })
    .returning();

  await db.insert(choices).values([
    {
      questionId: question.id,
      text: "Yield",
      isCorrect: false,
      sortOrder: 1,
    },
    { questionId: question.id, text: "Stop", isCorrect: true, sortOrder: 2 },
    {
      questionId: question.id,
      text: "Do Not Enter",
      isCorrect: false,
      sortOrder: 3,
    },
    {
      questionId: question.id,
      text: "Speed Limit",
      isCorrect: false,
      sortOrder: 4,
    },
  ]);

  console.log("Seeding completed.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
