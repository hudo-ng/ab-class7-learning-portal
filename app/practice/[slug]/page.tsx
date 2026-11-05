import { getPracticeQuestionsByTopicSlug } from "@/db/queries/practice";
import { notFound } from "next/navigation";
import { PracticeCards } from "@/components/other/PracticeCards";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

interface Props {
  params: { slug: string };
}

export default async function PracticePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("Common");
  if (!session) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 space-y-3">
        <p className="font-medium">{t("practicePromptTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("signupPromptBody")}</p>
        <Button asChild>
          <a href="/register">{t("createFreeAccount")}</a>
        </Button>
      </div>
    );
  }

  if (!session.user?.isApproved) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 space-y-3">
        <p className="font-medium">{t("practicePromptTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("notApproved")}</p>
      </div>
    );
  }

  const { slug } = await params;
  let data;

  try {
    data = await getPracticeQuestionsByTopicSlug(slug, session.user.id);
  } catch {
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
