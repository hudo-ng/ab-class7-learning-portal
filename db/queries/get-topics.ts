"use server";

import { db } from "@/db/index";
import { topics } from "@/db/schema";
import { asc } from "drizzle-orm";

export default async function getTopics() {
  return await db
    .select({
      id: topics.id,
      slug: topics.slug,
      title: topics.title,
    })
    .from(topics)
    .orderBy(asc(topics.title));
}
