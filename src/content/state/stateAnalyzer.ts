/**
 * File: stateAnalyzer.ts
 *
 * Purpose:
 * Detect useful before/after state locators using safe, non-destructive probing.
 *
 * Responsibilities:
 * - Infer state from ARIA attributes when possible.
 * - Perform limited safe toggles for expandable controls.
 *
 * Does not:
 * - Trigger destructive actions (submit, delete, purchase, etc.).
 */

import { DESTRUCTIVE_KEYWORDS, STATE_STABILIZATION_MS } from '../../shared/constants';
import type { NamedLocator } from '../../shared/types';

export interface StateLocatorPair {
  closed?: NamedLocator;
  opened?: NamedLocator;
}

/**
 * Attempts to extract state locators from ARIA attributes without interaction.
 */
export function inferStateFromAttributes(
  element: Element,
  baseName: string,
  locatorClosed: string,
  locatorType: 'css' | 'xpath',
  section: string,
): StateLocatorPair | null {
  const expanded = element.getAttribute('aria-expanded');
  if (expanded === 'true' || expanded === 'false') {
    return {
      closed: {
        name: `${baseName}Closed`,
        locator: buildStateLocator(element, 'false', locatorClosed, locatorType),
        locatorType,
        elementType: 'state',
        section,
        isRisky: false,
        stateLabel: 'closed',
      },
      opened: {
        name: `${baseName}Opened`,
        locator: buildStateLocator(element, 'true', locatorClosed, locatorType),
        locatorType,
        elementType: 'state',
        section,
        isRisky: false,
        stateLabel: 'open',
      },
    };
  }

  return null;
}

/**
 * Safely probes expandable controls when interaction appears non-destructive.
 */
export async function probeSafeState(
  element: HTMLElement,
  baseName: string,
  locator: string,
  locatorType: 'css' | 'xpath',
  section: string,
): Promise<StateLocatorPair | null> {
  if (!isSafeToProbe(element)) {
    return null;
  }

  const expanded = element.getAttribute('aria-expanded');
  if (expanded !== 'true' && expanded !== 'false') {
    return null;
  }

  const initialExpanded = expanded === 'true';

  try {
    element.click();
    await waitForStabilization();
    const afterExpanded = element.getAttribute('aria-expanded');
    if (!afterExpanded || afterExpanded === expanded) {
      restoreState(element, initialExpanded);
      return null;
    }

    const pair: StateLocatorPair = {
      closed: {
        name: `${baseName}Closed`,
        locator: buildStateLocator(element, 'false', locator, locatorType),
        locatorType,
        elementType: 'state',
        section,
        isRisky: false,
      },
      opened: {
        name: `${baseName}Opened`,
        locator: buildStateLocator(element, 'true', locator, locatorType),
        locatorType,
        elementType: 'state',
        section,
        isRisky: false,
      },
    };

    restoreState(element, initialExpanded);
    await waitForStabilization();
    return pair;
  } catch {
    restoreState(element, initialExpanded);
    return null;
  }
}

/**
 * Returns true when automatic probing is considered safe for the element.
 */
export function isSafeToProbe(element: Element): boolean {
  const text = [
    element.textContent ?? '',
    element.getAttribute('aria-label') ?? '',
    element.getAttribute('title') ?? '',
    element.getAttribute('name') ?? '',
    element.id ?? '',
  ]
    .join(' ')
    .toLowerCase();

  if (DESTRUCTIVE_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return false;
  }

  if (element.tagName.toLowerCase() === 'a') {
    const href = element.getAttribute('href') ?? '';
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      return false;
    }
  }

  if (element.tagName.toLowerCase() === 'input') {
    const type = (element.getAttribute('type') ?? '').toLowerCase();
    if (['submit', 'button'].includes(type) && text.match(/submit|save|send|pay|purchase/)) {
      return false;
    }
  }

  const expanded = element.getAttribute('aria-expanded');
  return expanded === 'true' || expanded === 'false';
}

function buildStateLocator(
  element: Element,
  state: string,
  _fallback: string,
  locatorType: 'css' | 'xpath',
): string {
  if (element.id) {
    if (locatorType === 'css') {
      return `#${CSS.escape(element.id)}[aria-expanded="${state}"]`;
    }
    return `//*[@id="${element.id}" and @aria-expanded="${state}"]`;
  }
  if (locatorType === 'css') {
    return `[aria-expanded="${state}"]`;
  }
  return `//*[@aria-expanded="${state}"]`;
}

function restoreState(element: HTMLElement, wasExpanded: boolean): void {
  const current = element.getAttribute('aria-expanded') === 'true';
  if (current !== wasExpanded) {
    element.click();
  }
}

function waitForStabilization(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, STATE_STABILIZATION_MS);
  });
}
