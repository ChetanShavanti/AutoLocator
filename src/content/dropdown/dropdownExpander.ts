/**
 * File: dropdownExpander.ts
 *
 * Purpose:
 * Safely open dropdown controls to discover options hidden until expanded.
 *
 * Responsibilities:
 * - Identify dropdown triggers on the page.
 * - Open, collect option elements, and restore prior UI state.
 *
 * Does not:
 * - Call external services or submit forms.
 * - Select destructive menu actions.
 */

import {
  DESTRUCTIVE_KEYWORDS,
  DROPDOWN_STABILIZATION_MS,
  MAX_DROPDOWNS_TO_PROBE,
  STATE_STABILIZATION_MS,
} from '../../shared/constants';
import {
  getDirectElementText,
  getShortElementLabel,
  isMenuContainer,
} from '../../naming/labelExtractor';
import { isElementDiscoverable } from '../visibility/visibilityFilter';

export interface ExpandedDropdownResult {
  trigger: HTMLElement;
  options: Element[];
  wasOpened: boolean;
}

const OPTION_SELECTOR = [
  '[role="option"]',
  '[role="menuitem"]',
  '.dropdown-item',
  '.select-option',
  '.oxd-dropdown-option',
  'li.option',
].join(',');

const TRIGGER_SCAN_SELECTOR = [
  '.oxd-select-text-input',
  '.oxd-select-text',
  '[role="combobox"]',
  '[aria-haspopup="listbox"]',
  '[aria-haspopup="menu"]',
  '[aria-expanded]',
  '[class*="dropdown"]',
  '[class*="combobox"]',
  '[class*="oxd-select"]',
].join(',');

/**
 * Opens safe dropdown triggers and returns newly visible option elements.
 */
export async function expandHiddenDropdowns(
  elements: Element[],
  warnings: string[],
): Promise<ExpandedDropdownResult[]> {
  const triggers = dedupeNestedTriggers(findDropdownTriggers(elements));
  const results: ExpandedDropdownResult[] = [];

  for (const trigger of triggers) {
    if (results.length >= MAX_DROPDOWNS_TO_PROBE) {
      warnings.push(`Stopped after ${MAX_DROPDOWNS_TO_PROBE} dropdown expansions.`);
      break;
    }

    try {
      const initialOpen = isDropdownOpen(trigger);
      const beforeCount = collectVisibleOptions(trigger).length;

      if (!initialOpen) {
        const opened = await openDropdown(trigger);
        if (!opened) {
          continue;
        }
      }

      const options = collectVisibleOptions(trigger);
      if (options.length === 0 || options.length <= beforeCount) {
        if (!initialOpen) {
          await closeDropdown(trigger, false);
        }
        continue;
      }

      results.push({
        trigger,
        options,
        wasOpened: !initialOpen,
      });

      if (!initialOpen) {
        await closeDropdown(trigger, false);
      }
    } catch {
      warnings.push(`Could not safely expand dropdown near "${describeTrigger(trigger)}".`);
    }
  }

  return results;
}

/**
 * Returns true when an element appears to be a safe dropdown trigger.
 */
export function isSafeDropdownTrigger(element: Element): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const normalized = normalizeDropdownTrigger(element);
  if (!isDropdownTrigger(normalized)) {
    return false;
  }

  if (isMenuContainer(normalized)) {
    return false;
  }

  if (normalized.hasAttribute('disabled') || normalized.getAttribute('aria-disabled') === 'true') {
    return false;
  }

  const text = getDirectTriggerText(normalized);
  if (DESTRUCTIVE_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return false;
  }

  if (normalized.tagName.toLowerCase() === 'a') {
    const href = normalized.getAttribute('href') ?? '';
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      return false;
    }
  }

  if (normalized.tagName.toLowerCase() === 'input') {
    const type = (normalized.getAttribute('type') ?? '').toLowerCase();
    if (['submit', 'button'].includes(type) && /submit|save|send|pay|purchase/.test(text)) {
      return false;
    }
  }

  return true;
}

/**
 * Returns true when an element looks like a custom dropdown trigger.
 */
