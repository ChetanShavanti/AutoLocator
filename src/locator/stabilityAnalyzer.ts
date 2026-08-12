/**
 * File: stabilityAnalyzer.ts
 *
 * Purpose:
 * Estimate locator stability based on strategy and identifier heuristics.
 *
 * Responsibilities:
 * - Score stability and brittleness signals for candidates.
 *
 * Does not:
 * - Query the DOM or select final locators.
 */

import { isSuspiciousIdentifier } from './suspiciousDetector';
import type { LocatorCandidate } from '../shared/types';

export interface StabilityMetrics {
  stability: number;
  brittleness: number;
}

const STRATEGY_STABILITY: Record<string, number> = {
  'data-testid': 0.98,
  'data-test-id': 0.98,
  'data-qa': 0.95,
  'data-cy': 0.95,
  'data-automation-id': 0.95,
  id: 0.85,
  name: 0.9,
  'aria-label': 0.88,
  placeholder: 0.82,
  'accessible-name': 0.86,
  role: 0.55,
  'input-type': 0.45,
  class: 0.6,
  'class-tag': 0.65,
  'text-xpath': 0.7,
  'text-css': 0.68,
  tag: 0.2,
};

/**
 * Estimates stability and brittleness for a locator candidate.
 */
export function analyzeStability(candidate: LocatorCandidate): StabilityMetrics {
  let stability = STRATEGY_STABILITY[candidate.strategy] ?? 0.5;
  let brittleness = 0.2;

  const value = candidate.value;

  if (candidate.strategy === 'id') {
    const idMatch = value.match(/#([^.\s[]+)/);
    const idValue = idMatch?.[1] ?? '';
    if (isSuspiciousIdentifier(idValue)) {
      stability -= 0.35;
      brittleness += 0.4;
    }
  }

  if (candidate.strategy === 'class' || candidate.strategy === 'class-tag') {
    const classMatch = value.match(/\.([^.\s[]+)/);
    const classValue = classMatch?.[1] ?? '';
    if (isSuspiciousIdentifier(classValue)) {
      stability -= 0.3;
      brittleness += 0.35;
    }
  }

  if (value.includes('nth-child') || value.includes('nth-of-type')) {
    stability -= 0.25;
    brittleness += 0.45;
  }

  if (value.split('/').length > 4 && candidate.type === 'xpath') {
    stability -= 0.2;
    brittleness += 0.3;
  }

  if (candidate.strategy === 'tag') {
    brittleness += 0.5;
  }

  return {
    stability: clamp(stability),
    brittleness: clamp(brittleness),
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
