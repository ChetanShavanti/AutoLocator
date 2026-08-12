/**
 * File: elementDiscovery.ts
 *
 * Purpose:
 * Discover candidate DOM elements for analysis.
 *
 * Responsibilities:
 * - Query interactive elements including open shadow roots.
 * - Build serializable element descriptors from DOM nodes.
 *
 * Does not:
 * - Filter visibility or generate locators.
 */

import {
  classifyElement,
  isSensitiveInput,
} from '../classification/actionableClassifier';
import { isConcatenatedMenuText } from '../../naming/labelExtractor';
import { INTERACTIVE_SELECTOR, MAX_TRAVERSAL_DEPTH } from '../../shared/constants';
import type { ElementDescriptor } from '../../shared/types';

/**
 * Discovers interactive elements in the document and open shadow roots.
 */
export function discoverElements(root: Document | ShadowRoot = document): Element[] {
  const results: Element[] = [];
  const seen = new Set<Element>();

  collectFromRoot(root, results, seen);

  return results;
}

function collectFromRoot(
  root: Document | ShadowRoot | Element,
  results: Element[],
  seen: Set<Element>,
): void {
  const scope = root;

  let nodes: NodeListOf<Element>;
  try {
    nodes = (scope as Document | ShadowRoot | Element).querySelectorAll(INTERACTIVE_SELECTOR);
  } catch {
    return;
  }

  for (const node of nodes) {
    if (seen.has(node)) {
      continue;
    }
    seen.add(node);
    results.push(node);

    if (node.shadowRoot) {
      collectFromRoot(node.shadowRoot, results, seen);
    }
  }

  if (root instanceof Document || root instanceof ShadowRoot) {
    const allElements = root.querySelectorAll('*');
    for (const el of allElements) {
      if (el.shadowRoot) {
        collectFromRoot(el.shadowRoot, results, seen);
      }
    }
  }
}

/**
 * Builds a serializable element descriptor from a live DOM element.
 */
export function buildElementDescriptor(element: Element, index: number): ElementDescriptor {
  const tag = element.tagName.toLowerCase();
  const role = element.getAttribute('role') ?? '';
  const inputType = tag === 'input' ? (element.getAttribute('type') ?? 'text') : '';
  const classes = Array.from(element.classList);
  const attributes: Record<string, string> = {};

  for (const attr of element.attributes) {
    if (attributes[attr.name] === undefined) {
      attributes[attr.name] = attr.value;
    }
  }

  const visibleText = getVisibleText(element);
  const accessibleName = getAccessibleName(element, visibleText);
  const landmark = findLandmark(element);

  return {
    nodeIndex: index,
    tagName: tag,
    elementKind: classifyElement(element),
    role,
    inputType,
    id: element.id ?? '',
    name: element.getAttribute('name') ?? '',
    placeholder: element.getAttribute('placeholder') ?? '',
    ariaLabel: element.getAttribute('aria-label') ?? '',
    accessibleName,
    visibleText,
    classes,
    attributes,
    isDisabled: isDisabledElement(element),
    isSensitive: isSensitiveInput(element),
    sectionHint: '',
    landmark,
  };
}

function getVisibleText(element: Element): string {
  const direct = getDirectVisibleText(element);
  if (direct && !isConcatenatedMenuText(direct)) {
    return direct.length > 120 ? direct.slice(0, 120) : direct;
  }

  const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (isConcatenatedMenuText(text)) {
    return direct.length > 120 ? direct.slice(0, 120) : direct;
  }
  if (text.length > 120) {
    return text.slice(0, 120);
  }
  return text;
}

function getDirectVisibleText(element: Element): string {
  let text = '';
  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent ?? '';
    }
  }
  return text.replace(/\s+/g, ' ').trim();
}

function getAccessibleName(element: Element, fallbackText: string): string {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl?.textContent) {
      return labelEl.textContent.trim();
    }
  }

  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel.trim();
  }

  if (element.id) {
    const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if (label?.textContent) {
      return label.textContent.trim();
    }
  }

  const parentLabel = element.closest('label');
  if (parentLabel?.textContent) {
    return parentLabel.textContent.trim();
  }

  const tag = element.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    const title = element.getAttribute('title');
    if (title) {
      return title.trim();
    }
    return '';
  }

  return fallbackText;
}

function findLandmark(element: Element): string {
  let current: Element | null = element;
  let depth = 0;
  while (current && depth < MAX_TRAVERSAL_DEPTH) {
    const role = current.getAttribute('role');
    const tag = current.tagName.toLowerCase();
    if (role === 'main' || role === 'navigation' || role === 'banner' || role === 'contentinfo') {
      return role;
    }
    if (['nav', 'main', 'header', 'footer', 'aside'].includes(tag)) {
      return tag;
    }
    current = current.parentElement;
    depth += 1;
  }
  return '';
}

function isDisabledElement(element: Element): boolean {
  if ('disabled' in element && (element as HTMLInputElement).disabled) {
    return true;
  }
  return element.getAttribute('aria-disabled') === 'true';
}

/**
 * Resolves a discovered element by its analysis index.
 */
export function resolveElementByIndex(index: number, elements: Element[]): Element | null {
  return elements[index] ?? null;
}
