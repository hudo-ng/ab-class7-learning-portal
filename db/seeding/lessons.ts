import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../index";
import { topics, topicContent, topicContentType } from "../schema";

const LESSON_DIR = path.join(process.cwd(), "db", "data", "lessons");

type BlockType = (typeof topicContentType.enumValues)[number];

interface BlockData {
  type: BlockType;
  title: string;
  body: string;
  imgUrl?: string;
}

interface LessonFile {
  topic: { slug: string; title: string };
  blocks: BlockData[];
}

export function listLessonFiles() {
  if (!fs.existsSync(LESSON_DIR)) return [];
  return fs
    .readdirSync(LESSON_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
}

function loadLessonFile(file: string): LessonFile {
  const data = JSON.parse(
    fs.readFileSync(path.join(LESSON_DIR, file), "utf8"),
  ) as LessonFile;

  const fail = (msg: string): never => {
    throw new Error(`lessons/${file}: ${msg}`);
  };

  if (!data.topic?.slug || !data.topic?.title) {
    fail("topic.slug and topic.title are required");
  }
  if (!Array.isArray(data.blocks) || data.blocks.length === 0) {
    fail("blocks must be a non-empty array");
  }

  data.blocks.forEach((b, i) => {
    const where = `block ${i + 1}`;
    if (!topicContentType.enumValues.includes(b.type)) {
      fail(
        `${where}: type must be one of ${topicContentType.enumValues.join(", ")}`,
      );
    }
    if (!b.title?.trim()) fail(`${where}: title is required`);
    if (!b.body?.trim()) fail(`${where}: body is required`);
    if (
      b.imgUrl?.startsWith("/") &&
      !fs.existsSync(path.join(process.cwd(), "public", b.imgUrl))
    ) {
      fail(`${where}: image public${b.imgUrl} not found`);
    }
  });

  return data;
}

/**
 * Import lessons from db/data/lessons/*.json.
 * The file is the source of truth: each topic's blocks are replaced with
 * the blocks in its file, in file order. Topics without a file are untouched.
 */
export async function importLessons(
  files: string[] = listLessonFiles(),
  { dryRun = false } = {},
) {
  // Validate every file before writing anything
  const data = files.map(loadLessonFile);

  for (const { topic, blocks } of data) {
    if (dryRun) {
      const existing = await db.query.topics.findFirst({
        where: eq(topics.slug, topic.slug),
      });
      const current = existing
        ? await db.$count(topicContent, eq(topicContent.topicId, existing.id))
        : 0;
      console.log(
        `[dry run] lessons ${topic.slug}: ${existing ? "topic exists" : "new topic"}, ` +
          `would replace ${current} block(s) with ${blocks.length}`,
      );
      continue;
    }

    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(topics)
        .values({ slug: topic.slug, title: topic.title })
        .onConflictDoUpdate({
          target: topics.slug,
          set: { title: topic.title },
        })
        .returning({ id: topics.id });

      await tx.delete(topicContent).where(eq(topicContent.topicId, row.id));
      await tx.insert(topicContent).values(
        blocks.map((b, i) => ({
          topicId: row.id,
          type: b.type,
          title: b.title.trim(),
          body: b.body.trim(),
          imgUrl: b.imgUrl || null,
          order: i,
        })),
      );
    });

    console.log(`lessons ${topic.slug}: ${blocks.length} block(s) imported`);
  }
}
