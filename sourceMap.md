# sourceMap.md — AutoLocator Repository Map

Human-readable map of the AutoLocator repository as a system.

**Related documents:** `AGENTS.md`, `codingRules.md`

---

## Repository Status

| Attribute | Current state |
|-----------|---------------|
| **Initialization** | MVP implemented |
| **Language** | TypeScript (strict) |
| **Build system** | Vite 6 |
| **Package manager** | npm |
| **Test framework** | Vitest + happy-dom |
| **Extension** | Manifest V3 Chrome Extension |
| **Output directory** | `dist/` (load unpacked in Chrome) |

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | Type checking |
| `vite` | Extension bundling (popup, options, service worker, content analyzer) |
| `vitest` | Unit tests |
| `happy-dom` | DOM simulation in tests |
| `@types/chrome` | Chrome extension API types |
| `@types/node` | Node types for build scripts |

No runtime npm dependencies in the extension bundle.

---

## Project Tree

```text
AutoLocator/
├── AGENTS.md
├── codingRules.md
├── sourceMap.md
├── manifest.json                 # Source manifest (dev reference)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── public/icons/                 # Extension icons
├── scripts/
│   ├── copy-manifest.mjs         # Writes production manifest to dist/
│   └── generate-icons.mjs
├── src/
│   ├── background/
│   │   └── serviceWorker.ts
│   ├── content/
│   │   ├── analysisPipeline.ts
│   │   ├── domQuery.ts
│   │   ├── pageAnalyzer.ts
│   │   ├── classification/
│   │   │   └── actionableClassifier.ts
│   │   ├── discovery/
│   │   │   └── elementDiscovery.ts
│   │   ├── dropdown/
│   │   │   ├── dropdownAnalyzer.ts
│   │   │   └── dropdownExpander.ts
│   │   ├── state/
│   │   │   └── stateAnalyzer.ts
│   │   └── visibility/
│   │       └── visibilityFilter.ts
│   ├── generators/
│   │   ├── codeGenerator.ts
│   │   ├── javaGenerator.ts
│   │   ├── pythonGenerator.ts
│   │   └── typescriptGenerator.ts
│   ├── grouping/
│   │   ├── patternDetector.ts
│   │   └── sectionGrouper.ts
│   ├── locator/
│   │   ├── candidateGenerator.ts
│   │   ├── locatorScorer.ts
│   │   ├── locatorSelector.ts
│   │   ├── stabilityAnalyzer.ts
│   │   ├── suspiciousDetector.ts
│   │   └── uniquenessChecker.ts
│   ├── naming/
│   │   └── elementNamer.ts
│   ├── ocr/
│   │   ├── noopOcrProvider.ts
│   │   └── ocrProvider.ts
│   ├── options/
│   │   ├── options.css
│   │   ├── options.html
│   │   └── options.ts
│   ├── popup/
│   │   ├── popup.css
│   │   ├── popup.html
│   │   └── popup.ts
│   ├── sidepanel/
│   │   ├── sidepanel.html
│   │   └── sidepanel.ts
│   ├── ui/
│   │   └── panelApp.ts
│   ├── security/
│   │   ├── messageValidator.ts
│   │   ├── safeLogger.ts
│   │   └── sanitize.ts
│   ├── shared/
│   │   ├── constants.ts
│   │   ├── messages.ts
│   │   └── types.ts
│   ├── storage/
│   │   └── settingsStorage.ts
│   └── vite-env.d.ts
└── tests/
    ├── setup.ts
    ├── actionableClassifier.test.ts
    ├── dropdownAnalyzer.test.ts
    ├── generators.test.ts
    ├── locatorEngine.test.ts
    ├── locatorScorer.test.ts
    ├── naming.test.ts
    ├── patternDetector.test.ts
    ├── security.test.ts
    ├── stateAnalyzer.test.ts
    └── visibilityFilter.test.ts
```

---

## Permissions (manifest)

| Permission | Rationale |
|------------|-----------|
| `activeTab` | Grants temporary access to the current tab when the user opens the popup and clicks Analyze. Avoids `<all_urls>` host permission. |
| `scripting` | Injects `content/pageAnalyzer.js` on user-triggered analysis only. |
| `storage` | Persists language and locator preference locally via `chrome.storage.local`. |
| `sidePanel` | Keeps AutoLocator open in the Chrome side panel when the user clicks Pin. |

No `host_permissions`, `tabs`, `cookies`, `history`, or network permissions.

---

## Message Catalog

| Message | Direction | Payload |
|---------|-----------|---------|
| `GET_SETTINGS` | UI → background | none |
| `SAVE_SETTINGS` | UI → background | `UserSettings` |
| Analysis | popup → page (executeScript) | `UserSettings` in function args |

Analysis results return directly from `executeScript` — not routed through the service worker.

---

## Module Relationships

```text
Popup UI
    ↓ chrome.scripting.executeScript (user gesture + activeTab)
Content Script (pageAnalyzer.js)
    ↓
analysisPipeline
    ↓
discovery → visibility → classification
    ↓
locator engine (generate → score → select)
    ↓
naming → grouping → pattern detection
    ↓
state + dropdown analyzers
    ↓
codeGenerator (Python / Java / TypeScript)
    ↓
AnalysisResult → Popup UI (sanitized render + Copy All)
```

---

## Data Flow

```text
Page DOM (untrusted)
  ↓
Visible actionable elements
  ↓
ElementDescriptor metadata
  ↓
Candidate locators
  ↓
Scored + selected locator
  ↓
NamedLocator (+ optional state/dropdown locators)
  ↓
Grouped sections + patterns
  ↓
Generated code string
  ↓
Sanitized popup display
```

---

## Security Boundaries

```text
Untrusted Web Page
        ⇅ DOM read / limited safe interaction
Content Script (isolated world)
        ⇅ executeScript return value (structured JSON)
Popup UI (trusted extension origin)
        ⇅ validated messages
Service Worker (settings only)
```

---

## OCR

| Module | Role |
|--------|------|
| `ocr/ocrProvider.ts` | Interface + mapping helper |
| `ocr/noopOcrProvider.ts` | Default disabled implementation |

OCR is not active in MVP. Architecture allows future local OCR without coupling the locator engine.

---

## Update Rules

Update this file when creating, removing, or moving source files or changing permissions/message flow.
