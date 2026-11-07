import { importLessonTranslations } from "./seeding/translations";
import { dryRun, run } from "./seeding/run";

// npm run db:seed-translations -- vi [--dry-run]
const locale = process.argv.slice(2).find((a) => !a.startsWith("--"));

run(() => importLessonTranslations(locale, { dryRun }));
