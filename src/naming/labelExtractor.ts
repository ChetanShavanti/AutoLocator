/**
 * File: labelExtractor.ts
 *
 * Purpose:
 * Extract short, meaningful labels from DOM elements for naming.
 *
 * Responsibilities:
 * - Read associated field labels and direct element text.
 * - Reject concatenated menu or container text blobs.
 *
 * Does not:
 * - Generate locators or modify the DOM.
 */

const MENU_WORDS = [
  'about',
  'support',
  'logout',
  'log out',
  'password',
  'profile',
  'settings',
  'change password',
  'help',
  'sign out',
];

const PLACEHOLDER_VALUES = new Set([
  '-- select --',
  'select',
  'choose',
  'please select',
  '- select -',
]);

/**
 * Returns true when text looks like multiple menu items merged together.
 */
export function isConcatenatedMenuText(text: string): boolean {
  const normalized = text.trim();
  if (!normalized || normalized.length <= 24) {
    return false;
  }

  const lower = normalized.toLowerCase();
  const menuHits = MENU_WORDS.filter((word) => lower.includes(word)).length;
  if (menuHits >= 2) {
    return true;
  }

  const camelJams = normalized.match(/[a-z][A-Z]/g);
  if (camelJams && camelJams.length >= 2 && normalized.length > 28) {
    return true;
  }

  if (normalized.length > 48 && normalized.split(/\s+/).length >= 5) {
    return true;
  }

  return false;
}

/**
 * Returns trimmed direct text owned by the element (not descendants).
 */
export function getDirectElementText(element: Element): string {
  let text = '';
  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent ?? '';
    }
  }
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Finds a human-readable field label for a form control.
 */
export function getAssociatedFieldLabel(element: Element): string {
  const group = element.closest(
    [
      '.oxd-input-group',
      '.oxd-form-row',
      '.form-group',
      'fieldset',
      '[class*="input-group"]',
      '[class*="form-row"]',
      '[class*="field-group"]',
    ].join(','),
  );

  if (group) {
    const labelEl = group.querySelector('label, .oxd-label, [class*="label"]');
    const text = labelEl?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (text && !isConcatenatedMenuText(text)) {
      return text;
    }
  }

  let previous = element.previousElementSibling;
  let hops = 0;
  while (previous && hops < 3) {
    if (previous.matches('label, .oxd-label, [class*="label"]')) {
      const text = previous.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      if (text && !isConcatenatedMenuText(text)) {
        return text;
      }
    }
    previous = previous.previousElementSibling;
    hops += 1;
  }

  return '';
}

/**
 * Returns the best short label for naming an element.
 */
export function getShortElementLabel(element: Element): string {
  const aria = element.getAttribute('aria-label')?.trim() ?? '';
  if (aria && !isConcatenatedMenuText(aria)) {
    return aria;
  }

  const fieldLabel = getAssociatedFieldLabel(element);
  if (fieldLabel) {
    return fieldLabel;
  }

  const title = element.getAttribute('title')?.trim() ?? '';
  if (title && !isConcatenatedMenuText(title)) {
    return title;
  }

  const direct = getDirectElementText(element);
  if (direct && !isConcatenatedMenuText(direct) && direct.length <= 40) {
    if (!PLACEHOLDER_VALUES.has(direct.toLowerCase())) {
      return direct;
    }
  }

  const placeholder = element.getAttribute('placeholder')?.trim() ?? '';
  if (placeholder && !isConcatenatedMenuText(placeholder)) {
    return placeholder;
  }

  return '';
}

/**
 * Returns true when an element is a menu container, not a single dropdown control.
 */
export function isMenuContainer(element: Element): boolean {
  const tag = element.tagName.toLowerCase();
  const links = element.querySelectorAll('a[href], button, [role="menuitem"]');
  if (links.length >= 3) {
    return true;
  }

  const directActions = element.querySelectorAll(':scope > a, :scope > button, :scope > [role="menuitem"]');
  if (directActions.length >= 2) {
    return true;
  }

  if ((tag === 'ul' || tag === 'nav') && links.length >= 2) {
    return true;
  }

  return false;
}
