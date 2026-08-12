/**
 * File: visibilityFilter.ts
 *
 * Purpose:
 * Determine whether DOM elements are visible and actionable.
 *
 * Responsibilities:
 * - Apply layout, opacity, and visibility checks.
 * - Distinguish viewport-visible vs document-layout-visible (zoom/scroll).
 *
 * Does not:
 * - Generate locators or classify element semantics.
 */

import { MAX_TRAVERSAL_DEPTH } from '../../shared/constants';

export type VisibilityMode = 'viewport' | 'document';

/**
 * Returns true when an element is visible in the current viewport.
 */
export function isElementVisible(element: Element): boolean {
  return isElementDiscoverable(element, 'viewport');
}

/**
 * Returns true when an element is rendered in the document layout.
 * Document mode includes off-screen elements reachable by scroll (helps zoomed pages).
 */
export function isElementDiscoverable(
  element: Element,
  mode: VisibilityMode = 'document',
): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (!element.isConnected) {
    return false;
  }

  if (isHiddenByAria(element)) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  if (parseFloat(style.opacity) === 0) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  if (mode === 'viewport' && !intersectsViewport(rect)) {
    return false;
  }

  if (mode === 'document' && !isInDocumentLayout(rect)) {
    return false;
  }

  if (hasHiddenAncestor(element)) {
    return false;
  }

  return true;
}

function isHiddenByAria(element: Element): boolean {
  let current: Element | null = element;
  let depth = 0;
  while (current && depth < MAX_TRAVERSAL_DEPTH) {
    if (current.getAttribute('aria-hidden') === 'true') {
      return true;
    }
    current = current.parentElement;
    depth += 1;
  }
  return false;
}

function hasHiddenAncestor(element: Element): boolean {
  let current: Element | null = element.parentElement;
  let depth = 0;
  while (current && depth < MAX_TRAVERSAL_DEPTH) {
    const style = window.getComputedStyle(current);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return true;
    }
    current = current.parentElement;
    depth += 1;
  }
  return false;
}

function intersectsViewport(rect: DOMRect): boolean {
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < viewportHeight &&
    rect.left < viewportWidth
  );
}

/** Element occupies space in the scrollable document (may be off-screen). */
function isInDocumentLayout(rect: DOMRect): boolean {
  const docHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight ?? 0,
  );
  const docWidth = Math.max(
    document.documentElement.scrollWidth,
    document.body?.scrollWidth ?? 0,
  );

  return rect.bottom > 0 && rect.right > 0 && rect.top < docHeight && rect.left < docWidth;
}
