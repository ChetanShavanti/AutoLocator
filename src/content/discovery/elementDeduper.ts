/**
 * File: elementDeduper.ts
 *
 * Purpose:
 * Remove nested and semantic duplicate elements before locator generation.
 *
 * Responsibilities:
 * - Collapse parent/child elements representing the same visible UI text.
 * - Keep the element with the strongest automation identity.
 *
 * Does not:
 * - Generate locators or modify the DOM.
 */

/**
 * Normalizes visible text for duplicate comparison.
 */
export function normalizeTextSignature(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns a text signature when the element represents a single visible label.
 */
export function getElementTextSignature(element: Element): string {
  const raw = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (!raw || raw.length > 80) {
    return '';
  }
  return normalizeTextSignature(raw);
}

/**
 * Scores how useful an element is as an automation target for its text.
 */
export function elementIdentityScore(element: Element): number {
  let score = 0;

  if (element.id) {
    score += 12;
  }

  const classes = Array.from(element.classList);
  const classStr = classes.join(' ').toLowerCase();
  if (classStr.includes('forgot') || classStr.includes('login') || classStr.includes('orangehrm')) {
    score += 10;
  }
  if (classes.length > 0) {
    score += 4;
  }

  if (element.tagName.toLowerCase() === 'a' && element.hasAttribute('href')) {
    score += 8;
  }

  if (element.getAttribute('role') === 'button' || element.getAttribute('role') === 'link') {
    score += 4;
  }

  if (element.hasAttribute('data-testid') || element.hasAttribute('data-test-id')) {
    score += 15;
  }

  const tag = element.tagName.toLowerCase();
  if (tag === 'p' || tag === 'span') {
    score -= 3;
  }
  if (tag === 'div' && classes.length > 0) {
    score += 2;
  }

  return score;
}

/**
 * Removes elements that duplicate the same visible text within a DOM subtree.
 */
export function dedupeRepresentativeElements(elements: Element[]): Element[] {
  const withoutText: Element[] = [];
  const bySignature = new Map<string, Element[]>();

  for (const element of elements) {
    const signature = getElementTextSignature(element);
    if (!signature || signature.length < 2) {
      withoutText.push(element);
      continue;
    }
    const group = bySignature.get(signature) ?? [];
    group.push(element);
    bySignature.set(signature, group);
  }

  const removed = new Set<Element>();

  for (const group of bySignature.values()) {
    if (group.length <= 1) {
      continue;
    }

    markRedundantElements(group, removed);
  }

  return elements.filter((element) => !removed.has(element));
}

function markRedundantElements(group: Element[], removed: Set<Element>): void {
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const a = group[i];
      const b = group[j];
      if (!a.contains(b) && !b.contains(a)) {
        continue;
      }

      const keep = elementIdentityScore(a) >= elementIdentityScore(b) ? a : b;
      const drop = keep === a ? b : a;
      removed.add(drop);
    }
  }
}

/**
 * Extracts normalized text from a text-based XPath locator.
 */
export function extractTextSignatureFromLocator(locator: string): string {
  const match = locator.match(/normalize-space\(\)=["']([^"']+)["']/i);
  if (!match?.[1]) {
    return '';
  }
  return normalizeTextSignature(match[1]);
}

/**
 * Scores locator quality for deduplication (higher is better).
 */
export function locatorQualityScore(locator: string): number {
  if (locator.startsWith('#') || locator.startsWith('.')) {
    return 10;
  }
  if (locator.includes('data-testid') || locator.includes('data-test-id')) {
    return 12;
  }
  if (locator.includes('[name=') || locator.includes('[aria-label=')) {
    return 8;
  }
  if (locator.includes('normalize-space()')) {
    return 3;
  }
  return 5;
}
