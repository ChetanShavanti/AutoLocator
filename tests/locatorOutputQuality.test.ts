import { describe, expect, it } from 'vitest';
import {
  isGenericLocator,
  isGenericName,
  isUsefulOutputLocator,
} from '../src/locator/locatorOutputQuality';
import { selectBestLocator } from '../src/locator/locatorSelector';
import { scoreCandidates } from '../src/locator/locatorScorer';
import type { LocatorCandidate, UniquenessContext } from '../src/shared/types';

describe('locatorOutputQuality', () => {
  it('rejects bare tag selectors', () => {
    expect(isGenericLocator('a')).toBe(true);
    expect(isGenericLocator('button')).toBe(true);
    expect(isGenericLocator('.orangehrm-login-forgot-header')).toBe(false);
    expect(isGenericLocator('[name="username"]')).toBe(false);
  });

  it('rejects generic names', () => {
    expect(isGenericName('link')).toBe(true);
    expect(isGenericName('Forgot_your_password')).toBe(false);
  });

  it('requires uniqueness for useful output', () => {
    expect(isUsefulOutputLocator('a', 1)).toBe(false);
    expect(isUsefulOutputLocator('#save123', 1)).toBe(true);
    expect(isUsefulOutputLocator('#save123', 0.5)).toBe(false);
  });

  it('does not select generic tag fallback when unique', () => {
    const candidates: LocatorCandidate[] = [{ strategy: 'tag', value: 'a', type: 'css' }];
    const context: UniquenessContext = { countCss: () => 5, countXPath: () => 5 };
    const scored = scoreCandidates(candidates, context, 'css');
    expect(selectBestLocator(scored, 'css')).toBeNull();
  });
});
