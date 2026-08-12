/**
 * File: sectionGrouper.ts
 *
 * Purpose:
 * Group named locators into meaningful page sections.
 *
 * Responsibilities:
 * - Derive conservative section titles from page context.
 * - Organize locators for code generation and UI display.
 *
 * Does not:
 * - Access DOM or modify locators.
 */

import type { LocatorSection, NamedLocator } from '../shared/types';

/**
 * Groups locators into sections based on section hints and landmarks.
 */
export function groupIntoSections(
  locators: NamedLocator[],
  pageTitle: string,
): LocatorSection[] {
  const sectionMap = new Map<string, NamedLocator[]>();

  for (const locator of locators) {
    const section = locator.section || deriveFallbackSection(pageTitle);
    const list = sectionMap.get(section) ?? [];
    list.push(locator);
    sectionMap.set(section, list);
  }

  return Array.from(sectionMap.entries()).map(([title, items]) => ({
    title,
    locators: items,
  }));
}

function deriveFallbackSection(pageTitle: string): string {
  const cleaned = pageTitle.trim();
  if (!cleaned) {
    return 'Page Locators';
  }
  return `${cleaned} Locators`;
}

/**
 * Derives a conservative section hint from page metadata.
 */
export function deriveSectionHint(
  landmark: string,
  heading: string,
  urlPath: string,
): string {
  if (landmark) {
    return `${titleCase(landmark)} Locators`;
  }
  if (heading) {
    return `${titleCase(heading)} Locators`;
  }
  const pathSegment = extractPathSegment(urlPath);
  if (pathSegment) {
    return `${titleCase(pathSegment)} Locators`;
  }
  return 'Page Locators';
}

function extractPathSegment(urlPath: string): string {
  const segments = urlPath.split('/').filter(Boolean);
  if (segments.length === 0) {
    return '';
  }
  return segments[segments.length - 1].replace(/[-_]/g, ' ');
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
