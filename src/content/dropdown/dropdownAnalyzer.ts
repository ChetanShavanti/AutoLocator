/**
 * File: dropdownAnalyzer.ts
 *
 * Purpose:
 * Analyze native and custom dropdown controls safely.
 *
 * Responsibilities:
 * - Extract option locators from native select elements.
 * - Inspect ARIA listbox/combobox options when visible.
 * - Include options discovered by dropdown expansion probing.
 *
 * Does not:
 * - Select destructive options or submit forms.
 */

import { generateCandidates } from '../../locator/candidateGenerator';
import { scoreCandidates } from '../../locator/locatorScorer';
import { selectBestLocator } from '../../locator/locatorSelector';
import {
  generateDropdownControlName,
  generateDropdownOptionName,
  resolveDropdownLabelFromElement,
} from '../../naming/elementNamer';
import { getAssociatedFieldLabel } from '../../naming/labelExtractor';
import type {
  LocatorPreference,
  NamedLocator,
  OutputLanguage,
  UniquenessContext,
} from '../../shared/types';
import type { ExpandedDropdownResult } from './dropdownExpander';

/**
 * Analyzes dropdown controls and returns locators for control and options.
 */
export function analyzeDropdowns(
  elements: Element[],
  context: UniquenessContext,
  preference: LocatorPreference,
  language: OutputLanguage,
  section: string,
  usedNames: Set<string>,
  probedDropdowns: ExpandedDropdownResult[] = [],
): NamedLocator[] {
  const results: NamedLocator[] = [];

  for (const element of elements) {
    if (element.tagName.toLowerCase() === 'select') {
      results.push(...analyzeNativeSelect(element, context, preference, language, section, usedNames));
      continue;
    }

    const role = element.getAttribute('role') ?? '';
    if (role === 'combobox' || role === 'listbox') {
      results.push(...analyzeCustomDropdown(element, context, preference, language, section, usedNames));
    }
  }

  for (const probed of probedDropdowns) {
    results.push(
      ...analyzeProbedDropdown(probed, context, preference, language, section, usedNames),
    );
  }

  return results;
}

function analyzeProbedDropdown(
  probed: ExpandedDropdownResult,
  context: UniquenessContext,
  preference: LocatorPreference,
  language: OutputLanguage,
  section: string,
  usedNames: Set<string>,
): NamedLocator[] {
  const locators: NamedLocator[] = [];
  const trigger = probed.trigger;
  const controlLabel = resolveDropdownControlLabel(trigger);
  const controlName = generateDropdownControlName(controlLabel, usedNames, language);

  const controlDescriptor = buildMinimalDescriptor(trigger, 'select');
  controlDescriptor.accessibleName = controlLabel;
  const controlCandidates = generateCandidates(controlDescriptor, preference);
  const controlScored = scoreCandidates(controlCandidates, context, preference);
  const controlSelected = selectBestLocator(controlScored, preference);

  if (controlSelected) {
    locators.push({
      name: controlName,
      locator: controlSelected.locator,
      locatorType: controlSelected.locatorType,
      alternative: controlSelected.alternative,
      elementType: 'select',
      section,
      isRisky: controlSelected.isRisky,
    });
  }

  for (const option of probed.options) {
    const text = (option.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!text) {
      continue;
    }

    locators.push(
      ...buildOptionLocators(
        option,
        text,
        context,
        preference,
        language,
        section,
        usedNames,
        controlName,
      ),
    );
  }

  return locators;
}

function analyzeNativeSelect(
  select: Element,
  context: UniquenessContext,
  preference: LocatorPreference,
  language: OutputLanguage,
  section: string,
  usedNames: Set<string>,
): NamedLocator[] {
  const locators: NamedLocator[] = [];
  const descriptor = buildMinimalDescriptor(select, 'select');
  const controlLabel = resolveDropdownControlLabel(select);
  const controlName = generateDropdownControlName(controlLabel, usedNames, language);
  const controlCandidates = generateCandidates(descriptor, preference);
  const scored = scoreCandidates(controlCandidates, context, preference);
  const selected = selectBestLocator(scored, preference);

  if (selected) {
    locators.push({
      name: controlName,
      locator: selected.locator,
      locatorType: selected.locatorType,
      alternative: selected.alternative,
      elementType: 'select',
      section,
      isRisky: selected.isRisky,
    });
  }

  const options = select.querySelectorAll('option');
  for (const option of options) {
    const text = (option.textContent ?? '').trim();
    if (!text || option.hasAttribute('hidden')) {
      continue;
    }

    locators.push(
      ...buildOptionLocators(option, text, context, preference, language, section, usedNames, controlName),
    );
  }

  return locators;
}

