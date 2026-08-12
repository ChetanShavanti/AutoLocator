/**
 * File: javaGenerator.ts
 *
 * Purpose:
 * Generate Java locator constants from analysis results.
 *
 * Responsibilities:
 * - Format sections and locators as valid Java field declarations.
 *
 * Does not:
 * - Perform locator analysis.
 */

import type { LocatorSection, NamedLocator, PatternTemplate } from '../shared/types';

/**
 * Generates Java public static final String locator declarations.
 */
export function generateJavaCode(
  sections: LocatorSection[],
  patterns: PatternTemplate[],
): string {
  const lines: string[] = ['public final class Locators {', ''];

  for (const pattern of patterns) {
    lines.push(`    public static final String ${toJavaIdentifier(pattern.name)} = "${escapeJava(pattern.template)}";`);
  }
  if (patterns.length > 0) {
    lines.push('');
  }

  for (const section of sections) {
    lines.push(`    // ${section.title}`);
    for (const locator of section.locators) {
      if (patterns.some((p) => p.elementNames.includes(locator.name))) {
        continue;
      }
      lines.push(`    ${formatJavaLocator(locator)}`);
    }
    lines.push('');
  }

  lines.push('}');
  return lines.join('\n').trim();
}

function formatJavaLocator(locator: NamedLocator): string {
  const id = toJavaIdentifier(locator.name);
  const value = escapeJava(locator.locator);
  if (locator.alternative) {
    return `public static final String ${id} = "${value}"; // Alternatives: ${locator.alternative}`;
  }
  return `public static final String ${id} = "${value}";`;
}

function toJavaIdentifier(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, '_');
  if (/^\d/.test(cleaned)) {
    return `N_${cleaned}`;
  }
  return cleaned;
}

function escapeJava(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
