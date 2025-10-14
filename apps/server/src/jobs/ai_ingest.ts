import { db } from "@idna/db";
import { assessmentUploads, assessmentResults, assessmentTypes } from "@idna/db/schema/assessments";
import { aiCalls } from "@idna/db/schema/ai";
import { eq } from "@idna/db";
import { storage } from "../lib/storage";

type ProviderId = "google" | "openai" | "anthropic"

function getConfidenceMin() {
  const raw = process.env.AI_CONFIDENCE_MIN
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) ? n : 60
}

function getProviderChain(): ProviderId[] {
  const primary = String(process.env.AI_PROVIDER || "google").toLowerCase() as ProviderId
  const allowed: ProviderId[] = ["google", "openai", "anthropic"]
  const chainEnv = (process.env.AI_PROVIDER_CHAIN || "").toLowerCase()
  let chain: ProviderId[] = []
  if (chainEnv) {
    chain = chainEnv
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is ProviderId => (allowed as string[]).includes(s))
  }
  if (chain.length === 0) chain = [primary]
  // Append remaining providers to try as fallbacks
  for (const p of allowed) if (!chain.includes(p)) chain.push(p)
  return chain
}

export async function processUpload(uploadId: number): Promise<
  | {
      resultId: number | undefined
      confidencePct: number
      provider: string
      model?: string
      threshold: number
      attempts: number
    }
  | undefined
> {
  const [upload] = await db
    .select()
    .from(assessmentUploads)
    .where(eq(assessmentUploads.id, uploadId))
    .limit(1);
  if (!upload) return;

  const [type] = await db
    .select({ id: assessmentTypes.id, slug: assessmentTypes.slug })
    .from(assessmentTypes)
    .where(eq(assessmentTypes.id, upload.typeId))
    .limit(1);
  if (!type) return

  try {
    // Download bytes
    const bytes = await storage.getBytes(upload.storageKey)

    const threshold = getConfidenceMin()
    const chain = getProviderChain()
    if (chain.length === 0) {
      throw new Error("AI_PROVIDER_CHAIN resolved to an empty list");
    }
    let finalResults: Record<string, unknown> = {}
    let finalConfidence = 0
    let finalProvider: ProviderId = chain[0]!
    let finalModel: string | undefined

    const callLogs: Array<{
      provider: ProviderId
      model?: string
      usage?: { promptTokens?: number; completionTokens?: number }
      confidencePct: number
    }> = []

    for (const p of chain) {
      let out: {
        results: Record<string, unknown>
        confidencePct: number
        usage?: { promptTokens?: number; completionTokens?: number }
        model?: string
      } = { results: {}, confidencePct: 0 }
      if (p === "google") {
        const { googleExtractor } = await import("../ai/providers/google")
        out = await googleExtractor.extract({ bytes, mimeType: upload.mime, typeSlug: type.slug })
        out.model = out.model || "gemini-2.5-flash"
      } else if (p === "openai") {
        const { openAIExtractor } = await import("../ai/providers/openai")
        out = await openAIExtractor.extract({ bytes, mimeType: upload.mime, typeSlug: type.slug })
        out.model = out.model || process.env.OPENAI_VISION_MODEL || "gpt-4o-mini"
      } else if (p === "anthropic") {
        const { anthropicExtractor } = await import("../ai/providers/anthropic")
        out = await anthropicExtractor.extract({ bytes, mimeType: upload.mime, typeSlug: type.slug })
        out.model = out.model || process.env.ANTHROPIC_VISION_MODEL || "claude-3-5-sonnet-2024-06-20"
      }

      callLogs.push({ provider: p, model: out.model, usage: out.usage, confidencePct: out.confidencePct })

      // Track best
      if (out.confidencePct >= finalConfidence) {
        finalConfidence = out.confidencePct
        finalResults = out.results
        finalProvider = p
        finalModel = out.model
      }
      if (out.confidencePct >= threshold) break
    }

    // Persist results and usage
    const inserted = await db
      .insert(assessmentResults)
      .values({
        uploadId: upload.id,
        typeId: type.id,
        resultsJson: finalResults,
        confidencePct: finalConfidence,
      })
      .returning({ id: assessmentResults.id });

    await db
      .update(assessmentUploads)
      .set({ status: "needs_review", updatedAt: new Date() })
      .where(eq(assessmentUploads.id, upload.id));

    // Record calls (one row per attempt)
    for (const log of callLogs) {
      await db.insert(aiCalls).values({
        uploadId: upload.id,
        provider: log.provider,
        model: log.model || "",
        tokensIn: log.usage?.promptTokens || 0,
        tokensOut: log.usage?.completionTokens || 0,
        costMinorUnits: 0,
        status: "succeeded",
      })
    }
    return {
      resultId: inserted[0]?.id,
      confidencePct: finalConfidence,
      provider: finalProvider,
      model: finalModel,
      threshold,
      attempts: callLogs.length,
    }
  } catch (err) {
    await db
      .update(assessmentUploads)
      .set({ status: "needs_review", updatedAt: new Date() })
      .where(eq(assessmentUploads.id, upload.id));
    await db.insert(aiCalls).values({
      uploadId: upload.id,
      provider: process.env.AI_PROVIDER || "google",
      model: "",
      tokensIn: 0,
      tokensOut: 0,
      costMinorUnits: 0,
      status: "failed",
    });
  }
}
