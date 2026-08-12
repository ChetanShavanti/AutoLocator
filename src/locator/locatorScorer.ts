/**
 * File: locatorScorer.ts
 *
 * Purpose:
 * Score locator candidates using uniqueness, stability, and readability.
 *
 * Responsibilities:
 * - Combine metrics into a final score.
 * - Flag when alternatives should be shown.
 *
 * Does not:
 * - Generate candidates or access browser storage.
 */

import { analyzeStability } from './stabilityAnalyzer';
import { isSuspiciousIdentifier } from './suspiciousDetector';
import { uniquenessScore } from './uniquenessChecker';
import type {
  LocatorCandidate,
  LocatorPreference,
  ScoredLocator,
  UniquenessContext,
} from '../shared/types';

/**
 * Scores all candidates and returns them sorted best-first.
 */
export function scoreCandidates(
  candidates: LocatorCandidate[],
  context: UniquenessContext,
  preference: LocatorPreference,
): ScoredLocator[] {
  const scored = candidates.map((candidate) =>
    scoreSingleCandidate(candidate, context, preference),
  );

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Scores a single locator candidate.
 */
export function scoreSingleCandidate(
  candidate: LocatorCandidate,
  context: UniquenessContext,
  preference: LocatorPreference,
): ScoredLocator {
  const uniqueness = uniquenessScore(candidate, context);
  const { stability, brittleness } = analyzeStability(candidate);
  const readability = readabilityScore(candidate);
  const preferenceBoost = candidate.type === preference ? 0.08 : 0;
  const suspicious = isCandidateSuspicious(candidate);

  const score =
    uniqueness * 0.4 +
    stability * 0.3 +
    readability * 0.2 +
    (1 - brittleness) * 0.1 +
    preferenceBoost -
    (suspicious ? 0.1 : 0);

  const showAlternative =
    suspicious ||
    uniqueness < 1 ||
    brittleness >= 0.45 ||
    stability < 0.55;

  return {
    candidate,
    score: clamp(score),
    uniqueness,
    stability,
    readability,
    brittleness,
    isSuspicious: suspicious,
    showAlternative,
  };
}

function readabilityScore(candidate: LocatorCandidate): number {
  const length = candidate.value.length;
  if (length <= 30) {
    return 1;
  }
  if (length <= 60) {
    return 0.85;
  }
  if (length <= 100) {
    return 0.65;
  }
  return 0.4;
}

function isCandidateSuspicious(candidate: LocatorCandidate): boolean {
  if (candidate.strategy === 'id') {
    const idMatch = candidate.value.match(/#([^.\s[]+)/);
    const idValue = idMatch?.[1] ?? '';
    return isSuspiciousIdentifier(idValue);
  }
  if (candidate.strategy === 'class' || candidate.strategy === 'class-tag') {
    const classMatch = candidate.value.match(/\.([^.\s[]+)/);
    return isSuspiciousIdentifier(classMatch?.[1] ?? '');
  }
  return false;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
