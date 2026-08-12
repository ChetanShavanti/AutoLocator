# AGENTS.md — AutoLocator Engineering Contract

This document is the top-level operating manual for developers, QA engineers, security reviewers, and AI coding agents working on this repository.

**Before writing or modifying code, read:**

1. `AGENTS.md` (this file)
2. `codingRules.md`
3. `sourceMap.md`

If these documents conflict, resolve the conflict before proceeding. When implementation choices are not yet fixed, prefer the most secure, least-privilege option and update documentation when a decision is made.

---

## Project Identity

**AutoLocator** is a secure Chrome Extension that analyzes the currently visible web UI and generates clean, reliable, automation-ready locators and page-object-style code for QA and automation engineers.

### What the product does

- Inspects the **currently visible** page UI through the browser DOM.
- Identifies **actionable, meaningful** UI elements (inputs, buttons, links, dropdowns, dialogs, etc.).
- Generates **concise, automation-ready** locators and named code output.
- Enriches analysis with **accessibility and semantic** information where available.
- Uses **OCR only as a fallback** when UI cannot be sufficiently represented through normal DOM inspection.

### What the product does not do

- Dump raw DOM trees by default.
- Transmit page content to external services without explicit user action and documented purpose.
- Execute arbitrary page scripts or remote code.
- Replace thoughtful QA judgment with opaque automation magic.

### Primary mechanism

**DOM analysis is the default and primary mechanism.** Accessibility APIs and semantic attributes improve naming and locator quality. OCR is a last-resort fallback for UI that cannot be represented reliably through DOM inspection alone.

### Technology baseline (implemented)

- **TypeScript** (strict mode)
- **Vite 6** for bundling
- **Vitest + happy-dom** for unit tests
- **Manifest V3** Chrome Extension

Build output is in `dist/`. Load unpacked in Chrome from that directory.

Do not assume Python, legacy extension APIs, or reference-project tooling unless explicitly adopted and documented.

---

## Core Product Principles

1. **User value over feature count** — ship useful locator output, not feature checklists.
2. **Visible actionable UI over raw DOM dumping** — default output reflects what a user can see and interact with.
3. **Concrete locator over unnecessarily complex locator** — prefer direct, readable selectors.
4. **Reliable locator over merely unique locator** — uniqueness alone is insufficient; stability matters.
5. **Readability over selector cleverness** — generated code must be easy to review and maintain.
6. **Local processing whenever practical** — analyze in the browser; avoid unnecessary server round-trips.
7. **Least-privilege browser permissions** — request only what is required, when required.
8. **No unnecessary network transmission** — do not send page data off-device by default.
9. **No hidden tracking** — no silent telemetry or analytics.
10. **No unnecessary dependencies** — justify every package added.
11. **No unnecessary architecture** — avoid layers that do not reduce complexity.
12. **Secure defaults** — safe behavior without requiring expert configuration.
13. **Maintainable code** — small modules, clear ownership, predictable flow.
14. **Easy code review** — changes should be reviewable in isolation.
15. **Easy debugging** — failures should be diagnosable without guessing hidden state.

---

## Architectural Principles

### Intended processing pipeline

The locator engine should follow this conceptual flow:

```text
Visible Page
    ↓
DOM Discovery
    ↓
Visibility Filtering
    ↓
Actionable Element Detection
    ↓
Semantic Analysis
    ↓
Candidate Locator Generation
    ↓
Locator Quality Analysis
    ↓
Best Locator Selection
    ↓
Pattern Detection
    ↓
State Analysis
    ↓
Dropdown Analysis
    ↓
Grouping
    ↓
Code Generation
    ↓
User Output
```

### OCR role

OCR is a **fallback mechanism**, not the default path. Use it only when DOM and accessibility inspection cannot produce a sufficiently actionable representation of visible UI. OCR usage must be explicit, user-visible where practical, and documented in `sourceMap.md` when implemented.

### Extension runtime shape (planned)

When implemented, the extension should separate concerns across Manifest V3 components:

