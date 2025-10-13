import { db } from "@idna/db";
import { assessmentUploads, assessmentResults, assessmentTypes } from "@idna/db/schema/assessments";
import { aiCalls } from "@idna/db/schema/ai";
import { eq } from "@idna/db";
import { storage } from "../lib/storage";

export async function processUpload(uploadId: number) {
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
  if (!type) return;

  try {
    // Download bytes
    const bytes = await storage.getBytes(upload.storageKey);

    // Choose provider
    const provider = (process.env.AI_PROVIDER || "google").toLowerCase();
    let model: string | undefined

    let results: Record<string, unknown> = {};
    let confidencePct = 0;
    let usage: { promptTokens?: number; completionTokens?: number } | undefined;

    if (provider === "google") {
      const { googleExtractor } = await import("../ai/providers/google")
      const out = await googleExtractor.extract({ bytes, mimeType: upload.mime, typeSlug: type.slug })
      results = out.results
      confidencePct = out.confidencePct
      usage = out.usage
      model = out.model || "gemini-2.5-flash"
    } else if (provider === "openai") {
      const { openAIExtractor } = await import("../ai/providers/openai")
      const out = await openAIExtractor.extract({ bytes, mimeType: upload.mime, typeSlug: type.slug })
      results = out.results
      confidencePct = out.confidencePct
      usage = out.usage
      model = out.model || process.env.OPENAI_VISION_MODEL || "gpt-4o-mini"
    } else if (provider === "anthropic") {
      const { anthropicExtractor } = await import("../ai/providers/anthropic")
      const out = await anthropicExtractor.extract({ bytes, mimeType: upload.mime, typeSlug: type.slug })
      results = out.results
      confidencePct = out.confidencePct
      usage = out.usage
      model = out.model || process.env.ANTHROPIC_VISION_MODEL || "claude-3-5-sonnet-2024-06-20"
    } else {
      // Fallback: no provider configured
      results = {}
      confidencePct = 0
    }

    // Persist results and usage
    const inserted = await db
      .insert(assessmentResults)
      .values({
        uploadId: upload.id,
        typeId: type.id,
        resultsJson: results,
        confidencePct,
      })
      .returning({ id: assessmentResults.id });

    await db
      .update(assessmentUploads)
      .set({ status: "needs_review" })
      .where(eq(assessmentUploads.id, upload.id));

    if (usage && (usage.promptTokens || usage.completionTokens)) {
      await db.insert(aiCalls).values({
        uploadId: upload.id,
        provider,
        model: model || "",
        tokensIn: usage.promptTokens || 0,
        tokensOut: usage.completionTokens || 0,
        costMinorUnits: 0,
        status: "succeeded",
      });
    }
    return inserted[0]?.id;
  } catch (err) {
    await db
      .update(assessmentUploads)
      .set({ status: "needs_review" })
      .where(eq(assessmentUploads.id, upload.id));
    await db.insert(aiCalls).values({
      uploadId: upload.id,
      provider: process.env.AI_PROVIDER || "google",
      model: model || "",
      tokensIn: 0,
      tokensOut: 0,
      costMinorUnits: 0,
      status: "failed",
    });
  }
}
