import { importLessons } from "./seeding/lessons";
import { dryRun, run } from "./seeding/run";

run(() => importLessons(undefined, { dryRun }));
