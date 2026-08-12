/**
 * File: actionableClassifier.ts
 *
 * Purpose:
 * Classify whether elements are meaningful for UI automation.
 *
 * Responsibilities:
 * - Identify actionable element kinds from semantics and context.
 *
 * Does not:
 * - Generate locators or modify DOM.
 */

import type { ElementKind } from '../../shared/types';

const DECORATIVE_TAGS = new Set(['svg', 'path', 'g', 'script', 'style', 'meta', 'link', 'noscript']);

/**
 * Returns true when an element should be included in automation output.
 */
export function isActionableElement(element: Element): boolean {
  if (DECORATIVE_TAGS.has(element.tagName.toLowerCase())) {
    return false;
  }

  if (isMeaninglessLink(element)) {
    return false;
  }

  const kind = classifyElement(element);
  if (kind === 'unknown') {
    return hasInteractiveSignals(element) || hasMeaningfulSemanticClass(element);
  }

  if (kind === 'link') {
    return hasMeaningfulLink(element);
  }

  return kind !== 'text' || hasMeaningfulHeading(element);
}

/**
 * Classifies an element into an automation element kind.
 */
export function classifyElement(element: Element): ElementKind {
  const tag = element.tagName.toLowerCase();
  const role = (element.getAttribute('role') ?? '').toLowerCase();
  const type = (element.getAttribute('type') ?? '').toLowerCase();

  if (tag === 'button' || role === 'button') {
    return 'button';
  }
  if (tag === 'a') {
    return element.hasAttribute('href') || hasMeaningfulSemanticClass(element) ? 'link' : 'unknown';
  }
  if (tag === 'nav' || role === 'navigation') {
    return 'navigation';
  }
  if (tag === 'textarea' || role === 'textbox') {
    return 'textarea';
  }
  if (tag === 'select' || role === 'combobox' || role === 'listbox') {
    return 'select';
  }
  if (tag === 'option' || role === 'option') {
    return 'option';
  }
  if (type === 'checkbox' || role === 'checkbox') {
    return 'checkbox';
  }
  if (type === 'radio' || role === 'radio') {
    return 'radio';
  }
  if (role === 'switch' || type === 'checkbox') {
    return 'toggle';
  }
  if (role === 'tab') {
    return 'tab';
  }
  if (role === 'menu') {
    return 'menu';
  }
  if (role === 'menuitem') {
    return 'menuitem';
  }
  if (role === 'dialog' || tag === 'dialog') {
    return 'dialog';
  }
  if (role === 'searchbox' || type === 'search') {
    return 'search';
  }
  if (tag === 'input') {
    return 'input';
  }
  if (/^h[1-6]$/.test(tag)) {
    return 'heading';
  }
  if (hasMeaningfulSemanticClass(element)) {
    return inferKindFromClass(element);
  }
  if (tag === 'th' || role === 'columnheader' || role === 'rowheader') {
    return 'table-control';
  }

  return 'unknown';
}

function hasInteractiveSignals(element: Element): boolean {
  const tag = element.tagName.toLowerCase();
  if (['input', 'button', 'select', 'textarea', 'a', 'summary'].includes(tag)) {
    return true;
  }
  const role = element.getAttribute('role');
  if (role) {
    return true;
  }
  if (element.hasAttribute('onclick') || element.hasAttribute('tabindex')) {
    return true;
  }
  return element.matches('[contenteditable="true"]');
}

function hasMeaningfulHeading(element: Element): boolean {
  return /^h[1-3]$/i.test(element.tagName);
}

const SEMANTIC_CLASS_HINTS = [
  'forgot',
  'login',
  'btn',
  'button',
  'link',
  'click',
  'submit',
  'header',
  'orangehrm',
  'menu',
  'tab',
  'dropdown',
];

function hasMeaningfulSemanticClass(element: Element): boolean {
  const classes = Array.from(element.classList).join(' ').toLowerCase();
  if (!classes) {
    return false;
  }
  return SEMANTIC_CLASS_HINTS.some((hint) => classes.includes(hint));
}

function inferKindFromClass(element: Element): ElementKind {
  const classes = Array.from(element.classList).join(' ').toLowerCase();
  if (classes.includes('forgot') || classes.includes('link')) {
    return 'link';
  }
  if (classes.includes('btn') || classes.includes('button') || classes.includes('submit')) {
    return 'button';
  }
  if (classes.includes('header')) {
    return 'heading';
  }
  return 'text';
}

function hasMeaningfulLink(element: Element): boolean {
  const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
  const href = element.getAttribute('href') ?? '';
  const aria = element.getAttribute('aria-label') ?? '';
  const classes = Array.from(element.classList).join(' ');

  return Boolean(
    (href && href !== '#') ||
      text.length > 0 ||
      aria.length > 0 ||
      hasMeaningfulSemanticClass(element) ||
      classes.length > 3,
  );
}

function isMeaninglessLink(element: Element): boolean {
  if (element.tagName.toLowerCase() !== 'a') {
    return false;
  }
  return !hasMeaningfulLink(element);
}

/**
 * Returns true when an input likely contains sensitive data.
 */
export function isSensitiveInput(element: Element): boolean {
  if (element.tagName.toLowerCase() !== 'input') {
    return false;
  }
  const type = (element.getAttribute('type') ?? 'text').toLowerCase();
  return type === 'password' || type === 'hidden';
}
