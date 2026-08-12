/**
 * File: analysisPipeline.ts
 *
 * Purpose:
 * Orchestrate full page analysis in the content script context.
 *
 * Responsibilities:
 * - Run discovery, filtering, classification, locator generation, and grouping.
 *
 * Does not:
 * - Render UI or persist settings.
 */

import { isActionableElement } from './classification/actionableClassifier';
import {
  dedupeRepresentativeElements,
  extractTextSignatureFromLocator,
  locatorQualityScore,
} from './discovery/elementDeduper';
import { findMissedElements } from './discovery/coverageScanner';
import { analyzeDropdowns } from './dropdown/dropdownAnalyzer';
import { expandHiddenDropdowns } from './dropdown/dropdownExpander';
import { buildElementDescriptor, discoverElements } from './discovery/elementDiscovery';
import { createUniquenessContext } from './domQuery';
import { inferStateFromAttributes, probeSafeState } from './state/stateAnalyzer';
import { isElementDiscoverable } from './visibility/visibilityFilter';
import { generateCandidates } from '../locator/candidateGenerator';
import { isGenericName, shouldSkipOutputEntry } from '../locator/locatorOutputQuality';
import { scoreCandidates } from '../locator/locatorScorer';
import { selectBestLocator } from '../locator/locatorSelector';
import { detectPatterns } from '../grouping/patternDetector';
import { deriveSectionHint, groupIntoSections } from '../grouping/sectionGrouper';
import { generateElementName } from '../naming/elementNamer';
import { generateCode } from '../generators/codeGenerator';
import { noopOcrProvider } from '../ocr/noopOcrProvider';
import type { AnalysisResult, NamedLocator, UserSettings } from '../shared/types';

/**
 * Runs the complete analysis pipeline on the current page.
 */
