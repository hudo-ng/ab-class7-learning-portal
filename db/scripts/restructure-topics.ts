/**
 * One-off migration (Nov 2026): move questions into the 9-topic structure,
 * deactivate the outdated "parking lane" question, delete the retired topics,
 * and mirror the moves in db/data/*.json so future imports stay consistent.
 *
 *   npx tsx ./db/scripts/restructure-topics.ts --dry-run   # preview
 *   npx tsx ./db/scripts/restructure-topics.ts             # apply
 */
import fs from "node:fs";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import { db } from "../index";
import { topics, questions } from "../schema";
import { dryRun, run } from "../seeding/run";

// [current topic, start of the prompt, new topic]
const MOVES: [string, string, string][] = [
  // retired: right-of-way
  ["right-of-way", "A driver entering a traffic circle", "intersections-and-turns"],
  ["right-of-way", "A vehicle exiting a parking lot", "intersections-and-turns"],
  ["right-of-way", "When approaching a Yield sign", "intersections-and-turns"],
  ["right-of-way", "When two vehicles approach an uncontrolled \"T\"", "intersections-and-turns"],
  ["right-of-way", "In an urban area, when a pedestrian is standing", "share-the-road"],
  ["right-of-way", "When encountering a funeral procession", "share-the-road"],
  ["right-of-way", "When facing a Merge sign", "highway-driving"],
  // retired: traffic-laws
  ["traffic-laws", "A \"parking lane\" as defined", "highway-driving"],
  ["traffic-laws", "A deceleration lane is", "highway-driving"],
  ["traffic-laws", "An acceleration lane is", "highway-driving"],
  ["traffic-laws", "Is a driver allowed to exceed the speed limit", "highway-driving"],
  ["traffic-laws", "A driver must report a collision", "emergency-conditions"],
  ["traffic-laws", "At what minimum distance must headlights be dimmed", "emergency-conditions"],
  ["traffic-laws", "In the Basic License Driver's Handbook, \"night time\"", "emergency-conditions"],
  ["traffic-laws", "A solid yellow line together with a broken", "traffic-lights-and-signals"],
  ["traffic-laws", "According to the law in Alberta, it is the driver's responsibility", "responsible-driving"],
  ["traffic-laws", "In Alberta, the law requires that seat belts", "responsible-driving"],
  ["traffic-laws", "At 9:00 AM on a school day", "road-signs"],
  ["traffic-laws", "Parking in a space reserved for persons with disabilities", "road-signs"],
  ["traffic-laws", "The speed limit in a construction zone", "road-signs"],
  ["traffic-laws", "Unless otherwise posted, the school zone speed limits", "road-signs"],
  ["traffic-laws", "Unless otherwise posted, what is the basic speed limit", "road-signs"],
  ["traffic-laws", "How close can a driver legally park a vehicle to a Stop sign", "basics-of-driving"],
  ["traffic-laws", "What minimum distance from a fire hydrant", "basics-of-driving"],
  // realign with where the new lessons teach each rule
  ["basics-of-driving", "Using the 2-second rule", "responsible-driving"],
  ["basics-of-driving", "When a driver is stopping behind another vehicle", "responsible-driving"],
  ["basics-of-driving", "When travelling in urban areas, drivers should scan", "responsible-driving"],
  ["intersections-and-turns", "A single solid white line", "traffic-lights-and-signals"],
  ["intersections-and-turns", "When approaching an intersection and facing a traffic control light", "traffic-lights-and-signals"],
  ["responsible-driving", "A \"weave zone\"", "highway-driving"],
  ["responsible-driving", "If a driver is being followed by a vehicle that is attempting to pass", "highway-driving"],
  ["responsible-driving", "On a two-lane highway, when passing", "highway-driving"],
  ["responsible-driving", "When backing a passenger vehicle to the left", "basics-of-driving"],
  ["responsible-driving", "When passing a large truck", "share-the-road"],
  ["share-the-road", "A \"slow moving vehicle\" sign", "road-signs"],
  ["share-the-road", "When a driver's vehicle is approached by an emergency vehicle", "emergency-conditions"],
  ["share-the-road", "When following an emergency vehicle", "emergency-conditions"],
  ["share-the-road", "When driving in the right lane on a highway", "highway-driving"],
];

// Outdated: the guide no longer defines a "parking lane". Kept but hidden.
const DEACTIVATE = ["A \"parking lane\" as defined"];

const DELETE_TOPICS = ["right-of-way", "traffic-laws", "vehicle-basics-and-parking"];

const TITLES: Record<string, string> = { "highway-driving": "Highway Driving" };

