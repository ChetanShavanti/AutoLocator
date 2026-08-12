import { describe, expect, it } from 'vitest';
import { generateJavaCode } from '../src/generators/javaGenerator';
import { generatePythonCode } from '../src/generators/pythonGenerator';
import { generateTypeScriptCode } from '../src/generators/typescriptGenerator';
import type { LocatorSection } from '../src/shared/types';

const sections: LocatorSection[] = [
  {
    title: 'Login Page Locators',
    locators: [
      {
        name: 'Username',
        locator: 'input[placeholder="username"]',
        locatorType: 'css',
        elementType: 'input',
        section: 'Login Page Locators',
        isRisky: false,
      },
      {
        name: 'Save',
        locator: '#save123',
        locatorType: 'css',
        alternative: '//button[@id="save123"]',
        elementType: 'button',
        section: 'Login Page Locators',
        isRisky: true,
      },
    ],
  },
];

describe('code generators', () => {
  it('generates valid python', () => {
    const code = generatePythonCode(sections, []);
    expect(code).toContain('Username = "input[placeholder=\\"username\\"]"');
    expect(code).toContain('# Alternatives:');
  });

  it('generates valid java', () => {
    const code = generateJavaCode(sections, []);
    expect(code).toContain('public final class Locators');
    expect(code).toContain('public static final String Username');
  });

  it('generates valid typescript', () => {
    const code = generateTypeScriptCode(sections, []);
    expect(code).toContain('export const Username');
  });
});
