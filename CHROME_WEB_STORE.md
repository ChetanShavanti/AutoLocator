# Chrome Web Store Submission Checklist

Use this checklist before publishing **AutoLocator** to the [Chrome Web Store](https://chrome.google.com/webstore/devconsole).

## Pre-submission verification (automated)

Run locally:

```bash
npm install
npm run health      # full daily health suite
npm test            # unit tests only
npm run icons       # required PNGs in src/icons
npm run build       # produces dist/
npm run package:store   # creates release/autolocator-store.zip
```

Load `dist/` unpacked in Chrome and manually verify:

- [ ] Popup opens and **Analyze Page** works on a normal website
- [ ] Side panel pin (📌) keeps UI open while clicking the page
- [ ] Settings page opens from footer link
- [ ] **Developed by** section shows Chetan Shavanti + LinkedIn/GitHub
- [ ] Rating prompt appears after **3 successful analyses** (if not dismissed)
- [ ] **Rate on Chrome Web Store** opens store reviews tab
- [ ] Icons appear correctly in toolbar and extension management page
- [ ] No errors in service worker or popup DevTools console

## Extension package

| Item | Status |
|------|--------|
| Manifest V3 | ✅ |
| Bundled static JS (no remote code) | ✅ |
| Icons 16 / 32 / 48 / 128 PNG | ✅ `src/icons/` |
| Privacy policy URL (public) | ✅ [PRIVACY.md](PRIVACY.md) on GitHub |
| Minimal permissions | ✅ `activeTab`, `scripting`, `storage`, `sidePanel` |

**Upload:** contents of `dist/` (zipped via `npm run package:store`).

## Developer Dashboard fields

Copy from `src/shared/extensionMeta.ts` and `STORE_FULL_DESCRIPTION`:

| Field | Value |
|-------|--------|
| **Name** | AutoLocator |
| **Summary** | Generate clean CSS/XPath locators and page-object code from visible UI — locally, for QA automation. |
| **Description** | See `STORE_FULL_DESCRIPTION` in `extensionMeta.ts` |
| **Category** | Developer Tools |
| **Language** | English |
| **Privacy policy URL** | https://github.com/ChetanShavanti/AutoLocator/blob/main/PRIVACY.md |
| **Homepage URL** | https://github.com/ChetanShavanti/AutoLocator |
| **Support URL** | https://github.com/ChetanShavanti/AutoLocator/issues |
| **Single purpose** | Generate automation locators from visible page UI for QA engineers |

## Permission justifications (paste in dashboard)

| Permission | Justification |
|------------|---------------|
| **activeTab** | Access the current tab only when the user clicks Analyze — no broad host access. |
| **scripting** | Inject the local analyzer script on user-triggered analysis. |
| **storage** | Save language/locator preferences and per-tab session results locally. |
| **sidePanel** | Optional pinned panel that stays open while the user works on the page. |

## Data use disclosure

Answer **No** to collecting personal/sensitive data for sale. AutoLocator:

- Does **not** transmit page HTML to developer servers
- Stores preferences and session results **locally** only
- Opens external URLs only when the user clicks (Store rating, LinkedIn, GitHub, Privacy Policy)

## Assets you must prepare manually

The dashboard requires screenshots and promotional images:

| Asset | Size | Suggestion |
|-------|------|------------|
| Screenshot(s) | 1280×800 or 640×400 | Popup with locators, side panel, settings |
| Small promo tile | 440×280 | Optional |
| Marquee promo | 1400×560 | Optional |
| Store icon | 128×128 | Use `src/icons/icon_128x128.png` |

Use PNGs from `src/icons/` (e.g. `primary_extension_icon.png`, `analyze_page.png`) for marketing if needed.

## Post-publish

1. Update `extensionMeta.ts` if the public store URL differs from unpacked `chrome.runtime.id`.
2. Test **Rate on Chrome Web Store** from the installed published extension.
3. Tag release in GitHub: `v0.1.0`.

## Common rejection reasons to avoid

- ❌ Requesting `<all_urls>` or `tabs` without justification — **not used**
- ❌ Remote hosted code — **not used**
- ❌ Missing or unreachable privacy policy — host PRIVACY.md on GitHub before submit
- ❌ Vague single-purpose description — use QA locator generation wording above
- ❌ Misleading permissions — document all four in listing and options page

## Contact

**Chetan Shavanti** — [linkedin.com/in/chetan-shavanti](https://www.linkedin.com/in/chetan-shavanti/)
