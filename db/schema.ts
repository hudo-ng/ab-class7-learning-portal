import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  pgEnum,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const topics = pgTable("topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id),
    prompt: text("prompt").notNull(),
    explanation: text("explanation").notNull(),
    imgUrl: text("img_url"),
    difficulty: integer("difficulty").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("questions_topic_id_idx").on(t.topicId)],
);

export const choices = pgTable(
  "choices",
  {
    id: uuid().defaultRandom().primaryKey(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    isCorrect: boolean("is_correct").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("choices_question_id_idx").on(t.questionId)],
);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  // Null for accounts that only sign in with Google
  hashedPassword: text("password_hash"),
  role: text("role").notNull().default("USER"),
  isApproved: boolean("is_approved").default(false).notNull(),
  sessionVersion: integer("session_version").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const topicContentType = pgEnum("topic_content_type", [
  "intro",
  "concept",
  "visual",
  "rules",
  "mistakes",
]);

export const topicContent = pgTable("topic_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: topicContentType("type").notNull().default("intro"),
  imgUrl: text("img_url"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const topicsRelations = relations(topics, ({ many }) => ({
  questions: many(questions),
  topicContent: many(topicContent),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  topic: one(topics, {
    fields: [questions.topicId],
    references: [topics.id],
  }),
  choices: many(choices),
}));

export const choicesRelations = relations(choices, ({ one }) => ({
  question: one(questions, {
    fields: [choices.questionId],
    references: [questions.id],
  }),
}));

export const answerSource = pgEnum("answer_source", ["practice", "mock"]);

export const answerAttempts = pgTable(
  "answer_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    isCorrect: boolean("is_correct").notNull(),
    source: answerSource("source").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("answer_attempts_user_question_idx").on(
      t.userId,
      t.questionId,
      t.createdAt,
    ),
  ],
);

export const translationStatus = pgEnum("translation_status", [
  "draft",
  "approved",
]);

export const topicTranslations = pgTable(
  "topic_translations",
  {
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    status: translationStatus("status").notNull().default("draft"),
    sourceHash: text("source_hash").notNull(), // md5(topics.title)
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.topicId, t.locale] })],
);

export const topicContentTranslations = pgTable(
  "topic_content_translations",
  {
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    status: translationStatus("status").notNull().default("draft"),
    sourceHash: text("source_hash").notNull(), // md5(title || '\n' || body)
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.topicId, t.order, t.locale] })],
);

// One row per question + locale. A question is translated as a whole
// (prompt, explanation and every choice) so it never shows half-translated.
export const questionTranslations = pgTable(
  "question_translations",
  {
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    prompt: text("prompt").notNull(),
    explanation: text("explanation").notNull(),
    // Same order as choices.sort_order
    choices: text("choices").array().notNull(),
    status: translationStatus("status").notNull().default("draft"),
    // md5(prompt || '\n' || explanation || '\n' || choice texts joined by '\n')
    sourceHash: text("source_hash").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.questionId, t.locale] })],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"), // set when used or cancelled by a newer request
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("password_reset_tokens_user_id_idx").on(t.userId)],
);
