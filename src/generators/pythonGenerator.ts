/**
 * File: pythonGenerator.ts
 *
 * Purpose:
 * Generate Python locator constants from analysis results.
 *
 * Responsibilities:
 * - Format sections, patterns, and locators as valid Python.
 *
 * Does not:
 * - Perform locator analysis.
 */

import type { LocatorSection, NamedLocator, PatternTemplate } from '../shared/types';

/**
 * Generates Python locator assignment code.
 */
export function generatePythonCode(
  sections: LocatorSection[],
  patterns: PatternTemplate[],
): string {
  const lines: string[] = [];

  for (const pattern of patterns) {
    lines.push(`${pattern.name} = "${escapePython(pattern.template)}"`);
    for (const name of pattern.elementNames) {
      const locator = findLocator(sections, name);
      if (locator) {
        const text = extractTextToken(locator.locator);
        if (text) {
          lines.push(`${name} = ${pattern.name}.format("${escapePython(text)}")`);
        }
      }
    }
    lines.push('');
  }

  for (const section of sections) {
    lines.push(`""" ${section.title} """`);
    lines.push('');
    for (const locator of section.locators) {
      if (patterns.some((p) => p.elementNames.includes(locator.name))) {
        continue;
      }
      lines.push(formatPythonLocator(locator));
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

function formatPythonLocator(locator: NamedLocator): string {
  const value = escapePython(locator.locator);
  if (locator.alternative) {
    return `${locator.name} = "${value}"  # Alternatives: ${locator.alternative}`;
  }
  return `${locator.name} = "${value}"`;
}

function findLocator(sections: LocatorSection[], name: string): NamedLocator | undefined {
  for (const section of sections) {
    const found = section.locators.find((loc) => loc.name === name);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function extractTextToken(locator: string): string {
  const match =
    locator.match(/normalize-space\(\)="([^"]+)"/) ??
    locator.match(/text-is\('([^']+)'\)/) ??
    locator.match(/='([^']+)'/);
  return match?.[1] ?? '';
}

function escapePython(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
