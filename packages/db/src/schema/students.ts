import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const studentProfile = pgTable("student_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  dateOfBirth: text("date_of_birth"), // ISO date string; keep simple for MVP
  institution: text("institution"),
  contactPreferences: text("contact_preferences"), // e.g., "email"
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const coachProfile = pgTable("coach_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const coachAssignments = pgTable("coach_assignments", {
  id: text("id").primaryKey(), // could be cuid/uuid generated in app layer
  coachUserId: text("coach_user_id")
    .notNull()
    .references(() => coachProfile.userId, { onDelete: "cascade" }),
  studentUserId: text("student_user_id")
    .notNull()
    .references(() => studentProfile.userId, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

