export type ExtractedResult = {
  results: Record<string, unknown>;
  confidencePct: number; // 0..100
};

export interface AssessmentExtractor {
  extract(input: {
    bytes: Uint8Array;
    mimeType: string;
    typeSlug: string;
  }): Promise<ExtractedResult>;
}

