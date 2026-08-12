/**
 * File: noopOcrProvider.ts
 *
 * Purpose:
 * Default disabled OCR provider for MVP.
 *
 * Responsibilities:
 * - Provide a safe no-op OCR implementation.
 *
 * Does not:
 * - Capture screenshots or transmit data externally.
 */

import type { OcrProvider, OcrTextRegion } from './ocrProvider';

/**
 * No-op OCR provider used when OCR is disabled or unavailable.
 */
export class NoopOcrProvider implements OcrProvider {
  readonly name = 'noop';

  isAvailable(): boolean {
    return false;
  }

  async extractText(): Promise<OcrTextRegion[]> {
    return [];
  }
}

export const noopOcrProvider = new NoopOcrProvider();
