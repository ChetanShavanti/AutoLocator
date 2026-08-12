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
├── .github/workflows/            # CI + daily health GitHub Actions
│   ├── ci.yml
│   └── daily-health.yml
├── AGENTS.md
├── codingRules.md
├── sourceMap.md
├── manifest.json                 # Source manifest (dev reference)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
│   ├── icons/                    # Extension icons (16/32/48/128 PNGs + UI assets)
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
│   │   ├── extensionMeta.ts
│   │   └── types.ts
│   ├── storage/
│   │   └── settingsStorage.ts
│   └── vite-env.d.ts
└── tests/
    ├── health.test.ts              # Daily smoke / project health checks
    ├── setup.ts
    ├── actionableClassifier.test.ts
    ├── dropdownExpander.test.ts
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

## Data Flow

| Step | Mechanism | Payload |
|------|-----------|---------|
| Settings | UI → `chrome.storage.local` via `settingsStorage.ts` | `UserSettings` |
| Analysis | popup/sidepanel → page (`executeScript`) | `UserSettings` in function args |
| Session restore | UI ↔ `chrome.storage.session` | per-tab `AnalysisResult` |
| Tab cleanup | service worker on `tabs.onRemoved` | tab id only |

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
Popup / Side Panel UI (trusted extension origin)
        ⇅ chrome.storage (validated settings)
Service Worker (tab session cleanup only)
```

---

## OCR

| Module | Role |
|--------|------|
| `ocr/ocrProvider.ts` | Interface for future OCR implementations |
| `ocr/noopOcrProvider.ts` | Default disabled implementation |

OCR is not active in MVP. Architecture allows future local OCR without coupling the locator engine.

---

## Update Rules

Update this file when creating, removing, or moving source files or changing permissions/message flow.