export function isDropdownTrigger(element: Element): boolean {
  const normalized = normalizeDropdownTrigger(element instanceof HTMLElement ? element : null);
  if (!normalized) {
    return false;
  }

  const tag = normalized.tagName.toLowerCase();
  const role = normalized.getAttribute('role') ?? '';
  const haspopup = normalized.getAttribute('aria-haspopup') ?? '';

  if (tag === 'select') {
    return false;
  }
  if (isMenuContainer(normalized)) {
    return false;
  }
  if (role === 'combobox') {
    return true;
  }
  if (haspopup === 'listbox' || haspopup === 'menu' || haspopup === 'true') {
    return true;
  }
  if (normalized.hasAttribute('aria-expanded')) {
    return true;
  }

  const classes = Array.from(normalized.classList).join(' ').toLowerCase();
  return /(dropdown|combobox|oxd-select|multiselect)/.test(classes);
}

function findDropdownTriggers(elements: Element[]): HTMLElement[] {
  const triggers: HTMLElement[] = [];
  const seen = new Set<Element>();

  for (const element of elements) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }
    const normalized = normalizeDropdownTrigger(element);
    if (isSafeDropdownTrigger(normalized) && !seen.has(normalized)) {
      triggers.push(normalized);
      seen.add(normalized);
    }
  }

  let scanned: NodeListOf<Element>;
  try {
    scanned = document.querySelectorAll(TRIGGER_SCAN_SELECTOR);
  } catch {
    return triggers;
  }

  for (const node of scanned) {
    if (!(node instanceof HTMLElement) || seen.has(node)) {
      continue;
    }
    const normalized = normalizeDropdownTrigger(node);
    if (seen.has(normalized)) {
      continue;
    }
    if (!isElementDiscoverable(normalized, 'document')) {
      continue;
    }
    if (!isSafeDropdownTrigger(normalized)) {
      continue;
    }
    triggers.push(normalized);
    seen.add(normalized);
  }

  return triggers;
}

function dedupeNestedTriggers(triggers: HTMLElement[]): HTMLElement[] {
  return triggers.filter(
    (trigger) => !triggers.some((other) => other !== trigger && trigger.contains(other)),
  );
}

function normalizeDropdownTrigger(element: HTMLElement | null): HTMLElement {
  if (!element) {
    throw new Error('Missing dropdown trigger');
  }

  if (element.matches('.oxd-select-text-input, .oxd-select-text')) {
    return element;
  }

  const oxdInput = element.querySelector('.oxd-select-text-input');
  if (oxdInput instanceof HTMLElement) {
    return oxdInput;
  }

  const oxdText = element.querySelector('.oxd-select-text');
  if (oxdText instanceof HTMLElement) {
    return oxdText;
  }

  return element;
}

async function openDropdown(trigger: HTMLElement): Promise<boolean> {
  const clickTarget = resolveClickTarget(trigger);
  clickTarget.click();
  await wait(DROPDOWN_STABILIZATION_MS);

  if (isDropdownOpen(trigger)) {
    return true;
  }

  const oxdText = trigger.closest('.oxd-select-text') as HTMLElement | null;
  if (oxdText && oxdText !== clickTarget) {
    oxdText.click();
    await wait(DROPDOWN_STABILIZATION_MS);
    if (isDropdownOpen(trigger)) {
      return true;
    }
  }

  clickTarget.focus();
  clickTarget.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
  );
  clickTarget.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  );
  await wait(DROPDOWN_STABILIZATION_MS);
  return isDropdownOpen(trigger);
}

function resolveClickTarget(trigger: HTMLElement): HTMLElement {
  if (trigger.matches('.oxd-select-text-input, .oxd-select-text')) {
    return trigger;
  }
  const inner = trigger.querySelector('.oxd-select-text-input, .oxd-select-text');
  if (inner instanceof HTMLElement) {
    return inner;
  }
  return trigger;
}

async function closeDropdown(trigger: HTMLElement, wasOpen: boolean): Promise<void> {
  const clickTarget = resolveClickTarget(trigger);
  if (isDropdownOpen(trigger) !== wasOpen) {
    clickTarget.click();
    await wait(DROPDOWN_STABILIZATION_MS);
  }

  if (isDropdownOpen(trigger)) {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await wait(STATE_STABILIZATION_MS);
  }
}

