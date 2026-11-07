CREATE TYPE "public"."translation_status" AS ENUM('draft', 'approved');--> statement-breakpoint
CREATE TABLE "topic_content_translations" (
	"topic_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"status" "translation_status" DEFAULT 'draft' NOT NULL,
	"source_hash" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "topic_content_translations_topic_id_order_locale_pk" PRIMARY KEY("topic_id","order","locale")
);
--> statement-breakpoint
CREATE TABLE "topic_translations" (
	"topic_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"status" "translation_status" DEFAULT 'draft' NOT NULL,
	"source_hash" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "topic_translations_topic_id_locale_pk" PRIMARY KEY("topic_id","locale")
);
--> statement-breakpoint
ALTER TABLE "topic_content_translations" ADD CONSTRAINT "topic_content_translations_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_translations" ADD CONSTRAINT "topic_translations_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;