function analyzeCustomDropdown(
  element: Element,
  context: UniquenessContext,
  preference: LocatorPreference,
  language: OutputLanguage,
  section: string,
  usedNames: Set<string>,
): NamedLocator[] {
  const locators: NamedLocator[] = [];
  const options = element.querySelectorAll('[role="option"]');
  if (options.length === 0) {
    return locators;
  }

  const controlName = generateDropdownControlName(
    resolveDropdownControlLabel(element),
    usedNames,
    language,
  );

  for (const option of options) {
    const text = (option.textContent ?? '').trim();
    if (!text) {
      continue;
    }

    locators.push(
      ...buildOptionLocators(option, text, context, preference, language, section, usedNames, controlName),
    );
  }

  return locators;
}

function buildOptionLocators(
  option: Element,
  text: string,
  context: UniquenessContext,
  preference: LocatorPreference,
  language: OutputLanguage,
  section: string,
  usedNames: Set<string>,
  controlName: string,
): NamedLocator[] {
  const locators: NamedLocator[] = [];
  const optionDescriptor = buildMinimalDescriptor(option, 'option');
  optionDescriptor.visibleText = text;
  optionDescriptor.accessibleName = text;

  const optionCandidates = generateCandidates(optionDescriptor, preference);
  if (!optionCandidates.some((candidate) => candidate.strategy === 'text-xpath')) {
    optionCandidates.unshift({
      strategy: 'option-text',
      value: `//option[normalize-space()="${escapeXPath(text)}"]`,
      type: 'xpath',
    });
  }
  optionCandidates.unshift({
    strategy: 'option-role',
    value: `//*[@role="option"][contains(normalize-space(.), "${escapeXPath(text)}")]`,
    type: 'xpath',
  });
  optionCandidates.unshift({
    strategy: 'option-oxd',
    value: `//*[contains(@class,"oxd-dropdown-option")][contains(normalize-space(.), "${escapeXPath(text)}")]`,
    type: 'xpath',
  });

  const optionScored = scoreCandidates(optionCandidates, context, preference);
  let optionSelected = selectBestLocator(optionScored, preference);

  if (!optionSelected) {
    const fallback = optionCandidates.find((candidate) => candidate.strategy.startsWith('option-'));
    if (fallback) {
      optionSelected = {
        locator: fallback.value,
        locatorType: fallback.type,
        isRisky: true,
        uniqueness: 1,
      };
    }
  }

  if (!optionSelected) {
    return locators;
  }

  const optionName = generateDropdownOptionName(controlName, text, usedNames, language);
  locators.push({
    name: optionName,
    locator: optionSelected.locator,
    locatorType: optionSelected.locatorType,
    alternative: optionSelected.alternative,
    elementType: 'option',
    section,
    isRisky: optionSelected.isRisky,
  });

  return locators;
}

function resolveDropdownControlLabel(element: Element): string {
  return (
    getAssociatedFieldLabel(element) ||
    resolveDropdownLabelFromElement(element) ||
    element.getAttribute('name') ||
    element.id ||
    'Select'
  );
}

function buildMinimalDescriptor(
  element: Element,
  kind: 'select' | 'option',
): import('../../shared/types').ElementDescriptor {
  return {
    nodeIndex: 0,
    tagName: element.tagName.toLowerCase(),
    elementKind: kind,
    role: element.getAttribute('role') ?? '',
    inputType: '',
    id: element.id ?? '',
    name: element.getAttribute('name') ?? '',
    placeholder: '',
    ariaLabel: element.getAttribute('aria-label') ?? '',
    accessibleName: '',
    visibleText: '',
    classes: Array.from(element.classList),
    attributes: {},
    isDisabled: false,
    isSensitive: false,
    sectionHint: '',
    landmark: '',
  };
}

function escapeXPath(value: string): string {
  if (!value.includes('"')) {
    return value;
  }
  return value.replace(/"/g, '&quot;');
}
