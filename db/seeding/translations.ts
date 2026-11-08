import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../index";
import {
  topics,
  topicContent,
  topicTranslations,
  topicContentTranslations,
} from "../schema";

/*
 * Lesson translation files: db/data/translations/<locale>/lessons/<slug>.json
 *
 * {
 *   "topic":  { "en": "Road Signs", "sourceHash": "...", "title": "...", "status": "draft" },
 *   "blocks": [
 *     { "en": { "title": "...", "body": "..." }, "sourceHash": "...",
 *       "title": "...", "body": "...", "status": "draft" | "approved" }
 *   ]
 * }
 *
 * "en" is a read-only reference for the translator/reviewer.
 * "sourceHash" is the md5 of the English the translation was made from; the
 * site only shows a translation while it still matches the current English.
 * Blocks are matched to lessons by position.
 */

type Status = "draft" | "approved";

interface TopicEntry {
  en: string;
  sourceHash: string;
  title: string;
  status: Status;
}

interface BlockEntry {
  en: { title: string; body: string };
  sourceHash: string;
  title: string;
  body: string;
  status: Status;
}

interface TranslationFile {
  topic: TopicEntry;
  blocks: BlockEntry[];
}

export const TRANSLATION_ROOT = path.join(process.cwd(), "db", "data", "translations");

// Must match the SQL in db/queries/localized.ts
export const md5 = (s: string) =>
  crypto.createHash("md5").update(s, "utf8").digest("hex");
const blockHash = (title: string, body: string) => md5(`${title}\n${body}`);

const lessonDir = (locale: string) =>
  path.join(TRANSLATION_ROOT, locale, "lessons");

export function assertLocale(locale: string | undefined): asserts locale is string {
  if (!locale || !/^[a-z]{2}(-[A-Z]{2})?$/.test(locale)) {
    throw new Error('Pass a locale, e.g. "vi"');
  }
  if (locale === "en") throw new Error("English is the source language");
}

async function loadEnglish() {
  const allTopics = await db.select().from(topics).orderBy(asc(topics.slug));
  const blocks = await db
    .select()
    .from(topicContent)
    .orderBy(asc(topicContent.topicId), asc(topicContent.order));
  return allTopics.map((t) => ({
    ...t,
    blocks: blocks.filter((b) => b.topicId === t.id),
  }));
}

function readFile(file: string): TranslationFile | null {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as TranslationFile;
}

/**
 * Create or refresh translation files from the current English lessons.
 * Existing translations are kept; any block whose English changed gets the
 * new English reference + hash and goes back to "draft" for re-review.
 */
export async function writeLessonTemplates(locale: string | undefined) {
  assertLocale(locale);
  const dir = lessonDir(locale);
  fs.mkdirSync(dir, { recursive: true });

  for (const topic of await loadEnglish()) {
    const file = path.join(dir, `${topic.slug}.json`);
    const old = readFile(file);
    let changed = 0;

    const topicHash = md5(topic.title);
    const oldTopic = old?.topic;
    const topicEntry: TopicEntry =
      oldTopic && oldTopic.sourceHash === topicHash
        ? oldTopic
        : {
            en: topic.title,
            sourceHash: topicHash,
            title: oldTopic?.title ?? "",
            status: "draft",
          };
    if (topicEntry !== oldTopic) changed++;

    const blocks = topic.blocks.map((b, i): BlockEntry => {
      const hash = blockHash(b.title, b.body);
      const prev = old?.blocks?.[i];
      if (prev && prev.sourceHash === hash) return prev;
      changed++;
      return {
        en: { title: b.title, body: b.body },
        sourceHash: hash,
        title: prev?.title ?? "",
        body: prev?.body ?? "",
        status: "draft",
      };
    });

    if (!old || changed > 0 || old.blocks.length !== blocks.length) {
      fs.writeFileSync(
        file,
        JSON.stringify({ topic: topicEntry, blocks }, null, 2) + "\n",
      );
    }
    console.log(
      `${locale}/lessons/${topic.slug}.json: ` +
        (old ? `${changed} entr${changed === 1 ? "y" : "ies"} new or reset to draft` : "created"),
    );
  }
}

