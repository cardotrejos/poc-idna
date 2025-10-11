import { pgEnum, pgTable, text, integer, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const assessmentStatus = pgEnum("assessment_status", [
  "uploaded",
  "processing",
  "needs_review",
  "approved",
  "rejected",
]);

export const assessmentTypes = pgTable("assessment_types", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  required: integer("required").default(0).notNull(), // 0/1 boolean-like for portability
  fieldsJson: jsonb("fields_json"), // expected result schema
  providerUrl: text("provider_url"),
});

export const assessmentUploads = pgTable("assessment_uploads", {
  id: serial("id").primaryKey(),
  studentUserId: text("student_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  typeId: integer("type_id")
    .notNull()
    .references(() => assessmentTypes.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  mime: text("mime").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  status: assessmentStatus("status").default("uploaded").notNull(),
  submittedAt: timestamp("submitted_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const assessmentResults = pgTable("assessment_results", {
  id: serial("id").primaryKey(),
  uploadId: integer("upload_id")
    .notNull()
    .references(() => assessmentUploads.id, { onDelete: "cascade" }),
  typeId: integer("type_id")
    .notNull()
    .references(() => assessmentTypes.id, { onDelete: "cascade" }),
  resultsJson: jsonb("results_json").notNull(),
  confidencePct: integer("confidence_pct").default(0).notNull(), // 0..100
  reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

