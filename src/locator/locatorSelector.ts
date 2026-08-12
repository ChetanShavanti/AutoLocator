/**
 * File: locatorSelector.ts
 *
 * Purpose:
 * Select the best locator and optional alternative from scored candidates.
 *
 * Responsibilities:
 * - Pick winning locator respecting user preference when quality allows.
 * - Provide at most one alternative for risky selections.
 *
 * Does not:
 * - Generate or score candidates.
 */

import type { LocatorPreference, ScoredLocator } from '../shared/types';
import { isUsefulOutputLocator } from './locatorOutputQuality';

export interface SelectedLocator {
  locator: string;
  locatorType: 'css' | 'xpath';
  alternative?: string;
  isRisky: boolean;
  uniqueness: number;
}

/**
 * Selects the best locator from scored candidates.
 * Returns null when no uniquely identifiable, useful locator exists.
 */
export function selectBestLocator(
  scored: ScoredLocator[],
  preference: LocatorPreference,
): SelectedLocator | null {
  if (scored.length === 0) {
    return null;
  }

  const unique = scored.filter((item) => item.uniqueness >= 1);
  const useful = unique.filter((item) =>
    isUsefulOutputLocator(item.candidate.value, item.uniqueness),
  );

  const pool = useful.length > 0 ? useful : [];

  if (pool.length === 0) {
    return null;
  }

  let best = pool[0];

  const preferred = pool.find((item) => item.candidate.type === preference);
  if (preferred && best.score - preferred.score <= 0.12) {
    best = preferred;
  }

  let alternative: string | undefined;
  if (best.showAlternative) {
    const alt = pool.find(
      (item) =>
        item !== best &&
        item.candidate.type !== best.candidate.type &&
        item.uniqueness >= best.uniqueness,
    );
    if (alt) {
      alternative = alt.candidate.value;
    } else {
      const fallback = pool.find((item) => item !== best && item.uniqueness === 1);
      alternative = fallback?.candidate.value;
    }
  }

  return {
    locator: best.candidate.value,
    locatorType: best.candidate.type,
    alternative,
    isRisky: best.showAlternative,
    uniqueness: best.uniqueness,
  };
}
