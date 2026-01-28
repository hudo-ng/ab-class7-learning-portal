import { getPracticeQuestionsByTopicSlug } from "@/db/queries/pratice";
import { notFound } from "next/navigation";
import { PracticeCards } from "@/components/other/PraticeCards";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Button } from "@/components/ui/button";
interface Props {
  params: { slug: string };
}

export default async function PracticePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 space-y-3">
        <p className="font-medium">Want to practice or take the mock exam?</p>
        <p className="text-sm text-muted-foreground">
          Create a free account to unlock practice questions and mock exams.
        </p>
        <Button asChild>
          <a href="/register">Create free account</a>
        </Button>
      </div>
    );
  }

  if (!session.user?.isApproved) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 space-y-3">
        <p className="font-medium">Want to practice or take the mock exam?</p>
        <p className="text-sm text-muted-foreground">
          Your account is not approved yet.
        </p>
      </div>
    );
  }

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
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">{data.topicTitle}</h1>
      <PracticeCards questions={data.questions} />
    </main>
  );
}
