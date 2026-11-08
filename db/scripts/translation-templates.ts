import { writeLessonTemplates } from "../seeding/translations";
import { writeQuestionTemplates } from "../seeding/question-translations";
import { translationArgs } from "../seeding/translation-args";
import { run } from "../seeding/run";

// npm run db:translation-templates -- vi [lessons|questions]
run(async () => {
  const { locale, kinds } = translationArgs();
  if (kinds.includes("lessons")) await writeLessonTemplates(locale);
  if (kinds.includes("questions")) await writeQuestionTemplates(locale);
});
