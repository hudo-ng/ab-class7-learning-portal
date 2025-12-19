"use server";

import { db } from "@/db/index";
import { topics } from "@/db/schema";
import { eq } from "drizzle-orm";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createTopic(fd: FormData) {
  const title = String(fd.get("title") || "").trim();
  let slug = String(fd.get("slug") || "").trim();
  if (!title) {
    throw new Error("Title is required");
  }
  if (!slug) {
    slug = slugify(title);
  }

  const existing = await db.query.topics.findFirst({
    where: eq(topics.slug, slug),
  });
  if (existing) {
    throw new Error("Slug already exists");
  }

  await db.insert(topics).values({ title, slug });

  return { ok: true };
}
