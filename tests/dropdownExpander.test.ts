import { describe, expect, it } from 'vitest';
import { analyzeDropdowns } from '../src/content/dropdown/dropdownAnalyzer';
import { expandHiddenDropdowns, isDropdownTrigger, isSafeDropdownTrigger } from '../src/content/dropdown/dropdownExpander';
import { createUniquenessContext } from '../src/content/domQuery';

describe('dropdownExpander', () => {
  it('detects OrangeHRM oxd-select trigger', () => {
    document.body.innerHTML = `
      <div class="oxd-input-group">
        <label>Job Title</label>
        <div class="oxd-select-wrapper">
          <div class="oxd-select-text">
            <div class="oxd-select-text-input" tabindex="0">-- Select --</div>
          </div>
        </div>
      </div>
    `;
    const trigger = document.querySelector('.oxd-select-text-input')!;
    expect(isDropdownTrigger(trigger)).toBe(true);
    expect(isSafeDropdownTrigger(trigger)).toBe(true);
  });

  it('ignores profile menu containers with multiple links', () => {
    document.body.innerHTML = `
      <li class="--active">
        <a>About</a>
        <a>Support</a>
        <a>Logout</a>
      </li>
    `;
    const menu = document.querySelector('li')!;
    expect(isDropdownTrigger(menu)).toBe(false);
    expect(isSafeDropdownTrigger(menu)).toBe(false);
  });

  it('detects custom dropdown triggers', () => {
    document.body.innerHTML = `<button class="oxd-select" aria-haspopup="listbox">Status</button>`;
    const trigger = document.querySelector('button')!;
    expect(isDropdownTrigger(trigger)).toBe(true);
    expect(isSafeDropdownTrigger(trigger)).toBe(true);
  });

  it('ignores native select triggers', () => {
    document.body.innerHTML = `<select><option>A</option></select>`;
    const select = document.querySelector('select')!;
    expect(isDropdownTrigger(select)).toBe(false);
  });

  it('expands aria-controlled listbox and restores closed state', async () => {
    document.body.innerHTML = `
      <button id="status" aria-haspopup="listbox" aria-expanded="false" aria-controls="status-list">Status</button>
      <ul id="status-list" role="listbox" hidden style="display:none">
        <li role="option">Active</li>
        <li role="option">Inactive</li>
      </ul>
    `;

    const trigger = document.getElementById('status') as HTMLButtonElement;
    const list = document.getElementById('status-list') as HTMLElement;
    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      list.hidden = expanded;
      list.style.display = expanded ? 'none' : 'block';
    });

    const warnings: string[] = [];
    const expanded = await expandHiddenDropdowns([trigger], warnings);

    expect(expanded).toHaveLength(1);
    expect(expanded[0].options).toHaveLength(2);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(list.hidden).toBe(true);
  });
});

describe('dropdownAnalyzer with probed options', () => {
  it('generates locators for probed hidden options', () => {
    document.body.innerHTML = `
      <button id="country" aria-haspopup="listbox">Country</button>
      <div role="listbox">
        <div role="option">India</div>
        <div role="option">Germany</div>
      </div>
    `;

    const trigger = document.querySelector('#country')!;
    const options = Array.from(document.querySelectorAll('[role="option"]'));
    const usedNames = new Set<string>();
    const locators = analyzeDropdowns(
      [trigger],
      createUniquenessContext(),
      'xpath',
      'python',
      'Form Locators',
      usedNames,
      [{ trigger: trigger as HTMLElement, options, wasOpened: true }],
    );

    expect(locators.length).toBeGreaterThan(0);
    expect(locators.some((loc) => loc.name.startsWith('DD_'))).toBe(true);
  });

  it('generates locators for native select options', () => {
    document.body.innerHTML = `
      <select id="country">
        <option>India</option>
        <option>Germany</option>
      </select>
    `;

    const select = document.querySelector('select')!;
    const usedNames = new Set<string>();
    const locators = analyzeDropdowns(
      [select],
      createUniquenessContext(),
      'xpath',
      'python',
      'Form Locators',
      usedNames,
    );

    expect(locators.length).toBeGreaterThan(0);
    expect(locators.some((loc) => loc.elementType === 'select' || loc.elementType === 'option')).toBe(
      true,
    );
  });
});
