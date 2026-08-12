import { describe, expect, it } from 'vitest';
import {
  classifyElement,
  isActionableElement,
} from '../src/content/classification/actionableClassifier';

function mount(html: string): void {
  document.body.innerHTML = html;
}

describe('actionableClassifier', () => {
  it('classifies button', () => {
    mount('<button>Save</button>');
    expect(classifyElement(document.querySelector('button')!)).toBe('button');
    expect(isActionableElement(document.querySelector('button')!)).toBe(true);
  });

  it('classifies input', () => {
    mount('<input type="text" />');
    expect(classifyElement(document.querySelector('input')!)).toBe('input');
  });

  it('classifies link', () => {
    mount('<a href="/home">Home</a>');
    expect(classifyElement(document.querySelector('a')!)).toBe('link');
  });

  it('classifies dropdown select', () => {
    mount('<select><option>A</option></select>');
    expect(classifyElement(document.querySelector('select')!)).toBe('select');
  });

  it('classifies checkbox', () => {
    mount('<input type="checkbox" />');
    expect(classifyElement(document.querySelector('input')!)).toBe('checkbox');
  });

  it('classifies radio', () => {
    mount('<input type="radio" />');
    expect(classifyElement(document.querySelector('input')!)).toBe('radio');
  });

  it('classifies tab role', () => {
    mount('<div role="tab">Tab</div>');
    expect(classifyElement(document.querySelector('[role="tab"]')!)).toBe('tab');
  });

  it('classifies menu item role', () => {
    mount('<div role="menuitem">Item</div>');
    expect(classifyElement(document.querySelector('[role="menuitem"]')!)).toBe('menuitem');
  });

  it('excludes decorative svg path', () => {
    mount('<svg><path d="M0 0"></path></svg>');
    expect(isActionableElement(document.querySelector('path')!)).toBe(false);
  });
});
