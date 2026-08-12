/**
 * File: patternDetector.ts
 *
 * Purpose:
 * Detect reusable locator patterns across multiple elements.
 *
 * Responsibilities:
 * - Identify repeated selector structures suitable for templates.
 *
 * Does not:
 * - Modify locators or access DOM.
 */

import type { NamedLocator, PatternTemplate } from '../shared/types';

interface PatternGroup {
  templateBase: string;
  items: NamedLocator[];
}

/**
 * Detects reusable patterns when confidence is high enough.
 */
export function detectPatterns(locators: NamedLocator[]): PatternTemplate[] {
  const groups = new Map<string, PatternGroup>();

  for (const locator of locators) {
    const patternKey = extractPatternKey(locator.locator);
    if (!patternKey) {
      continue;
    }
    const existing = groups.get(patternKey) ?? { templateBase: patternKey, items: [] };
    existing.items.push(locator);
    groups.set(patternKey, existing);
  }

  const patterns: PatternTemplate[] = [];

  for (const [key, group] of groups.entries()) {
    if (group.items.length < 3) {
      continue;
    }

    const template = buildTemplate(key);
    if (!template) {
      continue;
    }

    patterns.push({
      name: derivePatternName(key),
      template,
      elementNames: group.items.map((item) => item.name),
      confidence: Math.min(0.95, 0.6 + group.items.length * 0.05),
    });
  }

  return patterns;
}

function extractPatternKey(locator: string): string | null {
  const menuItemMatch = locator.match(/^(a\.[a-z0-9_-]+)\s+span:text-is\(/i);
  if (menuItemMatch) {
    return menuItemMatch[1];
  }

  const classMatch = locator.match(/^([a-z]+\.[a-z0-9_-]+)$/i);
  if (classMatch) {
    return classMatch[1];
  }

  if (locator.startsWith('//option[normalize-space()=')) {
    return '//option[normalize-space()=\'\']';
  }

  return null;
}

function buildTemplate(key: string): string | null {
  if (key.startsWith('//option')) {
    return "//option[normalize-space()='{}']";
  }
  if (key.includes('.')) {
    return `${key} span:text-is('{}')`;
  }
  return null;
}

function derivePatternName(key: string): string {
  const cleaned = key.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `${cleaned || 'reusable'}_pattern`;
}

/**
 * Applies detected patterns to simplify generated output when beneficial.
 */
export function applyPatternsToLocators(
  locators: NamedLocator[],
  patterns: PatternTemplate[],
): { locators: NamedLocator[]; patterns: PatternTemplate[] } {
  if (patterns.length === 0) {
    return { locators, patterns: [] };
  }

  const patternNames = new Set(patterns.flatMap((p) => p.elementNames));
  const filtered = locators.filter((loc) => !patternNames.has(loc.name));

  return { locators: filtered, patterns };
}
