/**
 * File: elementNamer.ts
 *
 * Purpose:
 * Generate deterministic, human-readable names for elements.
 *
 * Responsibilities:
 * - Derive names from labels, ARIA, text, and context.
 * - Resolve naming collisions safely.
 *
 * Does not:
 * - Access DOM or generate locator strings.
 */

import { isSuspiciousIdentifier, isUserEnteredValue } from '../locator/suspiciousDetector';
import { getShortElementLabel, isConcatenatedMenuText } from './labelExtractor';
import { applyTypePrefix } from './namePrefix';
import type { ElementDescriptor, ElementKind, OutputLanguage } from '../shared/types';

const ABBREVIATIONS: Record<string, string> = {
  nav: 'Navigation',
  btn: 'Button',
  rgt: 'Region',
  reg: 'Region',
  frm: 'Form',
  txt: 'Text',
  inp: 'Input',
  lbl: 'Label',
  hdr: 'Header',
  ftr: 'Footer',
  mnu: 'Menu',
  lnk: 'Link',
  pwd: 'Password',
  usr: 'User',
  login: 'Login',
  logout: 'Logout',
};

/**
 * Generates a unique element name for the given descriptor.
 */
export function generateElementName(
  descriptor: ElementDescriptor,
  usedNames: Set<string>,
  language: OutputLanguage,
): string {
  const base = deriveBaseName(descriptor);
  const sanitized = sanitizeName(base, language);
  const prefixed = applyTypePrefix(descriptor.elementKind, sanitized);
  return resolveCollision(prefixed, usedNames, descriptor);
}

/**
 * Derives a base name from element metadata.
 */
export function deriveBaseName(descriptor: ElementDescriptor): string {
  const sources = collectNameSources(descriptor);

  for (const source of sources) {
    const cleaned = cleanLabel(source);
    if (cleaned) {
      return cleaned;
    }
  }

  return descriptor.elementKind === 'unknown' ? 'Element' : titleCase(descriptor.elementKind);
}

function collectNameSources(descriptor: ElementDescriptor): string[] {
  const sources: string[] = [];

  if (descriptor.ariaLabel && !isConcatenatedMenuText(descriptor.ariaLabel)) {
    sources.push(descriptor.ariaLabel);
  }
  if (descriptor.placeholder) {
    sources.push(descriptor.placeholder);
  }
  if (descriptor.name) {
    sources.push(descriptor.name);
  }
  if (descriptor.accessibleName && !isUserEnteredValue(descriptor.accessibleName)) {
    if (!isConcatenatedMenuText(descriptor.accessibleName)) {
      sources.push(descriptor.accessibleName);
    }
  }
  if (descriptor.visibleText && !isUserEnteredValue(descriptor.visibleText)) {
    if (!isConcatenatedMenuText(descriptor.visibleText)) {
      sources.push(descriptor.visibleText);
    }
  }

  const humanizedId = humanizeIdentifier(descriptor.id);
  if (humanizedId) {
    sources.push(humanizedId);
  }

  const className = humanizeFromClasses(descriptor.classes);
  if (className) {
    sources.push(className);
  }

  const landmarkName = buildLandmarkName(descriptor.landmark, descriptor.elementKind);
  if (landmarkName) {
    sources.push(landmarkName);
  }

  if (descriptor.elementKind !== 'unknown') {
    sources.push(descriptor.elementKind);
  }

  sources.push(descriptor.tagName);
  return sources;
}

/**
 * Generates a dropdown control name from a live element label.
 */
export function generateDropdownControlName(
  label: string,
  usedNames: Set<string>,
  language: OutputLanguage,
): string {
  const base = sanitizeName(label || 'Select', language);
  const prefixed = applyTypePrefix('select', base);
  return resolveCollision(prefixed, usedNames, {
    elementKind: 'select',
    tagName: 'select',
    sectionHint: '',
  });
}

/**
 * Generates a dropdown option name from control and option labels.
 */
export function generateDropdownOptionName(
  controlName: string,
  optionLabel: string,
  usedNames: Set<string>,
  language: OutputLanguage,
): string {
  const optionPart = sanitizeName(optionLabel, language);
  const prefixedControl = controlName.startsWith('DD_') ? controlName : `DD_${controlName}`;
  const candidate = `${prefixedControl}_${optionPart}`;
  return resolveCollision(candidate, usedNames, {
    elementKind: 'option',
    tagName: 'option',
    sectionHint: '',
  });
}

/**
 * Resolves a dropdown control label from a live DOM element.
 */
export function resolveDropdownLabelFromElement(element: Element): string {
  return getShortElementLabel(element);
}

/**
 * Converts stable ids such as rgtnav into readable names.
 */
export function humanizeIdentifier(id: string): string {
  if (!id || isSuspiciousIdentifier(id)) {
    return '';
  }

  const lower = id.toLowerCase();
  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    if (lower.endsWith(abbr) && lower.length > abbr.length + 1) {
      const prefix = id.slice(0, -abbr.length);
      const prefixPart = ABBREVIATIONS[prefix.toLowerCase()] ?? titleCase(prefix);
      return `${prefixPart}${full}`;
    }
  }

  const expanded = id
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => ABBREVIATIONS[part.toLowerCase()] ?? titleCase(part))
    .join('');

  return expanded.length >= 2 ? expanded : '';
}

function humanizeFromClasses(classes: string[]): string {
  const stable = classes.filter((cls) => cls.length > 2 && !isSuspiciousIdentifier(cls));
  if (stable.length === 0) {
    return '';
  }

  const primary = stable[0]
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => ABBREVIATIONS[part.toLowerCase()] ?? titleCase(part))
    .join('');

  return primary.length >= 3 ? primary : '';
}

function buildLandmarkName(landmark: string, kind: ElementKind): string {
  if (!landmark) {
    return '';
  }
  const landmarkLabel = titleCase(landmark.replace(/^role:/, ''));
  if (kind === 'unknown' || kind === 'navigation') {
    return `${landmarkLabel}Navigation`;
  }
  return `${landmarkLabel}${titleCase(kind)}`;
}

function resolveCollision(
  base: string,
  usedNames: Set<string>,
  descriptor: Pick<ElementDescriptor, 'elementKind' | 'tagName' | 'sectionHint'>,
): string {
  if (!usedNames.has(base)) {
    usedNames.add(base);
    return base;
  }

  const suffixes = [
    titleCase(descriptor.elementKind),
    titleCase(descriptor.tagName),
    descriptor.sectionHint ? titleCase(descriptor.sectionHint) : '',
    'Alt',
  ].filter(Boolean);

  for (const suffix of suffixes) {
    const candidate = `${base}_${suffix}`;
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
  }

  let index = 2;
  while (usedNames.has(`${base}_${index}`)) {
    index += 1;
  }
  const finalName = `${base}_${index}`;
  usedNames.add(finalName);
  return finalName;
}

function sanitizeName(value: string, language: OutputLanguage): string {
  let name = value
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!name) {
    return 'Element';
  }

  if (/^\d/.test(name)) {
    name = `N_${name}`;
  }

  if (language === 'java' || language === 'typescript') {
    return toPascalCase(name);
  }

  return name;
}

function cleanLabel(value: string): string {
  if (!value || isConcatenatedMenuText(value)) {
    return '';
  }
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length > 40) {
    return trimmed.slice(0, 40).trim();
  }
  return trimmed;
}

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

function toPascalCase(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
