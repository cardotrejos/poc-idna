import { pgTable, text, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  studentUserId: text("student_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  promptKey: text("prompt_key").notNull(),
  contentRichtext: text("content_richtext").notNull(),
  isDraft: boolean("is_draft").default(true).notNull(),
  wordCount: integer("word_count").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

