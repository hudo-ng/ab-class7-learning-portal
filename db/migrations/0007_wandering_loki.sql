ALTER TABLE "topic_content" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "topic_content" ALTER COLUMN "type" DROP NOT NULL;