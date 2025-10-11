import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const progress = pgTable("progress", {
  studentUserId: text("student_user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  completedProfile: boolean("completed_profile").default(false).notNull(),
  uploadedAssessments: integer("uploaded_assessments").default(0).notNull(),
  uploadedDocuments: integer("uploaded_documents").default(0).notNull(),
  storiesCount: integer("stories_count").default(0).notNull(),
  percentComplete: integer("percent_complete").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

