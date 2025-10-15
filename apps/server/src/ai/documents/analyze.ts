import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
// Optional providers
// eslint-disable-next-line import/no-extraneous-dependencies
import { openai } from "@ai-sdk/openai";
// eslint-disable-next-line import/no-extraneous-dependencies
import { anthropic } from "@ai-sdk/anthropic";
import z from "zod";

type ProviderId = "google" | "openai" | "anthropic";

const DEFAULT_MODELS: Record<ProviderId, string> = {
  google: "gemini-2.5-flash",
  openai: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
  anthropic: process.env.ANTHROPIC_VISION_MODEL || "claude-3-5-sonnet-2024-06-20",
};

export const GenericDocSchema = z.object({
  title: z.string().optional().describe("Document title if available"),
  language: z.string().optional().describe("IETF language tag, e.g., en, es"),
  summary: z
    .string()
    .min(1)
    .describe("Concise summary of the document's purpose and content"),
  keyValue: z
    .record(z.string(), z.string())
    .optional()
    .describe("Flat key/value facts extracted from the document"),
  entities: z
    .array(
      z.object({
        type: z.string().describe("Entity type (PERSON, ORG, DATE, MONEY, etc.)"),
        text: z.string().describe("Exact surface form from the doc"),
      }),
    )
    .optional(),
  sections: z
    .array(
      z.object({
        heading: z.string().optional(),
        content: z.string().optional(),
      }),
    )
    .optional(),
  tables: z
    .array(
      z.object({
        name: z.string().optional(),
        headers: z.array(z.string()).optional(),
        rows: z.array(z.array(z.string())).optional(),
      }),
    )
    .optional(),
});

export type GenericDoc = z.infer<typeof GenericDocSchema>;

function getProviderChain(): ProviderId[] {
  const primary = (String(process.env.AI_PROVIDER || "google").toLowerCase() as ProviderId) || "google";
  const allowed: ProviderId[] = ["google", "openai", "anthropic"];
  const chainEnv = (process.env.AI_PROVIDER_CHAIN || "").toLowerCase();
  let chain: ProviderId[] = [];
  if (chainEnv) {
    chain = chainEnv
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is ProviderId => (allowed as string[]).includes(s));
  }
  if (chain.length === 0) chain = [primary];
  const unique: ProviderId[] = [];
  for (const provider of chain) {
    if ((allowed as string[]).includes(provider) && !unique.includes(provider)) {
      unique.push(provider);
    }
  }
  if (!unique.includes(primary)) unique.unshift(primary);
  return unique;
}

export async function analyzeDocument(input: {
  bytes: Uint8Array;
  mimeType: string;
  task?: "auto" | "summary" | "kv" | "full";
  schema?: z.ZodTypeAny; // allow overriding schema
}): Promise<{
  object: GenericDoc | Record<string, unknown>;
  provider: ProviderId;
  model: string;
  usage?: { tokensIn?: number; tokensOut?: number };
  confidencePct: number; // heuristic based on completeness
}> {
  const chain = getProviderChain();
  const debugRaw = (process.env.AI_LOG_RAW || "").toLowerCase();
  const shouldLogRaw = debugRaw === "1" || debugRaw === "true";
  const schema = (input.schema as z.ZodTypeAny) || GenericDocSchema;

  const promptPrefix = (() => {
    switch (input.task) {
      case "summary":
        return "Summarize the document. Return valid JSON matching the schema.";
      case "kv":
        return "Extract key-value facts. Return valid JSON matching the schema.";
      case "full":
        return "Extract summary, key facts, entities, and tables. Return valid JSON matching the schema.";
      default:
        return "Analyze the document and return structured JSON matching the schema.";
    }
  })();

  let best: {
    object: any;
    provider: ProviderId;
    model: string;
    usage?: { tokensIn?: number; tokensOut?: number };
    confidencePct: number;
  } | null = null;

  for (const provider of chain) {
    const modelId = DEFAULT_MODELS[provider];
    try {
      const providerModel =
        provider === "google"
          ? google(modelId)
          : provider === "openai"
            ? openai(modelId)
            : anthropic(modelId);

      const result = await generateObject({
        model: providerModel,
        maxOutputTokens: 800,
        schema,
        messages: [
          {
            role: "system",
            content:
              "You are a precise document analyzer. Respond with ONLY valid JSON for the requested schema. Do not include explanations.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: promptPrefix },
              { type: "file", data: input.bytes, mediaType: input.mimeType },
            ],
          },
        ],
      });

      const obj = (result as any).object ?? {};
      if (shouldLogRaw) {
        console.info("[ai][docs] object", {
          provider,
          model: modelId,
          keys: Object.keys(obj || {}),
        });
      }
      // Heuristic confidence: presence of summary or at least 3 non-empty fields
      const keys = Object.keys(obj || {});
      const summaryLen = typeof obj?.summary === "string" ? obj.summary.trim().length : 0;
      const filled = keys.filter((k) => obj?.[k] != null && String(obj[k]).length > 0).length;
      const confidence = Math.min(95, Math.max(summaryLen > 20 ? 70 : 40, 40 + filled * 5));

      const usageAny: any = (result as any).usage;
      const candidate = {
        object: obj,
        provider,
        model: modelId,
        usage: usageAny
          ? { tokensIn: usageAny.promptTokens ?? usageAny.inputTokens, tokensOut: usageAny.completionTokens ?? usageAny.outputTokens }
          : undefined,
        confidencePct: confidence,
      };

      if (!best || candidate.confidencePct >= best.confidencePct) {
        best = candidate;
      }

      // Early exit if decent confidence
      if (candidate.confidencePct >= (Number(process.env.AI_CONFIDENCE_MIN || 60))) {
        break;
      }
    } catch (err) {
      if (shouldLogRaw) {
        console.warn("[ai][docs] provider failed", {
          provider,
          model: modelId,
          error: (err as Error)?.message,
        });
      }
      continue;
    }
  }

  if (!best) {
    return {
      object: {},
      provider: chain[0]!,
      model: DEFAULT_MODELS[chain[0]!],
      confidencePct: 0,
    };
  }
  return best;
}
