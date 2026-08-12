# AutoLocator Privacy Policy

**Last updated:** August 12, 2026  
**Contact:** [Chetan Shavanti on LinkedIn](https://www.linkedin.com/in/chetan-shavanti/)

## Summary

AutoLocator analyzes web pages **locally in your browser** to generate automation locators. By default, it does **not** send page content, screenshots, or browsing history to external servers.

## Data AutoLocator accesses

When you click **Analyze Page**, AutoLocator may read the DOM of the **currently active tab** to identify visible, actionable UI elements and generate locators.

AutoLocator does **not**:

- Read pages unless you trigger analysis
- Access tabs in the background without your action
- Collect passwords, cookies, auth tokens, or hidden field values by design (password fields are redacted in output)

## Data AutoLocator stores locally

AutoLocator uses `chrome.storage` on your device to store:

| Data | Purpose |
|------|---------|
| Language and locator preferences | Remember your settings |
| Per-tab analysis results (session) | Restore results when reopening the popup or side panel |
| Rating prompt state | Avoid repeated rating prompts after you dismiss or rate |

Session results are cleared when the tab is closed.

## Optional page interaction

If **Expand dropdowns** is enabled, AutoLocator may temporarily open dropdown controls on the page to discover hidden options, then restore the prior state. This happens only when you run analysis.

## Network activity

AutoLocator does **not** transmit analyzed page data to developer servers.

Network use occurs only when **you choose** to open external links, such as:

- Chrome Web Store rating page
- Settings links (Privacy Policy, LinkedIn, GitHub)

## Permissions explained

| Permission | Why it is needed |
|------------|------------------|
| `activeTab` | Access the current tab only when you invoke the extension |
| `scripting` | Inject the local analyzer script on your Analyze action |
| `storage` | Save preferences and session results locally |
| `sidePanel` | Show the pinned side panel UI |

## Children's privacy

AutoLocator is a developer/QA tool and is not directed at children under 13.

## Changes to this policy

This policy may be updated when functionality or data handling changes. Updates will be published in the GitHub repository.

## Contact

Questions about privacy: [linkedin.com/in/chetan-shavanti](https://www.linkedin.com/in/chetan-shavanti/)
