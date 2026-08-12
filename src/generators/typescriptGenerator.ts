/**
 * File: typescriptGenerator.ts
 *
 * Purpose:
 * Generate TypeScript/JavaScript locator constants from analysis results.
 *
 * Responsibilities:
 * - Format sections and locators as valid TypeScript exports.
 *
 * Does not:
 * - Perform locator analysis.
 */

import type { LocatorSection, NamedLocator, PatternTemplate } from '../shared/types';

/**
 * Generates TypeScript export const locator declarations.
 */
export function generateTypeScriptCode(
  sections: LocatorSection[],
  patterns: PatternTemplate[],
): string {
  const lines: string[] = [];

  for (const pattern of patterns) {
    lines.push(`export const ${pattern.name} = "${escapeTs(pattern.template)}";`);
    for (const name of pattern.elementNames) {
      const locator = findLocator(sections, name);
      if (locator) {
        const text = extractTextToken(locator.locator);
        if (text) {
          lines.push(`export const ${name} = ${pattern.name}.replace("{}", "${escapeTs(text)}");`);
        }
      }
    }
    lines.push('');
  }

  for (const section of sections) {
    lines.push(`/** ${section.title} */`);
    for (const locator of section.locators) {
      if (patterns.some((p) => p.elementNames.includes(locator.name))) {
        continue;
      }
      lines.push(formatTsLocator(locator));
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

function formatTsLocator(locator: NamedLocator): string {
  const value = escapeTs(locator.locator);
  if (locator.alternative) {
    return `export const ${locator.name} = "${value}"; // Alternatives: ${locator.alternative}`;
  }
  return `export const ${locator.name} = "${value}";`;
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
    locator.match(/text-is\('([^']+)'\)/);
  return match?.[1] ?? '';
}

function escapeTs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
