/**
 * File: types.ts
 *
 * Purpose:
 * Shared domain types used across extension contexts.
 *
 * Responsibilities:
 * - Define serializable analysis and locator models.
 *
 * Does not:
 * - Contain runtime logic or DOM access.
 */

export type OutputLanguage = 'java' | 'python' | 'typescript';
export type LocatorPreference = 'css' | 'xpath';
export type LocatorType = 'css' | 'xpath';

export type ElementKind =
  | 'button'
  | 'input'
  | 'textarea'
  | 'link'
  | 'select'
  | 'option'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'tab'
  | 'menu'
  | 'menuitem'
  | 'dialog'
  | 'heading'
  | 'text'
  | 'table-control'
  | 'navigation'
  | 'search'
  | 'unknown';

export interface UserSettings {
  language: OutputLanguage;
  locatorPreference: LocatorPreference;
  ocrEnabled: boolean;
  /** When true, safely opens dropdowns to discover options not visible in the closed DOM. */
  expandDropdowns: boolean;
}

export interface ElementDescriptor {
  nodeIndex: number;
  tagName: string;
  elementKind: ElementKind;
  role: string;
  inputType: string;
  id: string;
  name: string;
  placeholder: string;
  ariaLabel: string;
  accessibleName: string;
  visibleText: string;
  classes: string[];
  attributes: Record<string, string>;
  isDisabled: boolean;
  isSensitive: boolean;
  sectionHint: string;
  landmark: string;
}

export interface LocatorCandidate {
  strategy: string;
  value: string;
  type: LocatorType;
}

export interface ScoredLocator {
  candidate: LocatorCandidate;
  score: number;
  uniqueness: number;
  stability: number;
  readability: number;
  brittleness: number;
  isSuspicious: boolean;
  showAlternative: boolean;
}

export interface NamedLocator {
  name: string;
  locator: string;
  locatorType: LocatorType;
  alternative?: string;
  elementType: string;
  section: string;
  isRisky: boolean;
  stateLabel?: string;
}

export interface PatternTemplate {
  name: string;
  template: string;
  elementNames: string[];
  confidence: number;
}

export interface LocatorSection {
  title: string;
  locators: NamedLocator[];
}

export interface AnalysisResult {
  pageTitle: string;
  urlPath: string;
  sections: LocatorSection[];
  patterns: PatternTemplate[];
  elements: NamedLocator[];
  generatedCode: string;
  ocrUsed: boolean;
  warnings: string[];
}

export interface AnalysisError {
  code: string;
  message: string;
}

export interface UniquenessContext {
  /** Returns match count for a CSS selector in the document. */
  countCss: (selector: string) => number;
  /** Returns match count for an XPath in the document. */
  countXPath: (xpath: string) => number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  language: 'python',
  locatorPreference: 'css',
  ocrEnabled: false,
  expandDropdowns: true,
};
