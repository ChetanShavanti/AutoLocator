/**
 * File: extensionMeta.ts
 *
 * Purpose:
 * Public extension metadata for store links and developer attribution.
 *
 * Responsibilities:
 * - Centralize URLs and developer profile copy.
 *
 * Does not:
 * - Access storage or render UI directly.
 */

export const DEVELOPER = {
  name: 'Chetan Shavanti',
  title: 'QA & Test Automation Engineer',
  location: 'Pune, Maharashtra, India',
  summary: 'Builds practical browser tools for QA engineers, including AutoLocator.',
  linkedInUrl: 'https://www.linkedin.com/in/chetan-shavanti/',
  privacyPolicyUrl: 'https://chetanshavanti.github.io/AutoLocator/privacy.html',
  supportUrl: 'https://github.com/ChetanShavanti/AutoLocator/issues',
} as const;

/** Short store listing description (max ~132 chars for manifest; full text in dashboard). */
export const STORE_SHORT_DESCRIPTION =
  'Generate clean CSS/XPath locators and page-object code from visible UI — locally, for QA automation.';

/** Full store listing description for the Chrome Web Store dashboard. */
export const STORE_FULL_DESCRIPTION = `AutoLocator helps QA and automation engineers inspect the currently visible web page and generate reliable, readable locators — without sending page data to external servers.

Features:
• Analyze visible, actionable UI elements (buttons, inputs, links, dropdowns)
• Generate CSS and XPath locators with readable names (DD_, Button_, Input_, etc.)
• Optionally expand dropdowns to discover hidden options (OrangeHRM, ARIA, custom selects)
• Export Python, Java, or TypeScript code
• Pin the side panel while you work
• Local processing — no silent telemetry

Permissions are minimal: activeTab, scripting, storage, and sidePanel only.

Developed by Chetan Shavanti.
Privacy policy: ${DEVELOPER.privacyPolicyUrl}`;

/**
 * Returns the Chrome Web Store reviews URL for this installed extension.
 */
export function getChromeWebStoreReviewsUrl(): string {
  return `https://chromewebstore.google.com/detail/${chrome.runtime.id}/reviews`;
}

/**
 * Opens the Chrome Web Store reviews page in a new tab.
 */
export async function openChromeWebStoreReviews(): Promise<void> {
  await chrome.tabs.create({ url: getChromeWebStoreReviewsUrl() });
}
