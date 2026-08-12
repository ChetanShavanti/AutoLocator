/**
 * File: namePrefix.ts
 *
 * Purpose:
 * Apply consistent type prefixes to generated element names.
 *
 * Responsibilities:
 * - Map element kinds to DD_, Button_, Input_, etc.
 *
 * Does not:
 * - Derive base names or resolve collisions.
 */

import type { ElementKind } from '../shared/types';

const PREFIX_BY_KIND: Partial<Record<ElementKind, string>> = {
  select: 'DD_',
  option: 'DD_',
  button: 'Button_',
  input: 'Input_',
  textarea: 'Input_',
  checkbox: 'CheckB_',
  radio: 'Radio_',
  link: 'Link_',
  toggle: 'CheckB_',
  search: 'Input_',
  tab: 'Button_',
  menuitem: 'Link_',
};

/**
 * Applies the standard type prefix for an element kind when missing.
 */
export function applyTypePrefix(kind: ElementKind, name: string): string {
  const prefix = PREFIX_BY_KIND[kind];
  if (!prefix || name.startsWith(prefix)) {
    return name;
  }
  return `${prefix}${name}`;
}

/**
 * Builds a dropdown control name such as DD_Job_Title.
 */
export function buildDropdownControlName(baseName: string): string {
  if (baseName.startsWith('DD_')) {
    return baseName;
  }
  return `DD_${baseName}`;
}

/**
 * Builds a dropdown option name such as DD_Job_Title_Engineer.
 */
export function buildDropdownOptionName(controlName: string, optionName: string): string {
  const normalizedControl = controlName.startsWith('DD_') ? controlName : `DD_${controlName}`;
  return `${normalizedControl}_${optionName}`;
}
