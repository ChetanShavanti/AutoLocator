/**
 * File: pageAnalyzer.ts
 *
 * Purpose:
 * Content script entry point injected on user-triggered analysis.
 *
 * Responsibilities:
 * - Execute analysis pipeline and return structured results.
 *
 * Does not:
 * - Access extension storage or render popup UI.
 */

import { runAnalysis } from './analysisPipeline';
import type { UserSettings } from '../shared/types';

/**
 * Main analysis entry invoked by the extension popup via executeScript.
 */
export async function analyzePage(settings: UserSettings) {
  return runAnalysis(settings);
}

window.__autoLocatorAnalyze = analyzePage;

export default analyzePage;
