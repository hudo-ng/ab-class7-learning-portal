ALTER TABLE "topic_content" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."topic_content_type";--> statement-breakpoint
CREATE TYPE "public"."topic_content_type" AS ENUM('intro', 'concept', 'visual', 'rules', 'mistakes');--> statement-breakpoint
ALTER TABLE "topic_content" ALTER COLUMN "type" SET DATA TYPE "public"."topic_content_type" USING "type"::"public"."topic_content_type";