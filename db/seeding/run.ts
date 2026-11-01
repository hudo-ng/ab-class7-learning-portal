export const dryRun = process.argv.includes("--dry-run");

// Exit explicitly: the open database pool would otherwise keep the process alive
export function run(task: () => Promise<void>) {
  task()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seeding failed:", error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
