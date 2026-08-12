/**
 * File: coverageScanner.ts
 *
 * Purpose:
 * Discover meaningful DOM elements missed by the primary interactive selector.
 *
 * Responsibilities:
 * - Scan for semantic class patterns and clickable text blocks.
 *
 * Does not:
 * - Replace primary DOM discovery or perform OCR.
 */

import { isElementDiscoverable } from '../visibility/visibilityFilter';
import { isActionableElement } from '../classification/actionableClassifier';
import { getElementTextSignature } from './elementDeduper';

const SEMANTIC_SELECTORS = [
  '[class*="forgot"]',
  '[class*="login"]',
  '[class*="orangehrm"]',
  '[class*="btn"]',
  '[class*="button"]',
  '[class*="link"]',
  '[class*="header"]',
  '[class*="click"]',
  'a:not([href])',
  '[tabindex]',
  '[onclick]',
].join(',');

/**
 * Finds additional actionable elements not already in the discovered set.
 */
export function findMissedElements(alreadyFound: Set<Element>): Element[] {
  const missed: Element[] = [];

  let nodes: NodeListOf<Element>;
  try {
    nodes = document.querySelectorAll(SEMANTIC_SELECTORS);
  } catch {
    return missed;
  }

  for (const node of nodes) {
    if (alreadyFound.has(node)) {
      continue;
    }
    if (!isElementDiscoverable(node, 'document')) {
      continue;
    }
    if (!isActionableElement(node)) {
      continue;
    }
    if (!hasMeaningfulIdentity(node)) {
      continue;
    }
    if (isNestedTextDuplicate(node, alreadyFound)) {
      continue;
    }
    missed.push(node);
    alreadyFound.add(node);
  }

  return missed;
}

function hasMeaningfulIdentity(element: Element): boolean {
  const text = getDirectText(element);
  const id = element.id?.trim() ?? '';
  const className = element.className?.toString().trim() ?? '';
  const aria = element.getAttribute('aria-label')?.trim() ?? '';
  const href = element.getAttribute('href')?.trim() ?? '';

  return Boolean(text || id || aria || href || className.length > 3);
}

function getDirectText(element: Element): string {
  let text = '';
  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent ?? '';
    }
  }
  return text.replace(/\s+/g, ' ').trim();
}

function isNestedTextDuplicate(candidate: Element, alreadyFound: Set<Element>): boolean {
  const signature = getElementTextSignature(candidate);
  if (!signature) {
    return false;
  }

  for (const existing of alreadyFound) {
    const existingSignature = getElementTextSignature(existing);
    if (existingSignature !== signature) {
      continue;
    }
    if (existing.contains(candidate) || candidate.contains(existing)) {
      return true;
    }
  }

  return false;
}
