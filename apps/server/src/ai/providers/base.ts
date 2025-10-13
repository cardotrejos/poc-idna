export type ExtractedResult = {
  results: Record<string, unknown>
  confidencePct: number // 0..100
  /** Optional token usage if provided by the model */
  usage?: { promptTokens?: number; completionTokens?: number }
  /** Optional model identifier used */
  model?: string
};

export interface AssessmentExtractor {
  extract(input: {
    bytes: Uint8Array;
    mimeType: string;
    typeSlug: string;
  }): Promise<ExtractedResult>;
}
