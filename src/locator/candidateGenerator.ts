/**
 * File: candidateGenerator.ts
 *
 * Purpose:
 * Generate locator candidates from element metadata.
 *
 * Responsibilities:
 * - Produce CSS and XPath candidates from descriptors.
 *
 * Does not:
 * - Score candidates or query the DOM.
 */

import { AUTOMATION_ATTRIBUTES } from '../shared/constants';
import { isSuspiciousIdentifier } from './suspiciousDetector';
import type { ElementDescriptor, LocatorCandidate, LocatorPreference } from '../shared/types';

/**
 * Generates ordered locator candidates for an element descriptor.
 */
export function generateCandidates(
  descriptor: ElementDescriptor,
  preference: LocatorPreference,
): LocatorCandidate[] {
  const candidates: LocatorCandidate[] = [];
  const seen = new Set<string>();

  const add = (strategy: string, value: string, type: 'css' | 'xpath'): void => {
    const key = `${type}:${value}`;
    if (!value || seen.has(key)) {
      return;
    }
    seen.add(key);
    candidates.push({ strategy, value, type });
  };

  for (const attr of AUTOMATION_ATTRIBUTES) {
    const val = descriptor.attributes[attr];
    if (val) {
      add(attr, `[${attr}="${escapeCssAttr(val)}"]`, 'css');
      add(attr, `//*[@${attr}="${escapeXPathAttr(val)}"]`, 'xpath');
    }
  }

  if (descriptor.id && !isSuspiciousIdentifier(descriptor.id)) {
    add('id', `#${escapeCssIdentifier(descriptor.id)}`, 'css');
    add('id', `//*[@id="${escapeXPathAttr(descriptor.id)}"]`, 'xpath');
  }

  if (descriptor.name) {
    add('name', `[name="${escapeCssAttr(descriptor.name)}"]`, 'css');
    add('name', `//*[@name="${escapeXPathAttr(descriptor.name)}"]`, 'xpath');
  }

  if (descriptor.ariaLabel) {
    add('aria-label', `[aria-label="${escapeCssAttr(descriptor.ariaLabel)}"]`, 'css');
    add(
      'aria-label',
      `//*[@aria-label="${escapeXPathAttr(descriptor.ariaLabel)}"]`,
      'xpath',
    );
  }

  if (descriptor.placeholder) {
    add('placeholder', `[placeholder="${escapeCssAttr(descriptor.placeholder)}"]`, 'css');
    add(
      'placeholder',
      `//*[@placeholder="${escapeXPathAttr(descriptor.placeholder)}"]`,
      'xpath',
    );
  }

  if (descriptor.accessibleName && descriptor.accessibleName !== descriptor.ariaLabel) {
    add(
      'accessible-name',
      `${descriptor.tagName}[aria-label="${escapeCssAttr(descriptor.accessibleName)}"]`,
      'css',
    );
  }

  if (descriptor.role) {
    const roleSelector = `[role="${escapeCssAttr(descriptor.role)}"]`;
    add('role', roleSelector, 'css');
  }

  if (descriptor.inputType && descriptor.tagName === 'input') {
    add('input-type', `input[type="${escapeCssAttr(descriptor.inputType)}"]`, 'css');
  }

  const stableClasses = descriptor.classes.filter(
    (cls) =>
      cls.length > 1 &&
      !isSuspiciousIdentifier(cls) &&
      !/^ng-|^css-|^sc-|^mui-|^Mui/.test(cls),
  );
  if (stableClasses.length > 0) {
    const primaryClass = stableClasses[0];
    add('class', `.${escapeCssIdentifier(primaryClass)}`, 'css');
    add(
      'class-tag',
      `${descriptor.tagName}.${escapeCssIdentifier(primaryClass)}`,
      'css',
    );
  }

  if (descriptor.visibleText && descriptor.visibleText.length <= 80) {
    const text = descriptor.visibleText.trim();
    if (text) {
      add('text-xpath', `//${descriptor.tagName}[normalize-space()="${escapeXPathAttr(text)}"]`, 'xpath');
      if (preference === 'css' && ['button', 'a', 'label'].includes(descriptor.tagName)) {
        add('text-css', `${descriptor.tagName}:has-text("${escapeCssAttr(text)}")`, 'css');
      }
    }
  }

  return candidates;
}

function escapeCssAttr(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeCssIdentifier(value: string): string {
  return value.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

function escapeXPathAttr(value: string): string {
  if (!value.includes('"')) {
    return value;
  }
  if (!value.includes("'")) {
    return value;
  }
  return value.split('"').join(', \'"\', ');
}
