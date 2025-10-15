import z from "zod";

export const schemaByType = {
  // 16 personalities example
  "16p": z.object({
    type: z.string().describe("Four-letter type plus variant, e.g. INTJ-A"),
    traits: z.object({
      mind: z.number().min(0).max(100),
      energy: z.number().min(0).max(100),
      nature: z.number().min(0).max(100),
      tactics: z.number().min(0).max(100),
      identity: z.number().min(0).max(100),
    }).partial(),
    summary: z.string().optional(),
  }),
  // Big Five sample
  "big5": z.object({
    openness: z.number().min(0).max(100),
    conscientiousness: z.number().min(0).max(100),
    extraversion: z.number().min(0).max(100),
    agreeableness: z.number().min(0).max(100),
    neuroticism: z.number().min(0).max(100),
  }),
  // Keirsey Temperament sorter (coarse mapping)
  "keirsey": z.object({
    type: z.string().describe("Four-letter MBTI-like code, if shown"),
    temperament: z.string().describe("Guardian | Artisan | Idealist | Rational"),
    summary: z.string().optional(),
  }),
  // Generic fallback to satisfy provider requirements (non-empty properties)
  "generic_assessment": z.object({
    summary: z.string().describe("Short summary of the result"),
    type: z.string().optional().describe("Primary type label if present"),
    scores: z.record(z.string(), z.number()).optional().describe("Named scores 0..100 if present"),
  }),
} as const;

export type KnownTypeSlug = keyof typeof schemaByType;

export function getSchemaFor(slug: string) {
  const norm = String(slug || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  let key: keyof typeof schemaByType | undefined;
  if (norm === "16p" || norm === "16personalities" || norm === "mbti" || norm === "myersbriggs") key = "16p";
  else if (norm === "big5" || norm === "ocean") key = "big5";
  else if (norm === "keirsey") key = "keirsey";

  const s = key ? (schemaByType as any)[key] : undefined;
  // Fall back to a non-empty generic schema (required for providers like Gemini when using response_schema)
  return (s as z.ZodTypeAny) ?? (schemaByType as any)["generic_assessment"];
}
