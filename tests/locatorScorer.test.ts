import { describe, expect, it } from 'vitest';
import { isSuspiciousIdentifier } from '../src/locator/suspiciousDetector';
import { scoreSingleCandidate } from '../src/locator/locatorScorer';
import type { UniquenessContext } from '../src/shared/types';

const uniqueContext: UniquenessContext = {
  countCss: () => 1,
  countXPath: () => 1,
};

describe('locatorScorer', () => {
  it('scores concrete id higher than generic class', () => {
    const idScore = scoreSingleCandidate(
      { strategy: 'id', value: '#save123', type: 'css' },
      uniqueContext,
      'css',
    );
    const classScore = scoreSingleCandidate(
      { strategy: 'class', value: 'button.btn', type: 'css' },
      uniqueContext,
      'css',
    );
    expect(idScore.score).toBeGreaterThan(classScore.score);
  });

  it('flags suspicious identifiers', () => {
    expect(isSuspiciousIdentifier('css-18a91f')).toBe(true);
    expect(isSuspiciousIdentifier('save123')).toBe(false);
  });
});
