/**
 * File: codeGenerator.ts
 *
 * Purpose:
 * Language-independent orchestration for code generation.
 *
 * Responsibilities:
 * - Route locator models to language-specific formatters.
 *
 * Does not:
 * - Analyze DOM or score locators.
 */

import { generateJavaCode } from './javaGenerator';
import { generatePythonCode } from './pythonGenerator';
import { generateTypeScriptCode } from './typescriptGenerator';
import type { LocatorSection, OutputLanguage, PatternTemplate } from '../shared/types';

/**
 * Generates formatted code for the selected output language.
 */
export function generateCode(
  sections: LocatorSection[],
  patterns: PatternTemplate[],
  language: OutputLanguage,
): string {
  switch (language) {
    case 'java':
      return generateJavaCode(sections, patterns);
    case 'python':
      return generatePythonCode(sections, patterns);
    case 'typescript':
      return generateTypeScriptCode(sections, patterns);
    default:
      return generatePythonCode(sections, patterns);
  }
}
