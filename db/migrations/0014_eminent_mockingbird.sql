CREATE TABLE "question_translations" (
	"question_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"prompt" text NOT NULL,
	"explanation" text NOT NULL,
	"choices" text[] NOT NULL,
	"status" "translation_status" DEFAULT 'draft' NOT NULL,
	"source_hash" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "question_translations_question_id_locale_pk" PRIMARY KEY("question_id","locale")
);
--> statement-breakpoint
ALTER TABLE "question_translations" ADD CONSTRAINT "question_translations_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;