import { seedAdmin } from "./seeding/admin";
import { importContent } from "./seeding/content";
import { importLessons } from "./seeding/lessons";
import { dryRun, run } from "./seeding/run";


run(async () => {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.log("Skipping admin: ADMIN_EMAIL / ADMIN_PASSWORD not set");
  } else if (dryRun) {
    console.log(`[dry run] would ensure admin ${process.env.ADMIN_EMAIL}`);
  } else {
    await seedAdmin();
  }

  await importContent(undefined, { dryRun });
  await importLessons(undefined, { dryRun });
});
