/**
 * File: health.test.ts
 *
 * Smoke tests for daily project health — manifest, icons, metadata, and core imports.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runAnalysis } from '../src/content/analysisPipeline';
import { DEVELOPER, STORE_SHORT_DESCRIPTION } from '../src/shared/extensionMeta';
import { DEFAULT_SETTINGS } from '../src/shared/types';
import { generateElementName } from '../src/naming/elementNamer';

const root = process.cwd();

describe('project health', () => {
  it('includes required extension icons', () => {
    const iconsDir = join(root, 'src', 'icons');
    const required = ['icon_16x16.png', 'icon_32x32.png', 'icon_48x48.png', 'icon_128x128.png'];
    for (const icon of required) {
      expect(existsSync(join(iconsDir, icon)), `missing src/icons/${icon}`).toBe(true);
    }
  });

  it('has a valid Manifest V3 definition', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('AutoLocator');
    expect(manifest.permissions).toEqual(
      expect.arrayContaining(['activeTab', 'scripting', 'storage', 'sidePanel']),
    );
    expect(manifest.background).toBeTruthy();
    expect(manifest.icons).toBeTruthy();
  });

  it('includes privacy policy and developer metadata', () => {
    expect(existsSync(join(root, 'PRIVACY.md'))).toBe(true);
    expect(DEVELOPER.name).toBe('Chetan Shavanti');
    expect(DEVELOPER.linkedInUrl).toContain('linkedin.com/in/chetan-shavanti');
    expect(DEVELOPER.privacyPolicyUrl).toContain('PRIVACY.md');
    expect(STORE_SHORT_DESCRIPTION.length).toBeGreaterThan(20);
  });

  it('has stable default settings', () => {
    expect(DEFAULT_SETTINGS.language).toBeTruthy();
    expect(DEFAULT_SETTINGS.locatorPreference).toBeTruthy();
    expect(DEFAULT_SETTINGS.expandDropdowns).toBe(true);
  });

  it('imports core analysis and naming modules', async () => {
    document.body.innerHTML = `
      <button id="save" data-testid="save-btn">Save</button>
      <input id="username" data-testid="username-input" placeholder="Username" />
    `;

    const result = await runAnalysis(DEFAULT_SETTINGS);
    expect(Array.isArray(result.elements)).toBe(true);
    expect(Array.isArray(result.sections)).toBe(true);
    expect(typeof result.generatedCode).toBe('string');
    expect(result.pageTitle).toBeTruthy();

    const used = new Set<string>();
    const name = generateElementName(
      {
        nodeIndex: 0,
        tagName: 'button',
        elementKind: 'button',
        role: '',
        inputType: '',
        id: 'save',
        name: '',
        placeholder: '',
        ariaLabel: '',
        accessibleName: 'Save',
        visibleText: 'Save',
        classes: [],
        attributes: {},
        isDisabled: false,
        isSensitive: false,
        sectionHint: '',
        landmark: '',
      },
      used,
      'python',
    );
    expect(name.startsWith('Button_')).toBe(true);
  });
});
