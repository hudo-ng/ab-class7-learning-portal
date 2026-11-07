import { db } from "@/db/index";
import {
  topics,
  topicContent,
  topicTranslations,
  topicContentTranslations,
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

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
