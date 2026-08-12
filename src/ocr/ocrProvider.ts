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

import type { ElementDescriptor } from '../shared/types';

export interface OcrTextRegion {
  text: string;
  confidence: number;
}

export interface OcrProvider {
  readonly name: string;
  isAvailable(): boolean;
  extractText(imageData: ImageData): Promise<OcrTextRegion[]>;
}

/**
 * Maps OCR regions to supplemental element descriptors when DOM is insufficient.
 */
export function mapOcrRegionsToDescriptors(regions: OcrTextRegion[]): ElementDescriptor[] {
  return regions
    .filter((region) => region.text.trim().length > 0 && region.confidence >= 0.5)
    .map((region, index) => ({
      nodeIndex: -1000 - index,
      tagName: 'ocr-text',
      elementKind: 'text' as const,
      role: '',
      inputType: '',
      id: '',
      name: '',
      placeholder: '',
      ariaLabel: '',
      accessibleName: region.text.trim(),
      visibleText: region.text.trim(),
      classes: [],
      attributes: {},
      isDisabled: false,
      isSensitive: false,
      sectionHint: 'OCR Detected Text',
      landmark: '',
    }));
}
