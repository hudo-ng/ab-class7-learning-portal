import { getPracticeQuestionsByTopicSlug } from "@/db/queries/pratice";
import { notFound } from "next/navigation";
import { PracticeCards } from "@/components/other/PraticeCards";

interface Props {
  params: { slug: string };
}

export default async function PracticePage({ params }: Props) {
  const { slug } = await params;
  let data;

  try {
    data = await getPracticeQuestionsByTopicSlug(slug, 5);
  } catch (error) {
    return notFound();
  }

  if (!data || Array.isArray(data)) {
    return notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">{data.topicTitle}</h1>
      <PracticeCards questions={data.questions} />
    </main>
  );
}
