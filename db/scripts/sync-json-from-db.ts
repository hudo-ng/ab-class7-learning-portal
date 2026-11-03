/**
 * Rewrite db/data/<topic>.json from the database, after reviewing questions
 * in the admin panel: approvals, edits, deletions, and questions that were
 * only ever added through the admin panel. Only touches local files.
 *
 *   npx tsx ./db/scripts/sync-json-from-db.ts --dry-run [topic-slug ...]
 *   npx tsx ./db/scripts/sync-json-from-db.ts [topic-slug ...]
 */
import fs from "node:fs";
import path from "node:path";
import { asc, eq } from "drizzle-orm";
import { db } from "../index";
import { topics, questions } from "../schema";
import { dryRun, run } from "../seeding/run";

const DATA_DIR = path.join(process.cwd(), "db", "data");

interface FileQuestion {
  prompt: string;
  imgUrl?: string;
}

const key = (prompt: string, imgUrl?: string | null) =>
  `${prompt.trim()}\n${imgUrl ?? ""}`;

async function syncTopic(slug: string) {
  const file = path.join(DATA_DIR, `${slug}.json`);
  const topic = await db.query.topics.findFirst({ where: eq(topics.slug, slug) });
  if (!topic) throw new Error(`Unknown topic: ${slug}`);

  const existing: { questions: FileQuestion[] } = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf8"))
    : { questions: [] };

  const rows = await db.query.questions.findMany({
    where: eq(questions.topicId, topic.id),
    orderBy: [asc(questions.createdAt)],
    with: { choices: { orderBy: (c, { asc }) => [asc(c.sortOrder)] } },
  });

  // Keep the file's order; database-only questions go at the end
  const position = new Map(
    existing.questions.map((q, i) => [key(q.prompt, q.imgUrl), i]),
  );
  rows.sort(
    (a, b) =>
      (position.get(key(a.prompt, a.imgUrl)) ?? Infinity) -
      (position.get(key(b.prompt, b.imgUrl)) ?? Infinity),
  );

  const dbKeys = new Set(rows.map((r) => key(r.prompt, r.imgUrl)));
  const removed = existing.questions.filter(
    (q) => !dbKeys.has(key(q.prompt, q.imgUrl)),
  ).length;
  const added = rows.filter((r) => !position.has(key(r.prompt, r.imgUrl))).length;
  const drafts = rows.filter((r) => !r.isActive).length;

  console.log(
    `${slug}: ${rows.length} question(s) (${drafts} inactive), ` +
      `${added} only in database, ${removed} no longer in database`,
  );
  if (dryRun) return;

  const out = {
    topic: { slug: topic.slug, title: topic.title },
    questions: rows.map((r) => ({
      prompt: r.prompt,
      ...(r.imgUrl ? { imgUrl: r.imgUrl } : {}),
      explanation: r.explanation,
      ...(r.difficulty !== 1 ? { difficulty: r.difficulty } : {}),
      ...(r.isActive ? {} : { active: false }),
      choices: r.choices.map((c) => ({
        text: c.text,
        ...(c.isCorrect ? { correct: true } : {}),
      })),
    })),
  };
  fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
}

run(async () => {
  const slugs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const all = slugs.length
    ? slugs
    : (await db.select({ slug: topics.slug }).from(topics)).map((t) => t.slug);
  for (const slug of all) await syncTopic(slug);
});
