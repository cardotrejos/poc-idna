import z from "zod";

export const schemaByType = {
  // 16 personalities example
  "16p": z.object({
    type: z.string().optional().describe("Four-letter type plus variant, e.g. INTJ-A"),
    typeLabel: z.string().optional().describe("Human label like 'Architect (INTJ-A)' if present"),
    variant: z.string().optional().describe("Assertive (A) or Turbulent (T) if present"),
    traits: z.object({
      mind: z.number().min(0).max(100).optional(),
      energy: z.number().min(0).max(100).optional(),
      nature: z.number().min(0).max(100).optional(),
      tactics: z.number().min(0).max(100).optional(),
      identity: z.number().min(0).max(100).optional(),
    }).optional(),
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
  // RIASEC (Holland Code)
  "riasec": z.object({
    code: z.string().min(2).max(6).describe("Three-letter code like RIA, plus ties if shown"),
    top3: z.array(z.string()).min(1).max(6).describe("Ordered interests e.g., [R, I, A]"),
    scores: z
      .object({
        R: z.number().min(0).max(100).optional(),
        I: z.number().min(0).max(100).optional(),
        A: z.number().min(0).max(100).optional(),
        S: z.number().min(0).max(100).optional(),
        E: z.number().min(0).max(100).optional(),
        C: z.number().min(0).max(100).optional(),
      })
      .partial(),
    summary: z.string().optional(),
  }),
  // StrengthsProfile (compact)
  "strengthsprofile": z.object({
    topStrengths: z.array(z.string()).min(1).describe("List of headline strengths"),
    learnedBehaviors: z.array(z.string()).optional(),
    weaknesses: z.array(z.string()).optional(),
    summary: z.string().optional(),
  }),
  // HEXACO (six factors 0..100)
  "hexaco": z.object({
    honestyHumility: z.number().min(0).max(100),
    emotionality: z.number().min(0).max(100),
    extraversion: z.number().min(0).max(100),
    agreeableness: z.number().min(0).max(100),
    conscientiousness: z.number().min(0).max(100),
    openness: z.number().min(0).max(100),
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
  else if (norm === "riasec" || norm === "hollandcode" || norm === "holland") key = "riasec";
  else if (norm === "strengthsprofile" || norm === "strengths") key = "strengthsprofile";
  else if (norm === "hexaco") key = "hexaco";

  const s = key ? (schemaByType as any)[key] : undefined;
  // Fall back to a non-empty generic schema (required for providers like Gemini when using response_schema)
  return (s as z.ZodTypeAny) ?? (schemaByType as any)["generic_assessment"];
}
