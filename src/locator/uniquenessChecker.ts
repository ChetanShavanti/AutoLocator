/**
 * File: uniquenessChecker.ts
 *
 * Purpose:
 * Measure locator uniqueness within the current document.
 *
 * Responsibilities:
 * - Count CSS and XPath matches using injected context functions.
 *
 * Does not:
 * - Generate candidates or assign final scores.
 */

import type { LocatorCandidate, UniquenessContext } from '../shared/types';

/**
 * Returns the number of elements matched by a candidate in the document.
 */
function countMatches(
  candidate: LocatorCandidate,
  context: UniquenessContext,
): number {
  try {
    if (candidate.type === 'css') {
      return context.countCss(candidate.value);
    }
    return context.countXPath(candidate.value);
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

/**
 * Computes a uniqueness score from 0 (many matches) to 1 (unique).
 */
export function uniquenessScore(
  candidate: LocatorCandidate,
  context: UniquenessContext,
): number {
  const count = countMatches(candidate, context);
  if (count === 1) {
    return 1;
  }
  if (count === 0) {
    return 0;
  }
  if (count === 2) {
    return 0.35;
  }
  if (count <= 5) {
    return 0.15;
  }
  return 0;
}
