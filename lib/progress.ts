import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getTopicProgress } from "@/db/queries/progress";
import type { ProgressData } from "@/components/other/TopicProgress";

/**
 * Practice progress keyed by topic slug, or null for guests and accounts that
 * aren't approved yet (they can't practise, so there is nothing to show).
 */
export async function getProgressBySlug(
  locale: string,
): Promise<Map<string, ProgressData> | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isApproved) return null;

  const rows = await getTopicProgress(session.user.id, locale);
  return new Map(
    rows.map((r) => [
      r.slug,
      { answered: r.answered, correct: r.correct, complete: r.complete },
    ]),
  );
}
