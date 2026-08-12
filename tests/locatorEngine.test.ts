import { describe, expect, it } from 'vitest';
import { generateCandidates } from '../src/locator/candidateGenerator';
import { scoreCandidates } from '../src/locator/locatorScorer';
import { selectBestLocator } from '../src/locator/locatorSelector';
import type { ElementDescriptor, UniquenessContext } from '../src/shared/types';

function descriptor(overrides: Partial<ElementDescriptor> = {}): ElementDescriptor {
  return {
    nodeIndex: 0,
    tagName: 'button',
    elementKind: 'button',
    role: '',
    inputType: '',
    id: '',
    name: '',
    placeholder: '',
    ariaLabel: '',
    accessibleName: '',
    visibleText: '',
    classes: [],
    attributes: {},
    isDisabled: false,
    isSensitive: false,
    sectionHint: '',
    landmark: '',
    ...overrides,
  };
}

function context(counts: Record<string, number>): UniquenessContext {
  return {
    countCss: (selector: string) => counts[`css:${selector}`] ?? 0,
    countXPath: (xpath: string) => counts[`xpath:${xpath}`] ?? 0,
  };
}

describe('locator generation and selection', () => {
  it('prefers stable id over generic class', () => {
    const desc = descriptor({ id: 'save123', classes: ['btn'], tagName: 'button' });
    const candidates = generateCandidates(desc, 'css');
    const scored = scoreCandidates(
      candidates,
      context({
        'css:#save123': 1,
        'css:.btn': 5,
        'css:button': 20,
      }),
      'css',
    );
    const selected = selectBestLocator(scored, 'css');
    expect(selected?.locator).toBe('#save123');
  });

  it('generates data-testid candidate', () => {
    const desc = descriptor({
      attributes: { 'data-testid': 'login-button' },
      tagName: 'button',
    });
    const candidates = generateCandidates(desc, 'css');
    expect(candidates.some((c) => c.value.includes('data-testid'))).toBe(true);
  });

  it('generates placeholder candidate', () => {
    const desc = descriptor({
      tagName: 'input',
      placeholder: 'username',
    });
    const candidates = generateCandidates(desc, 'css');
    expect(candidates.some((c) => c.value.includes('username'))).toBe(true);
  });

  it('generates aria-label candidate', () => {
    const desc = descriptor({ ariaLabel: 'Save document' });
    const candidates = generateCandidates(desc, 'css');
    expect(candidates.some((c) => c.value.includes('Save document'))).toBe(true);
  });

  it('uses xpath fallback when css is weak', () => {
    const desc = descriptor({ visibleText: 'Save', tagName: 'button' });
    const candidates = generateCandidates(desc, 'xpath');
    const scored = scoreCandidates(
      candidates,
      context({
        'xpath://button[normalize-space()="Save"]': 1,
        'css:button': 10,
      }),
      'xpath',
    );
    const selected = selectBestLocator(scored, 'xpath');
    expect(selected?.locatorType).toBe('xpath');
  });

  it('skips suspicious generated id and prefers text xpath', () => {
    const desc = descriptor({ id: 'css-18a91f', tagName: 'button', visibleText: 'Save' });
    const candidates = generateCandidates(desc, 'css');
    expect(candidates.some((c) => c.value.includes('css-18a91f'))).toBe(false);
    const scored = scoreCandidates(
      candidates,
      context({
        'xpath://button[normalize-space()="Save"]': 1,
      }),
      'css',
    );
    const selected = selectBestLocator(scored, 'css');
    expect(selected?.locator).toContain('Save');
  });
});
