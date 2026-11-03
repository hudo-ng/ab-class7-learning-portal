import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../index";
import { topics, questions, choices } from "../schema";

const DATA_DIR = path.join(process.cwd(), "db", "data");

interface ChoiceData {
  text: string;
  correct?: boolean;
}

interface QuestionData {
  prompt: string;
  explanation: string;
  imgUrl?: string;
  difficulty?: number;
  active?: boolean; // false = draft, imported inactive for review
  choices: ChoiceData[];
}

interface TopicFile {
  topic: { slug: string; title: string };
  questions: QuestionData[];
}

export function listDataFiles() {
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
}

function loadFile(file: string): TopicFile {
  const data = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, file), "utf8"),
  ) as TopicFile;

  const fail = (msg: string): never => {
    throw new Error(`${file}: ${msg}`);
  };

  if (!data.topic?.slug || !data.topic?.title) {
    fail("topic.slug and topic.title are required");
  }
  if (!Array.isArray(data.questions)) {
    fail("questions must be an array");
  }

  const seen = new Set<string>();
  data.questions.forEach((q, i) => {
    const where = `question ${i + 1}`;
    if (!q.prompt?.trim()) fail(`${where}: prompt is required`);
    if (!q.explanation?.trim()) fail(`${where}: explanation is required`);
    if (seen.has(questionKey(q.prompt, q.imgUrl))) {
      fail(`${where}: duplicate prompt and image`);
    }
    seen.add(questionKey(q.prompt, q.imgUrl));
    if (
      q.imgUrl?.startsWith("/") &&
      !fs.existsSync(path.join(process.cwd(), "public", q.imgUrl))
    ) {
      fail(`${where}: image public${q.imgUrl} not found`);
    }
    if (!Array.isArray(q.choices) || q.choices.length < 2) {
      fail(`${where}: needs at least 2 choices`);
    }
    if (q.choices.some((c) => !c.text?.trim())) {
      fail(`${where}: choice text cannot be empty`);
    }
    if (q.choices.filter((c) => c.correct).length !== 1) {
      fail(`${where}: needs exactly one correct choice`);
    }
  });

  return data;
}

// Sign questions share a prompt ("This sign indicates:"), so the image is
// part of what identifies a question
function questionKey(prompt: string, imgUrl?: string | null) {
  return `${prompt.trim()}\n${imgUrl ?? ""}`;
}

async function existingKeys(
  topicId: string,
  executor: Pick<typeof db, "select"> = db,
) {
  const rows = await executor
    .select({ prompt: questions.prompt, imgUrl: questions.imgUrl })
    .from(questions)
    .where(eq(questions.topicId, topicId));
  return new Set(rows.map((r) => questionKey(r.prompt, r.imgUrl)));
}

/**
 * Import topics and questions from db/data/*.json.
 * Safe to re-run: topics are matched by slug, questions by prompt and image
 * within their topic, and anything already in the database is skipped.
 */
export async function importContent(
  files: string[] = listDataFiles(),
  { dryRun = false } = {},
) {
  // Validate every file before writing anything
  const data = files.map(loadFile);

  for (const { topic, questions: items } of data) {
    if (dryRun) {
      const existing = await db.query.topics.findFirst({
        where: eq(topics.slug, topic.slug),
      });
      const have = existing ? await existingKeys(existing.id) : new Set();
      const added = items.filter(
        (q) => !have.has(questionKey(q.prompt, q.imgUrl)),
      ).length;
      console.log(
        `[dry run] ${topic.slug}: ${existing ? "topic exists" : "new topic"}, ` +
          `${added} new question(s), ${items.length - added} already present`,
      );
      continue;
    }

    const added = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(topics)
        .values({ slug: topic.slug, title: topic.title })
        .onConflictDoUpdate({
          target: topics.slug,
          set: { title: topic.title },
        })
        .returning({ id: topics.id });

      const have = await existingKeys(row.id, tx);
      const fresh = items.filter(
        (q) => !have.has(questionKey(q.prompt, q.imgUrl)),
      );

      for (const q of fresh) {
        const [question] = await tx
          .insert(questions)
          .values({
            topicId: row.id,
            prompt: q.prompt.trim(),
            explanation: q.explanation.trim(),
            imgUrl: q.imgUrl || null,
            difficulty: q.difficulty ?? 1,
            isActive: q.active !== false,
          })
          .returning({ id: questions.id });

        await tx.insert(choices).values(
          q.choices.map((c, i) => ({
            questionId: question.id,
            text: c.text.trim(),
            isCorrect: c.correct === true,
            sortOrder: i,
          })),
        );
      }

      return fresh.length;
    });

    console.log(
      `${topic.slug}: ${added} new question(s), ${items.length - added} already present`,
    );
  }
}