function isDropdownOpen(trigger: HTMLElement): boolean {
  if (trigger.getAttribute('aria-expanded') === 'true') {
    return true;
  }

  const wrapper = trigger.closest('.oxd-select-wrapper');
  if (wrapper?.querySelector('.oxd-select-text--active, .oxd-select-text--focus')) {
    const menu = document.querySelector('.oxd-dropdown-menu');
    if (menu instanceof HTMLElement && isPanelVisible(menu)) {
      return true;
    }
  }

  const controls = trigger.getAttribute('aria-controls') ?? trigger.getAttribute('aria-owns');
  if (controls) {
    for (const id of controls.split(/\s+/)) {
      const panel = document.getElementById(id);
      if (panel && isPanelVisible(panel)) {
        return true;
      }
    }
  }

  return collectVisibleOptions(trigger).length > 0;
}

function collectVisibleOptions(trigger: HTMLElement): Element[] {
  const options: Element[] = [];
  const seen = new Set<Element>();

  const controls = trigger.getAttribute('aria-controls') ?? trigger.getAttribute('aria-owns');
  if (controls) {
    for (const id of controls.split(/\s+/)) {
      const panel = document.getElementById(id);
      if (panel) {
        addOptionsFromContainer(panel, options, seen);
      }
    }
  }

  const panels = document.querySelectorAll(
    [
      '[role="listbox"]',
      '[role="menu"]',
      '.dropdown-menu',
      '.oxd-dropdown-menu',
      '.oxd-dropdown-options',
    ].join(','),
  );
  for (const panel of panels) {
    if (!isPanelVisible(panel)) {
      continue;
    }
    if (!isPanelRelatedToTrigger(panel, trigger)) {
      continue;
    }
    addOptionsFromContainer(panel, options, seen);
  }

  if (options.length === 0) {
    for (const option of document.querySelectorAll('.oxd-dropdown-option, [role="option"]')) {
      if (isOptionVisible(option)) {
        addOption(option, options, seen);
      }
    }
  }

  return options;
}

function isOptionVisible(option: Element): boolean {
  if (!(option instanceof HTMLElement)) {
    return false;
  }
  if (!option.isConnected) {
    return false;
  }
  const style = window.getComputedStyle(option);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  if (option.closest('[hidden]')) {
    return false;
  }
  const parentPanel = option.closest(
    '[role="listbox"], [role="menu"], .dropdown-menu, .oxd-dropdown-menu',
  );
  if (parentPanel instanceof HTMLElement) {
    const panelStyle = window.getComputedStyle(parentPanel);
    if (panelStyle.display === 'none' || panelStyle.visibility === 'hidden') {
      return false;
    }
  }
  return true;
}

function addOptionsFromContainer(container: Element, options: Element[], seen: Set<Element>): void {
  container.querySelectorAll(OPTION_SELECTOR).forEach((option) => {
    addOption(option, options, seen);
  });
}

function addOption(option: Element, options: Element[], seen: Set<Element>): void {
  if (seen.has(option)) {
    return;
  }
  const text = (option.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (!text || text.length > 120) {
    return;
  }
  if (!isOptionVisible(option)) {
    return;
  }
  seen.add(option);
  options.push(option);
}

function isPanelVisible(panel: Element): boolean {
  if (!(panel instanceof HTMLElement)) {
    return false;
  }
  const style = window.getComputedStyle(panel);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  const rect = panel.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isPanelRelatedToTrigger(panel: Element, trigger: HTMLElement): boolean {
  const controls = trigger.getAttribute('aria-controls') ?? trigger.getAttribute('aria-owns') ?? '';
  if (controls.split(/\s+/).includes(panel.id)) {
    return true;
  }
  if (panel.contains(trigger) || trigger.contains(panel)) {
    return true;
  }

  const wrapper = trigger.closest('.oxd-select-wrapper');
  if (wrapper && panel.classList.contains('oxd-dropdown-menu')) {
    return true;
  }

  const triggerRect = trigger.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const verticalDistance = Math.abs(triggerRect.bottom - panelRect.top);
  return verticalDistance < 360;
}

function getDirectTriggerText(element: Element): string {
  const aria = element.getAttribute('aria-label')?.trim().toLowerCase() ?? '';
  if (aria) {
    return aria;
  }

  const direct = getDirectElementText(element).toLowerCase();
  if (direct) {
    return direct;
  }

  const shortLabel = getShortElementLabel(element).toLowerCase();
  return shortLabel;
}

function describeTrigger(trigger: HTMLElement): string {
  return (
    getShortElementLabel(trigger) ||
    trigger.getAttribute('aria-label') ||
    getDirectElementText(trigger).slice(0, 40) ||
    trigger.id ||
    trigger.tagName.toLowerCase()
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
