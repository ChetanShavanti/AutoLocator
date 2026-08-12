import { describe, expect, it } from 'vitest';
import { detectPatterns } from '../src/grouping/patternDetector';
import type { NamedLocator } from '../src/shared/types';

function locator(name: string, value: string): NamedLocator {
  return {
    name,
    locator: value,
    locatorType: 'css',
    elementType: 'link',
    section: 'Nav',
    isRisky: false,
  };
}

describe('patternDetector', () => {
  it('detects repeated menu item structures', () => {
    const locators = [
      locator('Admin', 'a.oxd-main-menu-item span:text-is(\'Admin\')'),
      locator('Pim', 'a.oxd-main-menu-item span:text-is(\'PIM\')'),
      locator('Leave', 'a.oxd-main-menu-item span:text-is(\'Leave\')'),
    ];
    const patterns = detectPatterns(locators);
    expect(patterns.length).toBeGreaterThan(0);
  });
});