export async function runAnalysis(settings: UserSettings): Promise<AnalysisResult> {
  const context = createUniquenessContext();
  const discovered = discoverElements();
  const seenElements = new Set<Element>(discovered);
  const missed = findMissedElements(seenElements);
  const allDiscovered = [...discovered, ...missed];

  const visibleActionable: Element[] = [];
  const elementIndexMap = new Map<Element, number>();

  allDiscovered.forEach((element, index) => {
    elementIndexMap.set(element, index);
    if (isElementDiscoverable(element, 'document') && isActionableElement(element)) {
      visibleActionable.push(element);
    }
  });

  const dedupedActionable = dedupeRepresentativeElements(visibleActionable);

  const pageTitle = document.title || 'Page';
  const urlPath = `${window.location.pathname}${window.location.search}`;
  const usedNames = new Set<string>();
  const locatorValueIndex = new Map<string, NamedLocator>();
  const processedElements = new WeakSet<Element>();
  const warnings: string[] = [];

  if (missed.length > 0) {
    warnings.push(`Added ${missed.length} element(s) from semantic DOM scan.`);
  }

  for (const element of dedupedActionable) {
    if (processedElements.has(element)) {
      continue;
    }
    processedElements.add(element);

    const index = elementIndexMap.get(element) ?? 0;
    const descriptor = buildElementDescriptor(element, index);

    if (descriptor.isSensitive) {
      descriptor.accessibleName = descriptor.accessibleName.replace(/./g, '*');
      descriptor.visibleText = '[redacted]';
    }

    const section = deriveSectionHint(descriptor.landmark, descriptor.accessibleName, urlPath);
    descriptor.sectionHint = section;

    const candidates = generateCandidates(descriptor, settings.locatorPreference);
    const scored = scoreCandidates(candidates, context, settings.locatorPreference);
    const selected = selectBestLocator(scored, settings.locatorPreference);

    if (!selected) {
      continue;
    }

    const name = generateElementName(descriptor, usedNames, settings.language);
    if (shouldSkipOutputEntry(name, selected.locator)) {
      continue;
    }

    const entry: NamedLocator = {
      name,
      locator: selected.locator,
      locatorType: selected.locatorType,
      alternative: selected.alternative,
      elementType: descriptor.elementKind,
      section,
      isRisky: selected.isRisky,
    };

    mergeLocator(locatorValueIndex, entry);

    if (element instanceof HTMLElement) {
      const statePair =
        inferStateFromAttributes(
          element,
          name,
          selected.locator,
          selected.locatorType,
          section,
        ) ?? (await probeSafeState(
          element,
          name,
          selected.locator,
          selected.locatorType,
          section,
        ));

      if (statePair?.closed) {
        mergeLocator(locatorValueIndex, statePair.closed);
      }
      if (statePair?.opened) {
        mergeLocator(locatorValueIndex, statePair.opened);
      }
    }
  }

  const dropdownElements = [...dedupedActionable];
  let probedDropdowns: Awaited<ReturnType<typeof expandHiddenDropdowns>> = [];

  if (settings.expandDropdowns) {
    probedDropdowns = await expandHiddenDropdowns(dedupedActionable, warnings);
    for (const probed of probedDropdowns) {
      if (!dropdownElements.includes(probed.trigger)) {
        dropdownElements.push(probed.trigger);
      }
    }
    if (probedDropdowns.length > 0) {
      const optionCount = probedDropdowns.reduce((sum, entry) => sum + entry.options.length, 0);
      warnings.push(
        `Expanded ${probedDropdowns.length} dropdown(s) and found ${optionCount} hidden option(s).`,
      );
    }
  }

  const dropdownLocators = analyzeDropdowns(
    dropdownElements,
    context,
    settings.locatorPreference,
    settings.language,
    deriveSectionHint('', pageTitle, urlPath),
    usedNames,
    probedDropdowns,
  );

  for (const locator of dropdownLocators) {
    mergeLocator(locatorValueIndex, locator);
  }

  const allLocators = dedupeLocators(Array.from(locatorValueIndex.values()));
  let ocrUsed = false;

  if (settings.ocrEnabled && noopOcrProvider.isAvailable()) {
    ocrUsed = true;
    warnings.push('OCR scan requested; local OCR provider not yet available in this build.');
  }

  const patterns = detectPatterns(allLocators);
  const sections = groupIntoSections(allLocators, pageTitle);
  const generatedCode = generateCode(sections, patterns, settings.language);

  return {
    pageTitle,
    urlPath,
    sections,
    patterns,
    elements: allLocators,
    generatedCode,
    ocrUsed,
    warnings,
  };
}

function mergeLocator(index: Map<string, NamedLocator>, locator: NamedLocator): void {
  const existing = index.get(locator.locator);
  if (!existing) {
    index.set(locator.locator, locator);
    return;
  }

  if (isGenericName(existing.name) && !isGenericName(locator.name)) {
    index.set(locator.locator, locator);
  }
}

function dedupeLocators(locators: NamedLocator[]): NamedLocator[] {
  const seenNames = new Set<string>();
  const seenLocators = new Set<string>();
  const textSignatureBest = new Map<string, NamedLocator>();
  const result: NamedLocator[] = [];

  for (const locator of locators) {
    if (seenLocators.has(locator.locator)) {
      continue;
    }

    const textSignature = extractTextSignatureFromLocator(locator.locator);
    if (textSignature) {
      const existing = textSignatureBest.get(textSignature);
      if (existing) {
        const keepCurrent =
          locatorQualityScore(locator.locator) > locatorQualityScore(existing.locator);
        if (keepCurrent) {
          seenNames.delete(existing.name);
          seenLocators.delete(existing.locator);
          textSignatureBest.set(textSignature, locator);
          const idx = result.indexOf(existing);
          if (idx >= 0) {
            result.splice(idx, 1);
          }
        } else {
          continue;
        }
      } else {
        textSignatureBest.set(textSignature, locator);
      }
    }

    if (seenNames.has(locator.name)) {
      continue;
    }
    seenLocators.add(locator.locator);
    seenNames.add(locator.name);
    result.push(locator);
  }

  return result;
}
