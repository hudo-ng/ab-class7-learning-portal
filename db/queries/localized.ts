import { db } from "@/db/index";
import {
  topics,
  topicContent,
  topicTranslations,
  topicContentTranslations,
  questions,
  questionTranslations,
} from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { defaultLocale } from "@/i18n/config";

/*
 * Localized reads with English fallback.
 * A translation is used only when it is approved AND its source_hash matches
 * the md5 of the current English text, so editing English automatically hides
 * stale translations until they are re-reviewed.
 */

const topicJoin = (locale: string) =>
  and(
    eq(topicTranslations.topicId, topics.id),
    eq(topicTranslations.locale, locale),
    eq(topicTranslations.status, "approved"),
    sql`${topicTranslations.sourceHash} = md5(${topics.title})`,
  );

const localizedTopicFields = {
  id: topics.id,
  slug: topics.slug,
  title: sql<string>`coalesce(${topicTranslations.title}, ${topics.title})`,
};

export async function getLocalizedTopics(locale: string) {
  return db
    .select(localizedTopicFields)
    .from(topics)
    .leftJoin(topicTranslations, topicJoin(locale));
}

export async function getLocalizedTopicBySlug(slug: string, locale: string) {
  const [topic] = await db
    .select(localizedTopicFields)
    .from(topics)
    .leftJoin(topicTranslations, topicJoin(locale))
    .where(eq(topics.slug, slug))
    .limit(1);
  return topic ?? null;
}

export async function getLocalizedLessonBlocks(topicId: string, locale: string) {
  const tr = topicContentTranslations;
  return db
    .select({
      id: topicContent.id,
      type: topicContent.type,
      imgUrl: topicContent.imgUrl,
      title: sql<string>`coalesce(${tr.title}, ${topicContent.title})`,
      body: sql<string>`coalesce(${tr.body}, ${topicContent.body})`,
      translated: sql<boolean>`${tr.topicId} is not null`,
    })
    .from(topicContent)
    .leftJoin(
      tr,
      and(
        eq(tr.topicId, topicContent.topicId),
        eq(tr.order, topicContent.order),
        eq(tr.locale, locale),
        eq(tr.status, "approved"),
        sql`${tr.sourceHash} = md5(${topicContent.title} || E'\n' || ${topicContent.body})`,
      ),
    )
    .where(eq(topicContent.topicId, topicId))
    .orderBy(topicContent.order);
}

// Must match questionHash() in db/seeding/question-translations.ts
const questionSourceHash = sql`md5(
  ${questions.prompt} || E'
' || ${questions.explanation} || E'
' ||
  (select string_agg(c.text, E'
' order by c.sort_order, c.id)
   from choices c where c.question_id = ${questions.id})
)`;

interface QuestionRow {
  id: string;
  prompt: string;
  explanation: string;
  choices: { id: string; text: string }[];
}

/**
 * Overlay approved, up-to-date translations onto questions already loaded in
 * English. Choices are matched by position (sort order); a translation whose
 * choice count no longer matches is ignored.
 */
export async function localizeQuestions<T extends QuestionRow>(
  rows: T[],
  locale: string,
): Promise<(T & { translated: boolean })[]> {
  const untranslated = () => rows.map((r) => ({ ...r, translated: false }));
  if (locale === defaultLocale || rows.length === 0) return untranslated();

  const qt = questionTranslations;
  const found = await db
    .select({
      questionId: qt.questionId,
      prompt: qt.prompt,
      explanation: qt.explanation,
      choices: qt.choices,
    })
    .from(qt)
    .innerJoin(questions, eq(questions.id, qt.questionId))
    .where(
      and(
        inArray(
          qt.questionId,
          rows.map((r) => r.id),
        ),
        eq(qt.locale, locale),
        eq(qt.status, "approved"),
        sql`${qt.sourceHash} = ${questionSourceHash}`,
      ),
    );
  const byId = new Map(found.map((f) => [f.questionId, f]));

  return rows.map((r) => {
    const tr = byId.get(r.id);
    if (!tr || tr.choices.length !== r.choices.length) {
      return { ...r, translated: false };
    }
    return {
      ...r,
      prompt: tr.prompt,
      explanation: tr.explanation,
      choices: r.choices.map((c, i) => ({ ...c, text: tr.choices[i] })),
      translated: true,
    };
  });
}
