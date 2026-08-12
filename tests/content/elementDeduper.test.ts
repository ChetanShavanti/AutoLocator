/**
 * File: elementDeduper.test.ts
 */

import { describe, expect, it } from 'vitest';
import {
  dedupeRepresentativeElements,
  elementIdentityScore,
  extractTextSignatureFromLocator,
  getElementTextSignature,
  locatorQualityScore,
  normalizeTextSignature,
} from '../../src/content/discovery/elementDeduper';

describe('elementDeduper', () => {
  it('normalizes text signatures', () => {
    expect(normalizeTextSignature('Forgot your password?')).toBe('forgot your password');
  });

  it('extracts text signature from xpath locators', () => {
    expect(extractTextSignatureFromLocator('//div[normalize-space()="Forgot your password?"]')).toBe(
      'forgot your password',
    );
  });

  it('prefers class locators over text xpath', () => {
    expect(locatorQualityScore('.orangehrm-login-forgot-header')).toBeGreaterThan(
      locatorQualityScore('//p[normalize-space()="Forgot your password?"]'),
    );
  });

  it('removes nested duplicate elements with the same text', () => {
    document.body.innerHTML = `
      <div class="orangehrm-login-forgot-header">
        <p>Forgot your password?</p>
      </div>
    `;

    const div = document.querySelector('.orangehrm-login-forgot-header')!;
    const p = document.querySelector('p')!;
    const deduped = dedupeRepresentativeElements([div, p]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0]).toBe(div);
  });

  it('scores semantic class wrapper above inner paragraph', () => {
    document.body.innerHTML = `
      <div class="orangehrm-login-forgot-header"><p>Forgot your password?</p></div>
    `;
    const div = document.querySelector('div')!;
    const p = document.querySelector('p')!;
    expect(elementIdentityScore(div)).toBeGreaterThan(elementIdentityScore(p));
  });

  it('keeps unrelated elements with different text', () => {
    document.body.innerHTML = `
      <button>Login</button>
      <button>Cancel</button>
    `;
    const buttons = Array.from(document.querySelectorAll('button'));
    expect(dedupeRepresentativeElements(buttons)).toHaveLength(2);
  });

  it('builds text signature from element content', () => {
    document.body.innerHTML = '<p>Forgot your password?</p>';
    const p = document.querySelector('p')!;
    expect(getElementTextSignature(p)).toBe('forgot your password');
  });
});
