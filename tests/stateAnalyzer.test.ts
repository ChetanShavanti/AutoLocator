import { describe, expect, it } from 'vitest';
import { inferStateFromAttributes } from '../src/content/state/stateAnalyzer';

describe('stateAnalyzer', () => {
  it('extracts before/after aria-expanded locators without interaction', () => {
    document.body.innerHTML = '<button id="panel" aria-expanded="false">Panel</button>';
    const element = document.getElementById('panel')!;
    const pair = inferStateFromAttributes(element, 'SidePanel', '#panel', 'css', 'Panel');
    expect(pair?.closed?.name).toBe('SidePanelClosed');
    expect(pair?.opened?.name).toBe('SidePanelOpened');
    expect(pair?.closed?.locator).toContain("aria-expanded=\"false\"");
    expect(pair?.opened?.locator).toContain("aria-expanded=\"true\"");
  });
});
