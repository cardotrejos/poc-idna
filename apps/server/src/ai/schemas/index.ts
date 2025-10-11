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
} as const;

export type KnownTypeSlug = keyof typeof schemaByType;

export function getSchemaFor(slug: string) {
  const s = (schemaByType as Record<string, z.ZodTypeAny>)[slug];
  return s ?? z.object({}).passthrough();
}

