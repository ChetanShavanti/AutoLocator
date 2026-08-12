import { describe, expect, it } from 'vitest';
import {
  deriveBaseName,
  generateDropdownControlName,
  generateDropdownOptionName,
  generateElementName,
} from '../src/naming/elementNamer';
import { isConcatenatedMenuText } from '../src/naming/labelExtractor';
import { applyTypePrefix } from '../src/naming/namePrefix';

describe('elementNamer', () => {
  it('creates readable names from aria label', () => {
    const name = deriveBaseName({
      nodeIndex: 0,
      tagName: 'button',
      elementKind: 'button',
      role: '',
      inputType: '',
      id: '',
      name: '',
      placeholder: '',
      ariaLabel: 'Forgot your password?',
      accessibleName: 'Forgot your password?',
      visibleText: '',
      classes: [],
      attributes: {},
      isDisabled: false,
      isSensitive: false,
      sectionHint: '',
      landmark: '',
    });
    expect(name).toContain('Forgot');
  });

  it('applies type prefixes', () => {
    const used = new Set<string>();
    const buttonName = generateElementName(
      {
        nodeIndex: 0,
        tagName: 'button',
        elementKind: 'button',
        role: '',
        inputType: '',
        id: '',
        name: '',
        placeholder: '',
        ariaLabel: 'Login',
        accessibleName: 'Login',
        visibleText: '',
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
    expect(buttonName.startsWith('Button_')).toBe(true);
    expect(applyTypePrefix('input', 'Username')).toBe('Input_Username');
    expect(applyTypePrefix('radio', 'Male')).toBe('Radio_Male');
    expect(applyTypePrefix('checkbox', 'Remember')).toBe('CheckB_Remember');
  });

  it('sanitizes invalid characters for python', () => {
    const used = new Set<string>();
    const name = generateElementName(
      {
        nodeIndex: 0,
        tagName: 'button',
        elementKind: 'button',
        role: '',
        inputType: '',
        id: '',
        name: '',
        placeholder: '',
        ariaLabel: 'Save / Continue',
        accessibleName: 'Save / Continue',
        visibleText: '',
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
    expect(name).not.toMatch(/[ /]/);
  });

  it('derives readable name from stable id', () => {
    const name = deriveBaseName({
      nodeIndex: 0,
      tagName: 'div',
      elementKind: 'navigation',
      role: 'navigation',
      inputType: '',
      id: 'rgtnav',
      name: '',
      placeholder: '',
      ariaLabel: '',
      accessibleName: '',
      visibleText: '',
      classes: [],
      attributes: {},
      isDisabled: false,
      isSensitive: false,
      sectionHint: '',
      landmark: 'navigation',
    });
    expect(name).toBe('RegionNavigation');
  });

  it('ignores user-entered values for naming', () => {
    const name = deriveBaseName({
      nodeIndex: 0,
      tagName: 'input',
      elementKind: 'input',
      role: '',
      inputType: 'text',
      id: 'employeeName',
      name: 'employeeName',
      placeholder: 'Employee Name',
      ariaLabel: '',
      accessibleName: 'CT624_-_Chetan_-_Shavanti',
      visibleText: '',
      classes: [],
      attributes: {},
      isDisabled: false,
      isSensitive: false,
      sectionHint: '',
      landmark: '',
    });
    expect(name).toContain('Employee');
    expect(name).not.toContain('Chetan');
  });

  it('rejects concatenated profile menu text', () => {
    expect(isConcatenatedMenuText('mandaa Smith About Support Change Password Logout')).toBe(true);
    const name = deriveBaseName({
      nodeIndex: 0,
      tagName: 'li',
      elementKind: 'link',
      role: '',
      inputType: '',
      id: '',
      name: '',
      placeholder: '',
      ariaLabel: '',
      accessibleName: 'mandaa Smith About Support Change Password Logout',
      visibleText: 'mandaa Smith About Support Change Password Logout',
      classes: [],
      attributes: {},
      isDisabled: false,
      isSensitive: false,
      sectionHint: '',
      landmark: '',
    });
    expect(name).not.toContain('Logout');
  });

  it('builds dropdown names with DD prefix', () => {
    const used = new Set<string>();
    const control = generateDropdownControlName('Job Title', used, 'python');
    expect(control.startsWith('DD_')).toBe(true);
    expect(control).toContain('Job_Title');

    const option = generateDropdownOptionName(control, 'Engineer', used, 'python');
    expect(option.startsWith('DD_')).toBe(true);
    expect(option).toContain('Engineer');
  });

  it('resolves duplicate names', () => {
    const used = new Set<string>(['Button_Save']);
    const name = generateElementName(
      {
        nodeIndex: 0,
        tagName: 'button',
        elementKind: 'button',
        role: '',
        inputType: '',
        id: '',
        name: '',
        placeholder: '',
        ariaLabel: 'Save',
        accessibleName: 'Save',
        visibleText: '',
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
    expect(name).not.toBe('Button_Save');
  });
});
