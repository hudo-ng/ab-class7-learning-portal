ALTER TABLE "choices" DROP CONSTRAINT "choices_question_id_questions_id_fk";
--> statement-breakpoint
ALTER TABLE "choices" ALTER COLUMN "question_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "choices" ADD CONSTRAINT "choices_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "choices_question_id_idx" ON "choices" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "questions_topic_id_idx" ON "questions" USING btree ("topic_id");