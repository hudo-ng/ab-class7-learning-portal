import { writeLessonTemplates } from "../seeding/translations";
import { run } from "../seeding/run";

// npm run db:translation-templates -- vi
const locale = process.argv.slice(2).find((a) => !a.startsWith("--"));

run(() => writeLessonTemplates(locale));
