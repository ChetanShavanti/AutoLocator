/**
 * File: constants.ts
 *
 * Purpose:
 * Shared constants for analysis limits and automation attribute names.
 *
 * Responsibilities:
 * - Centralize magic numbers and attribute lists.
 *
 * Does not:
 * - Contain business logic.
 */

export const MAX_TRAVERSAL_DEPTH = 32;
export const MAX_CANDIDATES = 12;
export const ANALYSIS_TIMEOUT_MS = 30000;
export const STATE_STABILIZATION_MS = 300;
export const DROPDOWN_STABILIZATION_MS = 400;
export const MAX_DROPDOWNS_TO_PROBE = 30;

export const AUTOMATION_ATTRIBUTES = [
  'data-testid',
  'data-test-id',
  'data-qa',
  'data-cy',
  'data-automation-id',
] as const;

export const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'textarea',
  'select',
  'option',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="option"]',
  '[role="textbox"]',
  '[role="searchbox"]',
  '[role="menu"]',
  '[role="dialog"]',
  '[contenteditable="true"]',
  'summary',
  'label',
  'h1',
  'h2',
  'h3',
].join(',');

export const DESTRUCTIVE_KEYWORDS = [
  'delete',
  'remove',
  'submit',
  'save',
  'purchase',
  'pay',
  'send',
  'logout',
  'log out',
  'sign out',
  'confirm',
  'cancel order',
  'place order',
  'checkout',
] as const;

export const SETTINGS_STORAGE_KEY = 'autolocator_settings';
