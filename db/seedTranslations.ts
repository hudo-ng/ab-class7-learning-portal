import { importLessonTranslations } from "./seeding/translations";
import { importQuestionTranslations } from "./seeding/question-translations";
import { translationArgs } from "./seeding/translation-args";
import { dryRun, run } from "./seeding/run";

// npm run db:seed-translations -- vi [lessons|questions] [--dry-run]
run(async () => {
  const { locale, kinds } = translationArgs();
  if (kinds.includes("lessons")) await importLessonTranslations(locale, { dryRun });
  if (kinds.includes("questions")) await importQuestionTranslations(locale, { dryRun });
});
