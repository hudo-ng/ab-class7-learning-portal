import { importContent } from "./seeding/content";
import { dryRun, run } from "./seeding/run";

run(() => importContent(["road-signs.json"], { dryRun }));
