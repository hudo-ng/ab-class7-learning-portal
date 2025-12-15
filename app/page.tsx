import { getPracticeQuestionsByTopicSlug } from "@/db/queries/pratice";

export default async function Home() {
  const data = await getPracticeQuestionsByTopicSlug("road-signs", 5);
  return (
    <pre>
      {JSON.stringify(data, null, 2)}
    </pre>
  )}
