import { pgEnum, pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { assessmentUploads } from "./assessments";

export const aiCallStatus = pgEnum("ai_call_status", ["succeeded", "failed"]);

export const aiCalls = pgTable("ai_calls", {
  id: serial("id").primaryKey(),
  uploadId: integer("upload_id")
    .notNull()
    .references(() => assessmentUploads.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // e.g., openai, textract
  model: text("model").notNull(),
  tokensIn: integer("tokens_in").default(0).notNull(),
  tokensOut: integer("tokens_out").default(0).notNull(),
  costMinorUnits: integer("cost_minor_units").default(0).notNull(), // e.g., cents
  status: aiCallStatus("status").default("succeeded").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

