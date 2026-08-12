import { describe, expect, it } from 'vitest';
import { isElementDiscoverable } from '../src/content/visibility/visibilityFilter';

function mount(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body;
}

describe('document visibility mode', () => {
  it('includes off-screen but in-document elements', () => {
    mount(`
      <div style="height:3000px"></div>
      <button id="below" style="width:80px;height:32px">Forgot password</button>
    `);
    const button = document.getElementById('below') as HTMLElement;
    button.getBoundingClientRect = () =>
      ({
        width: 80,
        height: 32,
        top: 2500,
        left: 10,
        bottom: 2532,
        right: 90,
        x: 10,
        y: 2500,
        toJSON: () => ({}),
      }) as DOMRect;

    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, configurable: true });
    Object.defineProperty(document.body, 'scrollHeight', { value: 3000, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollWidth', { value: 1200, configurable: true });
    Object.defineProperty(document.body, 'scrollWidth', { value: 1200, configurable: true });
    expect(isElementDiscoverable(button, 'document')).toBe(true);
    expect(isElementDiscoverable(button, 'viewport')).toBe(false);
  });
});
