import { describe, expect, it } from 'vitest';
import { escapeHtml, sanitizeDisplayText, sanitizeLocatorForDisplay } from '../src/security/sanitize';
import { parseUserSettings } from '../src/security/messageValidator';

describe('security', () => {
  it('escapes html injection payloads', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).not.toContain('<img');
  });

  it('sanitizes malicious locator display values', () => {
    expect(sanitizeLocatorForDisplay('javascript:alert(1)')).toBe('[invalid locator]');
  });

  it('truncates long display text', () => {
    const long = 'a'.repeat(600);
    expect(sanitizeDisplayText(long).length).toBeLessThanOrEqual(501);
  });

  it('rejects invalid settings values', () => {
    const settings = parseUserSettings({ language: 'ruby', locatorPreference: 'invalid' });
    expect(settings.language).toBe('python');
    expect(settings.locatorPreference).toBe('css');
  });

  it('returns defaults when settings payload is missing or malformed', () => {
    expect(parseUserSettings(null).language).toBe('python');
    expect(parseUserSettings(undefined).expandDropdowns).toBe(true);
  });
});