const DATA_DIR = path.join(process.cwd(), "db", "data");

interface TopicFile {
  topic: { slug: string; title: string };
  questions: { prompt: string }[];
}

function startsWith(prompt: string, prefix: string) {
  return prompt.trim().startsWith(prefix);
}

async function migrateDatabase() {
  const allTopics = await db.select().from(topics);
  const idOf = new Map(allTopics.map((t) => [t.slug, t.id]));
  const slugOf = new Map(allTopics.map((t) => [t.id, t.slug]));

  for (const [from, , to] of MOVES) {
    if (!idOf.has(from)) throw new Error(`Unknown topic: ${from}`);
    if (!idOf.has(to)) throw new Error(`Unknown topic: ${to}`);
  }

  const rows = await db
    .select({ id: questions.id, prompt: questions.prompt, topicId: questions.topicId })
    .from(questions);

  // Resolve every move to exactly one question before changing anything
  const plan = MOVES.map(([from, prefix, to]) => {
    const matches = rows.filter(
      (r) => slugOf.get(r.topicId) === from && startsWith(r.prompt, prefix),
    );
    if (matches.length !== 1) {
      throw new Error(`${matches.length} matches in ${from} for "${prefix}"`);
    }
    return { id: matches[0].id, from, to, prefix };
  });

  const deactivateIds = DEACTIVATE.map((prefix) => {
    const m = rows.filter((r) => startsWith(r.prompt, prefix));
    if (m.length !== 1) throw new Error(`${m.length} matches for "${prefix}"`);
    return m[0].id;
  });

  // Retired topics must be empty once the moves are applied
  const movedIds = new Set(plan.map((p) => p.id));
  for (const slug of DELETE_TOPICS) {
    const left = rows.filter(
      (r) => slugOf.get(r.topicId) === slug && !movedIds.has(r.id),
    );
    if (left.length > 0) {
      throw new Error(`${slug} would still have ${left.length} question(s)`);
    }
  }

  for (const p of plan) {
    console.log(`${p.from.padEnd(24)} -> ${p.to.padEnd(26)} ${p.prefix}`);
  }
  console.log(`\nDeactivate: ${DEACTIVATE.join(", ")}`);
  console.log(`Delete topics (and their lessons): ${DELETE_TOPICS.join(", ")}`);

  if (dryRun) return;

  await db.transaction(async (tx) => {
    for (const p of plan) {
      await tx
        .update(questions)
        .set({ topicId: idOf.get(p.to)! })
        .where(eq(questions.id, p.id));
    }
    await tx
      .update(questions)
      .set({ isActive: false })
      .where(inArray(questions.id, deactivateIds));
    await tx
      .delete(topics)
      .where(inArray(topics.slug, DELETE_TOPICS));
  });
  console.log("\nDatabase updated.");
}

function migrateJsonFiles({ write }: { write: boolean }) {
  const files = new Map<string, TopicFile>();
  const load = (slug: string) => {
    if (!files.has(slug)) {
      const file = path.join(DATA_DIR, `${slug}.json`);
      files.set(
        slug,
        fs.existsSync(file)
          ? JSON.parse(fs.readFileSync(file, "utf8"))
          : { topic: { slug, title: TITLES[slug] ?? slug }, questions: [] },
      );
    }
    return files.get(slug)!;
  };

  let moved = 0;
  for (const [from, prefix, to] of MOVES) {
    const source = load(from);
    const i = source.questions.findIndex((q) => startsWith(q.prompt, prefix));
    if (i === -1) continue; // only in the database (added via admin)
    const [q] = source.questions.splice(i, 1);
    load(to).questions.push(q);
    moved++;
  }
  if (!write) console.log(`JSON: ${moved} question(s) to move between files\n`);

  for (const slug of DELETE_TOPICS) {
    const f = files.get(slug);
    if (f && f.questions.length > 0) {
      throw new Error(`${slug}.json would still have ${f.questions.length} question(s)`);
    }
  }

  if (!write) return;

  for (const [slug, data] of files) {
    const file = path.join(DATA_DIR, `${slug}.json`);
    if (DELETE_TOPICS.includes(slug)) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } else {
      fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
    }
  }
  console.log("JSON files updated.");
}

run(async () => {
  if (dryRun) console.log("[dry run] nothing will be changed\n");
  // Validate the JSON moves, update the database, and only then rewrite
  // the files, so a database failure leaves the files untouched
  migrateJsonFiles({ write: false });
  await migrateDatabase();
  if (!dryRun) migrateJsonFiles({ write: true });
});
