import { pgEnum, pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const documentCategory = pgEnum("document_category", [
  "certificate",
  "academic",
  "award",
  "reference",
  "other",
]);

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  studentUserId: text("student_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  category: documentCategory("category").default("other").notNull(),
  storageKey: text("storage_key").notNull(),
  filename: text("filename").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  mime: text("mime").notNull(),
  uploadedAt: timestamp("uploaded_at", { mode: "date" }).defaultNow().notNull(),
});

