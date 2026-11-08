import fs from "node:fs";
import path from "node:path";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../index";
import { topics, questions, choices, questionTranslations } from "../schema";
import { TRANSLATION_ROOT, assertLocale, md5 } from "./translations";

/*
 * Question translation files: db/data/translations/<locale>/questions/<slug>.json
 *
 * {
 *   "questions": [
 *     {
 *       "id": "<question uuid>", "imgUrl": "/signs/stop.png" | null,
 *       "en": { "prompt": "...", "explanation": "...", "choices": ["...", "..."] },
 *       "sourceHash": "...",
 *       "prompt": "...", "explanation": "...", "choices": ["...", "..."],
 *       "status": "draft" | "approved"
 *     }
 *   ]
 * }
 *
 * "en" is a read-only reference for the translator/reviewer.
 * Entries are matched to questions by id, falling back to English prompt +
 * image (how the content importer identifies questions), so files survive a
 * database rebuild. Choices are matched by position.
 * A question is translated as a whole: if any of its English changes, the
 * whole translation is hidden until re-reviewed.
 */

type Status = "draft" | "approved";

interface QuestionEntry {
  id: string;
  imgUrl: string | null;
  en: { prompt: string; explanation: string; choices: string[] };
  sourceHash: string;
  prompt: string;
  explanation: string;
  choices: string[];
  status: Status;
}

interface QuestionFile {
  questions: QuestionEntry[];
}

interface EnglishQuestion {
  id: string;
  prompt: string;
  explanation: string;
  imgUrl: string | null;
  isActive: boolean;
  choices: string[];
}

// Must match questionSourceHash in db/queries/localized.ts
const questionHash = (q: Pick<EnglishQuestion, "prompt" | "explanation" | "choices">) =>
  md5([q.prompt, q.explanation, ...q.choices].join("\n"));

// Same identity the content importer uses (db/seeding/content.ts)
const questionKey = (prompt: string, imgUrl?: string | null) =>
  `${prompt.trim()}\n${imgUrl ?? ""}`;

const questionDir = (locale: string) =>
  path.join(TRANSLATION_ROOT, locale, "questions");

const isStatus = (s: unknown): s is Status => s === "draft" || s === "approved";

function readFile(file: string): QuestionFile | null {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as QuestionFile;
}

async function loadEnglish() {
  const allTopics = await db.select().from(topics).orderBy(asc(topics.slug));
  const allQuestions = await db.select().from(questions);
  const allChoices = await db
    .select()
    .from(choices)
    .orderBy(asc(choices.sortOrder), asc(choices.id));

  const choicesByQuestion = new Map<string, string[]>();
  for (const c of allChoices) {
    const list = choicesByQuestion.get(c.questionId) ?? [];
    list.push(c.text);
    choicesByQuestion.set(c.questionId, list);
  }

  return allTopics.map((t) => ({
    id: t.id,
    slug: t.slug,
    questions: allQuestions
      .filter((q) => q.topicId === t.id)
      .map(
        (q): EnglishQuestion => ({
          id: q.id,
          prompt: q.prompt,
          explanation: q.explanation,
          imgUrl: q.imgUrl,
          isActive: q.isActive,
          choices: choicesByQuestion.get(q.id) ?? [],
        }),
      ),
  }));
}

// Order questions as they appear in db/data/<slug>.json, for easier review
function sourceOrder(slug: string) {
  const file = path.join(process.cwd(), "db", "data", `${slug}.json`);
  const order = new Map<string, number>();
  if (!fs.existsSync(file)) return order;
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as {
    questions?: { prompt: string; imgUrl?: string | null }[];
  };
  data.questions?.forEach((q, i) => order.set(questionKey(q.prompt, q.imgUrl || null), i));
  return order;
}

/** Find the file entry for each English question: by id, then by prompt + image. */
function matcher(entries: QuestionEntry[]) {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const byKey = new Map(entries.map((e) => [questionKey(e.en?.prompt ?? "", e.imgUrl), e]));
  return (q: EnglishQuestion) => byId.get(q.id) ?? byKey.get(questionKey(q.prompt, q.imgUrl));
}

/**
 * Create or refresh question translation files from the current English.
 * Existing translations are kept; any question whose English changed gets the
 * new English reference + hash and goes back to "draft" for re-review.
 * Only active questions are included.
 */
export async function writeQuestionTemplates(locale: string | undefined) {
  assertLocale(locale);
  const dir = questionDir(locale);
  fs.mkdirSync(dir, { recursive: true });

  for (const topic of await loadEnglish()) {
    const file = path.join(dir, `${topic.slug}.json`);
    const old = readFile(file);
    const find = matcher(old?.questions ?? []);
    const order = sourceOrder(topic.slug);
    const pos = (q: EnglishQuestion) =>
      order.get(questionKey(q.prompt, q.imgUrl)) ?? Number.MAX_SAFE_INTEGER;

    const active = topic.questions
      .filter((q) => q.isActive)
      .sort((a, b) => pos(a) - pos(b) || a.prompt.localeCompare(b.prompt));

    let reset = 0;
    const used = new Set<QuestionEntry>();
    const entries = active.map((q): QuestionEntry => {
      const hash = questionHash(q);
      const prev = find(q);
      if (prev) used.add(prev);
      if (prev && prev.sourceHash === hash) {
        return { ...prev, id: q.id, imgUrl: q.imgUrl };
      }
      reset++;
      return {
        id: q.id,
        imgUrl: q.imgUrl,
        en: { prompt: q.prompt, explanation: q.explanation, choices: q.choices },
        sourceHash: hash,
        prompt: prev?.prompt ?? "",
        explanation: prev?.explanation ?? "",
        // Keep old choice text only if the number of choices is unchanged
        choices:
          prev?.choices?.length === q.choices.length
            ? prev.choices
            : q.choices.map(() => ""),
        status: "draft",
      };
    });
    const dropped = (old?.questions ?? []).filter((e) => !used.has(e)).length;

    const next = JSON.stringify({ questions: entries }, null, 2) + "\n";
    const prevText = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
    if (next !== prevText) fs.writeFileSync(file, next);

    console.log(
      `${locale}/questions/${topic.slug}.json: ${entries.length} questions` +
        (old
          ? `, ${reset} new or reset to draft` +
            (dropped ? `, ${dropped} removed (question deleted or deactivated)` : "")
          : " (created)"),
    );
  }
}

