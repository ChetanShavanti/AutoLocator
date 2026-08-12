import { describe, expect, it } from 'vitest';
import {
  isUsefulOutputLocator,
  isWeakLocator,
  shouldSkipOutputEntry,
  usesSuspiciousIdentifier,
} from '../src/locator/locatorOutputQuality';
import { isSuspiciousIdentifier, isUserEnteredValue } from '../src/locator/suspiciousDetector';
import { humanizeIdentifier } from '../src/naming/elementNamer';

describe('suspiciousDetector', () => {
  it('flags zoho-style dynamic field ids', () => {
    expect(isSuspiciousIdentifier('zp_field_outer_29929000000389183')).toBe(true);
  });

  it('flags long numeric suffixes', () => {
    expect(isSuspiciousIdentifier('field_12345678901')).toBe(true);
  });

  it('allows stable semantic ids', () => {
    expect(isSuspiciousIdentifier('rgtnav')).toBe(false);
    expect(isSuspiciousIdentifier('login-form')).toBe(false);
  });

  it('detects user-entered field values', () => {
    expect(isUserEnteredValue('CT624_-_Chetan_-_Shavanti')).toBe(true);
  });
});

describe('locatorOutputQuality extensions', () => {
  it('rejects suspicious id locators', () => {
    expect(
      usesSuspiciousIdentifier('//*[@id="zp_field_outer_29929000000389183"]'),
    ).toBe(true);
    expect(isUsefulOutputLocator('//*[@id="zp_field_outer_29929000000389183"]', 1)).toBe(
      false,
    );
  });

  it('rejects weak tag+class locators', () => {
    expect(isWeakLocator('a.logo_l')).toBe(true);
    expect(isUsefulOutputLocator('a.logo_l', 1)).toBe(false);
  });

  it('skips generic link entries with weak locators', () => {
    expect(shouldSkipOutputEntry('link', 'a.logo_l')).toBe(true);
  });
});

describe('elementNamer humanizeIdentifier', () => {
  it('expands rgtnav into readable navigation name', () => {
    expect(humanizeIdentifier('rgtnav')).toBe('RegionNavigation');
  });
});
