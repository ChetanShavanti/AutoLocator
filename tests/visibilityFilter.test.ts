import { describe, expect, it } from 'vitest';
import { isElementVisible } from '../src/content/visibility/visibilityFilter';

function mount(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body;
}

describe('visibilityFilter', () => {
  it('detects visible element', () => {
    mount('<button id="visible" style="width:80px;height:32px">Save</button>');
    const button = document.getElementById('visible') as HTMLElement;
    button.getBoundingClientRect = () =>
      ({
        width: 80,
        height: 32,
        top: 10,
        left: 10,
        bottom: 42,
        right: 90,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      }) as DOMRect;
    expect(isElementVisible(button)).toBe(true);
  });

  it('excludes hidden element with display none', () => {
    mount('<button id="hidden" style="display:none">Save</button>');
    expect(isElementVisible(document.getElementById('hidden')!)).toBe(false);
  });

  it('excludes hidden element with visibility hidden', () => {
    mount('<button id="hidden" style="visibility:hidden">Save</button>');
    expect(isElementVisible(document.getElementById('hidden')!)).toBe(false);
  });

  it('excludes zero-size element', () => {
    mount('<button id="zero" style="width:0;height:0;padding:0;border:0">Save</button>');
    expect(isElementVisible(document.getElementById('zero')!)).toBe(false);
  });

  it('excludes off-screen element', () => {
    mount('<button id="offscreen" style="position:absolute;left:-9999px">Save</button>');
    expect(isElementVisible(document.getElementById('offscreen')!)).toBe(false);
  });

  it('excludes aria-hidden element', () => {
    mount('<button id="aria" aria-hidden="true">Save</button>');
    expect(isElementVisible(document.getElementById('aria')!)).toBe(false);
  });
});
