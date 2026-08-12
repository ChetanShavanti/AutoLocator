/**
 * File: domQuery.ts
 *
 * Purpose:
 * DOM query helpers for uniqueness checking in content script context.
 *
 * Responsibilities:
 * - Count CSS and XPath matches safely within the page.
 *
 * Does not:
 * - Generate locators or modify DOM.
 */

import type { UniquenessContext } from '../shared/types';

/**
 * Creates a uniqueness context bound to the current document.
 */
export function createUniquenessContext(): UniquenessContext {
  return {
    countCss: (selector: string) => countCss(selector),
    countXPath: (xpath: string) => countXPath(xpath),
  };
}

/**
 * Counts elements matching a CSS selector.
 */
export function countCss(selector: string): number {
  try {
    if (selector.includes(':has-text(') || selector.includes(':text-is(')) {
      return countPlaywrightLikeCss(selector);
    }
    return document.querySelectorAll(selector).length;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

/**
 * Counts elements matching an XPath expression.
 */
export function countXPath(xpath: string): number {
  try {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );
    return result.snapshotLength;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

function countPlaywrightLikeCss(selector: string): number {
  const textMatch =
    selector.match(/:has-text\("([^"]*)"\)/) ?? selector.match(/:text-is\('([^']*)'\)/);
  if (!textMatch) {
    return 0;
  }
  const baseSelector = selector.split(':')[0];
  const text = textMatch[1];
  const nodes = document.querySelectorAll(baseSelector);
  let count = 0;
  for (const node of nodes) {
    if ((node.textContent ?? '').includes(text)) {
      count += 1;
    }
  }
  return count;
}