// Translations must keep the lesson's markdown structure
function markdownShape(md: string) {
  const count = (re: RegExp) => (md.match(re) ?? []).length;
  return {
    "list items": count(/^\s*(?:[-*]|\d+\.)\s/gm),
    "table rows": count(/^\s*\|/gm),
    headings: count(/^#{1,6}\s/gm),
  };
}

function shapeProblems(en: string, tr: string) {
  const a = markdownShape(en);
  const b = markdownShape(tr);
  const problems = (Object.keys(a) as (keyof typeof a)[])
    .filter((k) => a[k] !== b[k])
    .map((k) => `${k} ${b[k]} (English has ${a[k]})`);
  if ((tr.match(/\*\*/g) ?? []).length % 2 !== 0) problems.push("unbalanced **bold**");
  return problems;
}

/** Validate translation files and upsert them. Untranslated (empty) entries are skipped. */
export async function importLessonTranslations(
  locale: string | undefined,
  { dryRun = false } = {},
) {
  assertLocale(locale);
  const dir = lessonDir(locale);
  if (!fs.existsSync(dir)) throw new Error(`No folder ${dir}`);

  const english = new Map((await loadEnglish()).map((t) => [t.slug, t]));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const errors: string[] = [];
  const plans: {
    slug: string;
    topicId: string;
    topicRow: typeof topicTranslations.$inferInsert | null;
    blockRows: (typeof topicContentTranslations.$inferInsert)[];
    blockCount: number;
    stale: number;
  }[] = [];

  // Validate everything before writing anything
  for (const f of files) {
    const slug = f.replace(/\.json$/, "");
    const where = `${locale}/lessons/${f}`;
    const en = english.get(slug);
    if (!en) {
      errors.push(`${where}: no topic with slug "${slug}"`);
      continue;
    }
    const data = readFile(path.join(dir, f))!;
    if (!Array.isArray(data.blocks)) {
      errors.push(`${where}: blocks must be an array`);
      continue;
    }
    if (data.blocks.length !== en.blocks.length) {
      errors.push(
        `${where}: has ${data.blocks.length} blocks, English lesson has ${en.blocks.length}. ` +
          `Run the template command to resync.`,
      );
      continue;
    }

    let stale = 0;
    const isStatus = (s: unknown): s is Status => s === "draft" || s === "approved";

    let topicRow: (typeof plans)[number]["topicRow"] = null;
    const tt = data.topic;
    if (tt?.title?.trim()) {
      if (!isStatus(tt.status)) errors.push(`${where}: topic.status must be draft or approved`);
      if (tt.sourceHash !== md5(en.title)) stale++;
      topicRow = {
        topicId: en.id,
        locale,
        title: tt.title.trim(),
        status: tt.status,
        sourceHash: tt.sourceHash,
      };
    }

    const blockRows: (typeof plans)[number]["blockRows"] = [];
    data.blocks.forEach((b, i) => {
      const at = `${where} block ${i + 1}`;
      const title = b.title?.trim() ?? "";
      const body = b.body?.trim() ?? "";
      if (!title && !body) {
        if (b.status === "approved") errors.push(`${at}: approved but empty`);
        return; // not translated yet
      }
      if (!isStatus(b.status)) errors.push(`${at}: status must be draft or approved`);
      if (!title || !body) errors.push(`${at}: needs both title and body`);
      const problems = shapeProblems(en.blocks[i].body, body);
      if (problems.length) {
        const msg = `${at}: markdown differs from English: ${problems.join(", ")}`;
        if (b.status === "approved") errors.push(msg);
        else console.warn(`warning: ${msg}`);
      }
      if (b.sourceHash !== blockHash(en.blocks[i].title, en.blocks[i].body)) stale++;
      blockRows.push({
        topicId: en.id,
        order: en.blocks[i].order,
        locale,
        title,
        body,
        status: b.status,
        sourceHash: b.sourceHash,
      });
    });

    plans.push({ slug, topicId: en.id, topicRow, blockRows, blockCount: en.blocks.length, stale });
  }

  if (errors.length) {
    throw new Error(`\n  ${errors.join("\n  ")}`);
  }

  for (const p of plans) {
    const approved = p.blockRows.filter((r) => r.status === "approved").length;
    const summary =
      `${locale} ${p.slug}: title ${p.topicRow ? p.topicRow.status : "missing"}, ` +
      `${p.blockRows.length}/${p.blockCount} blocks translated (${approved} approved)` +
      (p.stale ? `, ${p.stale} stale (English changed; hidden until re-translated)` : "");

    if (dryRun) {
      console.log(`[dry run] ${summary}`);
      continue;
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(topicTranslations)
        .where(and(eq(topicTranslations.topicId, p.topicId), eq(topicTranslations.locale, locale)));
      if (p.topicRow) await tx.insert(topicTranslations).values(p.topicRow);

      // File is the source of truth for this topic + locale
      await tx
        .delete(topicContentTranslations)
        .where(
          and(
            eq(topicContentTranslations.topicId, p.topicId),
            eq(topicContentTranslations.locale, locale),
          ),
        );
      if (p.blockRows.length) await tx.insert(topicContentTranslations).values(p.blockRows);
    });
    console.log(summary);
  }
}
