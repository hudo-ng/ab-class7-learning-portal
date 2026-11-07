import { db } from "@/db";
import { getLocalizedTopics } from "@/db/queries/localized";
import { MASTERY_CORRECT, MASTERY_WINDOW } from "@/lib/exam-blueprint";
import { sql } from "drizzle-orm";

export type TopicProgress = Awaited<
  ReturnType<typeof getTopicProgress>
>[number];

export async function getTopicProgress(userId: string, locale = "en") {
  const [allTopics, rows] = await Promise.all([
    getLocalizedTopics(locale).then((list) =>
      list.sort((a, b) => a.title.localeCompare(b.title, locale)),
    ),
    db.execute<{ topic_id: string; answered: number; correct: number }>(sql`
            with latest as (
        select distinct on (a.question_id)
               a.question_id, a.is_correct, a.created_at, q.topic_id
        from answer_attempts a
        join questions q on q.id = a.question_id
        where a.user_id = ${userId} and a.source = 'practice' and q.is_active
        order by a.question_id, a.created_at desc
      ),
      recent as (
        select topic_id, is_correct,
               row_number() over (partition by topic_id order by created_at desc) as rn
        from latest
      )
      select topic_id,
             count(*)::int as answered,
             (count(*) filter (where is_correct))::int as correct
      from recent
      where rn <= ${MASTERY_WINDOW}
      group by topic_id
            
            `),
  ]);

  const byTopic = new Map(rows.map((r) => [r.topic_id, r]));
  return allTopics.map((t) => {
    const answered = byTopic.get(t.id)?.answered ?? 0;
    const correct = byTopic.get(t.id)?.correct ?? 0;
    return {
      ...t,
      answered,
      correct,
      complete: answered >= MASTERY_WINDOW && correct >= MASTERY_CORRECT,
    };
  });
}

export async function isMockExamUnlocked(userId: string) {
  return (await getTopicProgress(userId)).every((t) => t.complete);
}