/** Validate question translation files and replace the stored rows per topic. */
export async function importQuestionTranslations(
  locale: string | undefined,
  { dryRun = false } = {},
) {
  assertLocale(locale);
  const dir = questionDir(locale);
  if (!fs.existsSync(dir)) throw new Error(`No folder ${dir}`);

  const english = new Map((await loadEnglish()).map((t) => [t.slug, t]));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const errors: string[] = [];
  const plans: {
    slug: string;
    questionIds: string[];
    rows: (typeof questionTranslations.$inferInsert)[];
    total: number;
    stale: number;
    unmatched: number;
  }[] = [];

  // Validate everything before writing anything
  for (const f of files) {
    const slug = f.replace(/\.json$/, "");
    const where = `${locale}/questions/${f}`;
    const topic = english.get(slug);
    if (!topic) {
      errors.push(`${where}: no topic with slug "${slug}"`);
      continue;
    }
    const data = readFile(path.join(dir, f))!;
    if (!Array.isArray(data.questions)) {
      errors.push(`${where}: questions must be an array`);
      continue;
    }

    // Reverse lookup: entry -> English question
    const byId = new Map(topic.questions.map((q) => [q.id, q]));
    const byKey = new Map(topic.questions.map((q) => [questionKey(q.prompt, q.imgUrl), q]));

    const rows: (typeof plans)[number]["rows"] = [];
    const seen = new Set<string>();
    let stale = 0;
    let unmatched = 0;

    data.questions.forEach((e, i) => {
      const at = `${where} question ${i + 1}`;
      const prompt = e.prompt?.trim() ?? "";
      const explanation = e.explanation?.trim() ?? "";
      const choiceTexts = Array.isArray(e.choices) ? e.choices.map((c) => c?.trim() ?? "") : [];
      const empty = !prompt && !explanation && choiceTexts.every((c) => !c);

      if (empty) {
        if (e.status === "approved") errors.push(`${at}: approved but empty`);
        return; // not translated yet
      }

      const q = byId.get(e.id) ?? byKey.get(questionKey(e.en?.prompt ?? "", e.imgUrl));
      if (!q) {
        unmatched++;
        console.warn(`warning: ${at}: no matching question, skipped. Run the template command to resync.`);
        return;
      }
      if (seen.has(q.id)) {
        errors.push(`${at}: duplicate entry for the same question`);
        return;
      }
      seen.add(q.id);

      if (!isStatus(e.status)) errors.push(`${at}: status must be draft or approved`);
      if (!prompt || !explanation) errors.push(`${at}: needs prompt and explanation`);
      if (choiceTexts.length !== q.choices.length) {
        errors.push(`${at}: has ${choiceTexts.length} choices, English has ${q.choices.length}`);
      } else if (choiceTexts.some((c) => !c)) {
        errors.push(`${at}: every choice needs text`);
      }
      if (e.sourceHash !== questionHash(q)) stale++;

      rows.push({
        questionId: q.id,
        locale,
        prompt,
        explanation,
        choices: choiceTexts,
        status: e.status,
        sourceHash: e.sourceHash,
      });
    });

    plans.push({
      slug,
      questionIds: topic.questions.map((q) => q.id),
      rows,
      total: topic.questions.filter((q) => q.isActive).length,
      stale,
      unmatched,
    });
  }

  if (errors.length) {
    throw new Error(`\n  ${errors.join("\n  ")}`);
  }

  for (const p of plans) {
    const approved = p.rows.filter((r) => r.status === "approved").length;
    const summary =
      `${locale} ${p.slug}: ${p.rows.length}/${p.total} questions translated (${approved} approved)` +
      (p.stale ? `, ${p.stale} stale (English changed; hidden until re-translated)` : "") +
      (p.unmatched ? `, ${p.unmatched} unmatched (skipped)` : "");

    if (dryRun) {
      console.log(`[dry run] ${summary}`);
      continue;
    }

    // File is the source of truth for this topic + locale
    await db.transaction(async (tx) => {
      if (p.questionIds.length) {
        await tx
          .delete(questionTranslations)
          .where(
            and(
              inArray(questionTranslations.questionId, p.questionIds),
              eq(questionTranslations.locale, locale),
            ),
          );
      }
      if (p.rows.length) await tx.insert(questionTranslations).values(p.rows);
    });
    console.log(summary);
  }
}