| Component | Responsibility |
|-----------|----------------|
| **Content scripts** | DOM access, element discovery, visibility checks, page-context analysis |
| **Service worker** | Orchestration, messaging hub, storage coordination, permission-sensitive operations |
| **Extension UI** (popup / side panel / devtools panel — TBD) | User controls, output display, copy/export |
| **Shared modules** | Pure logic: scoring, naming, code generation (no direct DOM where avoidable) |
| **Options page** | User preferences, documented permission explanations |

Exact UI surface and directory layout will be recorded in `sourceMap.md` during implementation. Do not invent files before they exist.

### Design influences (reference only)

The [tctoolkit](https://github.com/nitinbhide/tctoolkit) project is a reference for **documentation clarity and modular responsibility**, not for technology choices. Useful patterns to emulate:

- Each major tool/module has a clearly named responsibility.
- Shared utilities live in a dedicated area, not scattered helpers.
- Tests live near the behavior they validate.
- Documentation explains *what* a module does and *what it does not* do.

Do **not** copy tctoolkit implementation, Python stack, or unrelated architecture.

---

## Security Principles

This project is **security-sensitive** because it may inspect arbitrary web pages, including pages containing credentials, personal data, or proprietary content.

### Mandatory rules

| Area | Rule |
|------|------|
| **Permissions** | Request minimum Manifest V3 permissions. Document every permission in `sourceMap.md` with rationale. |
| **Message passing** | Validate all messages at trust boundaries. Use typed payloads. Reject unknown or malformed messages. |
| **Input validation** | Treat all cross-boundary data (page DOM excerpts, user settings, messages) as untrusted until validated. |
| **Output sanitization** | Sanitize generated output and UI rendering. Never inject unsanitized page HTML into extension UI. |
| **DOM access** | Read DOM for analysis only. Do not modify page state except for safe, documented, user-initiated state analysis. |
| **Storage** | Use `chrome.storage` appropriately. Do not persist full page content or secrets by default. |
| **Secret leakage** | Never log, store, or transmit passwords, tokens, cookies, or auth headers. |
| **Data collection** | Collect only what is needed for locator generation. No silent exfiltration. |
| **Content execution** | Do not use `eval`, `new Function`, or dynamic code execution on untrusted input. |
| **Remote code** | No remotely loaded executable logic. Bundle extension code statically. |
| **HTML injection** | Do not use `innerHTML` with unsanitized page-derived strings. Prefer safe DOM APIs or strict escaping. |
| **Hard-coded secrets** | Never commit API keys or credentials. Use environment/build-time injection only where appropriate for build tooling, not runtime secrets in the extension bundle. |
| **External APIs** | Avoid external APIs unless explicitly required and approved. OCR or AI services require explicit user consent and documentation. |
| **Telemetry** | No silent telemetry. Any analytics must be opt-in and documented. |

### Chrome Web Store alignment

Implementation must align with applicable [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies).

Following this document **does not guarantee** store approval. Privacy practices, permission justifications, and data handling must still be reviewed against current store requirements before submission.

### Trust boundaries

```text
Untrusted Web Page
        ⇅  (DOM read, validated messages only)
Content Script (isolated world)
        ⇅  (structured messages, no raw HTML to UI)
Service Worker / Extension Runtime
        ⇅  (sanitized display data only)
Extension UI (trusted)
```

Never treat page-provided strings as trusted HTML, JavaScript, or configuration.

---

## Chrome Extension Rules

### Manifest V3

- Use **Manifest V3** exclusively.
- Use a **service worker** background script, not persistent background pages.
- Prefer **`chrome.scripting`** with user action over broad persistent injection where possible.
- Use **content scripts** for DOM inspection in isolated worlds.

### Permission discipline

Every permission must have a **documented reason** before it is added to `manifest.json`.

Before adding a permission, ask:

> Can the same capability be implemented with a narrower permission or user-triggered mechanism?

If yes, use the narrower approach.

Common permission considerations (not prescriptive — justify each at implementation time):

| Permission | Typical need | Narrower alternative to consider |
|------------|--------------|----------------------------------|
| `activeTab` | Analyze current tab on user action | Prefer over `<all_urls>` |
| `scripting` | Inject content script on demand | User gesture + activeTab |
| `storage` | Save user preferences | Local only unless sync is required |
| `host_permissions` | Broad site access | Avoid unless product requirement is explicit |

**Never** add a permission speculatively for future features.

### Content Security Policy

- Respect extension CSP defaults.
- Do not weaken CSP to accommodate convenience.
- Avoid inline scripts in extension pages.

---

## Code Organization Rules

### Directory responsibility

Every major directory must have one clearly defined responsibility documented in `sourceMap.md`.

When implementation begins, prefer a structure similar to:

```text
src/
  background/       # Service worker orchestration
  content/          # Page-context DOM analysis
  core/             # Pure locator logic (no DOM where possible)
  ui/               # Extension UI surfaces
  shared/           # Types, messaging contracts, constants
  options/          # Settings page
tests/              # Unit and integration tests
public/             # Static extension assets (icons, manifest)
```

Adjust only with documentation updates. Do not create directories preemptively in the governance phase.

### Anti-patterns to avoid

- God modules that own discovery, scoring, UI, and messaging
- Giant catch-all utility files
- Arbitrary `helpers/` dumping grounds without ownership
- Circular dependencies between content, core, and UI layers
- Hidden side effects (global mutation, undeclared DOM changes)
- Duplicate business logic across content scripts and UI
- Premature abstraction layers

### Dependency direction (planned)

```text
ui, content, background  →  shared (types, messaging)
content, background      →  core (pure logic)
core                     →  (no extension UI, no page DOM)
```

---

## File Documentation Rule

Every source file must begin with a concise documentation header.

The header must explain:

- **File name**
- **Purpose**
- **Responsibility**
- **What the file does NOT own** (where useful)
- **Important dependencies** (where useful)

Example:

```typescript
/**
 * File: locatorScorer.ts
 *
 * Purpose:
 * Scores candidate locators using uniqueness, stability,
 * readability, and simplicity.
 *
 * Responsibilities:
 * - Evaluate locator candidates.
 * - Assign quality scores.
 * - Identify risky locator patterns.
 *
 * Does not:
 * - Manipulate DOM state.
 * - Access browser storage.
 * - Make network requests.
 */
```

Do not write meaningless comments. Headers must help a reviewer decide whether they are in the right file.

---

## Method Documentation Rule

Every **public** method and every **non-trivial private** method must have a concise summary describing:

- Purpose
- Important inputs
- Important output
- Important side effects, if any

Use TSDoc (`/** ... */`) for TypeScript.

Do not comment every trivial getter/setter. Comments must explain **intent**, not restate syntax.

---

## Testing Rules

Important functionality must be testable independently of the full browser where practical.

### Priority test areas

- Locator generation
- Locator scoring
- Visibility detection
- Actionable-element classification
- Semantic naming
- State detection
- Dropdown handling
- Code generation
- Permission-related behavior
- Security-sensitive behavior (message validation, sanitization)

### Test principles

- Prefer **pure function tests** in `core/` modules.
- Use fixture HTML/DOM snapshots for content-script behavior where integration tests are needed.
- Avoid meaningless tests written only for coverage percentages.
- Name tests to describe behavior: `locatorScorer.prefersStableTestIdOverVolatileClass`.

When tests are added, document test layout in `sourceMap.md`.

---

## Change Management

### Before structural changes

Any developer or coding agent modifying architecture must first read:

```text
AGENTS.md
codingRules.md
sourceMap.md
```

### When structure changes

Update documentation in the same change (or immediately after):

| Change | Update |
|--------|--------|
| New/moved/removed source file | `sourceMap.md` |
| New permission or message type | `sourceMap.md`, security section if needed |
| New coding convention | `codingRules.md` |
| New product or security principle | `AGENTS.md` |

Documentation must not become stale. If code and docs disagree, treat doc staleness as a defect.

### Implementation phase gate

All implementation must treat these three files as **mandatory constraints**.

---

## Quick Reference for Coding Agents

| Question | Where to look |
|----------|---------------|
| What is this project? | Project Identity (above) |
| How should locators be chosen? | `codingRules.md` → Locator Generation, Locator Quality |
| What elements to include? | `codingRules.md` → Actionable Element Rules |
| File/module ownership? | `sourceMap.md` |
| Naming conventions? | `codingRules.md` → Naming |
| Security constraints? | Security Principles (above) + `codingRules.md` → Error Handling, DOM Access |
| Current repo contents? | `sourceMap.md` → Project Tree |
