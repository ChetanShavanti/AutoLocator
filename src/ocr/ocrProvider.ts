/**
 * File: ocrProvider.ts
 *
 * Purpose:
 * Define OCR provider interface for fallback UI analysis.
 *
 * Responsibilities:
 * - Abstract OCR so implementations can be swapped or disabled.
 *
 * Does not:
 * - Perform DOM analysis or network calls by default.
 */

export interface OcrTextRegion {
  text: string;
  confidence: number;
}

export interface OcrProvider {
  readonly name: string;
  isAvailable(): boolean;
  extractText(imageData: ImageData): Promise<OcrTextRegion[]>;
}
