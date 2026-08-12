# codingRules.md — AutoLocator Coding Standards

Concrete, enforceable coding standards for the AutoLocator Chrome Extension.

This document complements `AGENTS.md` (product, security, architecture) and `sourceMap.md` (file and module map). All three must stay consistent.

**Intended language:** TypeScript (strict mode, initialized).

**Build:** Vite (`npm run build` → `dist/`).

---

## General

- Write **simple, direct code**. Prefer clarity over cleverness.
- Use **clear naming** that reflects domain concepts (locator, element, visibility, scorer), not implementation accidents.
- Keep **functions small and focused** — one clear responsibility per function.
- Apply **single responsibility** at file and module level.
- Maintain **low coupling** between DOM access, pure logic, and UI.
- Declare **explicit dependencies** through imports; avoid implicit globals.
- Make **side effects predictable** — DOM mutation, storage writes, and messaging must be obvious from function names and docs.
- **No speculative abstraction** — do not introduce interfaces, factories, or plugin systems until a second use case exists.

### Code review readiness

Every change should answer:

- What behavior changed?
- What module owns it?
- What tests cover it?
- Does it respect security boundaries?

---

## Naming

Use **one consistent convention** throughout the project.

| Kind | Convention | Example |
|------|------------|---------|
| **Directories** | camelCase for source packages; lowercase for top-level config | `locatorEngine/`, `content/` |
| **Source files** | camelCase, noun or verb-noun describing responsibility | `locatorScorer.ts`, `visibilityFilter.ts` |
| **Test files** | Same base name + `.test.ts` or `.spec.ts` | `locatorScorer.test.ts` |
| **Functions / methods** | camelCase, verb-first for actions | `scoreLocator()`, `isElementVisible()` |
| **Variables** | camelCase | `candidateLocators`, `visibleElements` |
| **Constants** | UPPER_SNAKE_CASE for true constants | `MAX_LOCATOR_DEPTH`, `DEFAULT_TIMEOUT_MS` |
| **Classes** | PascalCase | `LocatorCandidate`, `ElementMetadata` |
| **Interfaces / types** | PascalCase; prefix `I` only if team convention requires (prefer plain names) | `ScoredLocator`, `ElementDescriptor` |
| **Enums** | PascalCase name; PascalCase or UPPER_SNAKE members (pick one and stay consistent) | `LocatorStrategy.CssId` |
| **Generated element names** | PascalCase or snake_case per target language output setting | `Username`, `Forgot_your_password` |
| **Private members** | camelCase with optional leading `_` only if eslint config adopts it — prefer `private` keyword | `private normalizeLabel()` |

### Prohibited naming

- `element1`, `button2`, `div17`, `data`, `temp`, `helper`, `utils2`
- Abbreviations unclear to new readers (`el`, `proc`, `mgr`) unless domain-standard (`dom`, `aria`)

---

## Functions / Methods

Default expectations:

- **One clear responsibility** per function.
- **Small enough to review** in a single screen (~40 lines as a soft guideline, not a hard rule).
- **Meaningful names** — `generateCssCandidates` not `process`.
- **Predictable input/output** — avoid mutating arguments unless documented.
- **No hidden side effects** — if a function touches DOM, storage, or messaging, say so in its doc comment.

### Avoid

Functions that combine unrelated responsibilities, for example:

- discover elements **and** render UI
- score locators **and** write to storage
- parse messages **and** perform DOM traversal

Split at module boundaries defined in `sourceMap.md`.

### Pure vs impure

- **`core/` modules** should be pure where possible (input → output, no DOM).
- **`content/` modules** own DOM reads and limited, documented DOM interaction for state analysis.
- **`ui/` modules** own rendering and user events only.

---

## Error Handling

### Expected failures

Handle expected failures explicitly:

- Stale DOM nodes after dynamic updates
- Cross-origin iframe boundaries
- Missing accessibility names
- Empty candidate locator sets
- User cancellation

Do not rely on uncaught exceptions for control flow.

### Silent failures

**Errors must not be silently swallowed.**

```typescript
// Bad
try { analyzeElement(el); } catch { /* ignore */ }

// Good
try {
  analyzeElement(el);
} catch (error) {
  logInternalError('analyzeElement failed', { elementTag: el.tagName });
  return failureResult(error);
}
```

### User-facing errors

- Messages must be **safe** — no raw page HTML, credentials, or stack traces in UI.
- Use generic guidance: "Could not analyze this element" with optional debug detail behind a developer flag.

### Internal errors

- Must **not expose sensitive page data** in logs.
- Log element **types and anonymized identifiers**, not full text content of inputs unless explicitly in a secure debug mode.

### Logging

- Never log secrets, tokens, cookies, or password field values.
- Truncate or redact long strings from page context.

### Fallback behavior

Fallbacks (e.g., OCR, secondary locator strategy) must be **explicit and documented** in code and user-visible where appropriate.

---

## DOM Access

Rules for content-script and page-context code.

### Visibility detection

- An element is not actionable merely because it exists in the DOM.
- Consider: `display`, `visibility`, `opacity`, `aria-hidden`, zero-size boxes, off-screen placement, ancestor clipping.
- Hidden elements are excluded by default (see Actionable Element Rules).

### Stale node handling

- Re-query or validate nodes before use after async work.
- Handle `DOMException` from detached nodes gracefully.

### Safe traversal

- Walk ancestors with depth limits to prevent runaway traversal on malformed DOM.
- Guard against circular references in custom shadow roots.

### Shadow DOM

- Traverse open shadow roots where applicable.
- Document limitations for closed shadow roots; do not claim support that does not exist.

### iframe boundaries

- Respect same-origin policy.
- Document when analysis stops at iframe boundaries.
- Do not attempt to bypass browser security boundaries.

### Dynamic DOM updates

- Pages mutate after load; design for incremental or re-triggered analysis.
- Do not assume static HTML.

### Performance

- Avoid unnecessary **full-page scans** on every keystroke.
- Avoid **expensive repeated queries** — cache within a single analysis pass where safe.
- Debounce user-triggered re-analysis in UI.

---

## Locator Generation

### Core philosophy

> Select the shortest **concrete** locator that uniquely identifies the element while maximizing stability, readability, and maintainability.

### Candidate sources (preference order — not absolute)

Evaluate every element individually. Typical sources, in rough priority:

1. Stable test IDs / automation attributes (`data-testid`, `data-qa`, framework-specific stable attrs)
2. Stable IDs (reject generated/volatile IDs)
3. Semantic attributes (`role`, meaningful `type`)
4. `name`
5. `aria-label` / accessible name
6. `placeholder`
7. Associated `<label>` text
8. Stable class or attribute combinations (avoid CSS framework noise)
9. Text-based selectors (when text is stable and not duplicated)
10. Structural selectors (tag + limited hierarchy)
11. XPath (when necessary and justified)

**Example:** `#save123` should generally beat `button.btn` when the ID is concrete, unique, and reasonably stable.

### Generated or suspicious identifiers

Treat cautiously:

- IDs matching patterns like `ember123`, `react-aria-:r0:`, UUIDs, random hashes
- Class names that appear auto-generated
- Deep positional XPath

Down-rank in scoring; prefer alternatives when stability is doubtful.

### Candidate generation module rules

- Generate **multiple candidates** internally.
- Expose **one best locator** by default (see Alternative Locator Rule).
- Keep generation logic separate from scoring and from DOM walking.

---

## Locator Quality

Every candidate locator should be evaluated on:

| Criterion | Question |
|-----------|----------|
| **Uniqueness** | Does it match exactly one target element in the current context? |
| **Stability** | Will it survive minor DOM restyling or reordering? |
| **Readability** | Can a QA engineer understand it without spelunking the DOM? |
| **Specificity** | Is it precise enough without being brittle? |
| **Maintainability** | Will the automation team want to keep it? |
| **Brittleness** | Does it depend on nth-child, long paths, or volatile classes? |
| **Implementation dependence** | Does it rely on generated framework internals? |

The final locator must be the **best practical selector**, not simply the first selector that matches.

Scoring logic belongs in dedicated modules (see `sourceMap.md` when implemented).

---

## Alternative Locator Rule

### Default output

```python
Save = "#save123"
```

### When to show alternatives

Only when the selected locator is:

- Potentially unstable
- Suspicious (generated ID/class)
- Ambiguous (weak uniqueness confidence)
- Brittle (deep structure, index-based)
- Dependent on volatile DOM structure
- Otherwise likely to cause practical automation problems

### Format

```python
Save = "#save123"  # Alternatives: //button[@id="save123"]
```

Do **not** overwhelm the user with selector lists. Limit alternatives (typically one to two).

---

## Actionable Element Rules

### Include by default

Meaningful UI elements such as:

- inputs, textareas, buttons, links
- dropdowns, options, selects
- checkboxes, radio buttons
- tabs, menus, menu items
- search inputs, toggles
- dialogs, modal controls
- navigation controls
- date-picker controls
- meaningful table controls (sort headers, row actions)
- relevant headings or text **when useful for automation context**

### Exclude by default

- hidden elements
- decorative DOM nodes
- layout containers and meaningless wrappers
- SVG path details
- duplicate representations of the same control
- irrelevant implementation nodes (script tags, meta, style)

### Show All Elements mode

If architecture supports it, provide an **optional explicit mode** to include non-actionable or hidden elements. It must be off by default and clearly labeled.

---

## State Analysis

State analysis discovers locators for toggled, expanded, selected, or otherwise stateful UI.

### Safe interaction only

Only **safe, non-destructive** UI actions may be automatically probed.

### Never automatically activate

- delete / remove
- purchase / pay
- submit / send
- confirm destructive operations
- irreversible changes
- potentially destructive navigation (logout, form submit that sends data)

When in doubt, **do not interact** — infer state from DOM/ARIA where possible.

### State analysis procedure

1. Capture before state
2. Perform safe interaction (e.g., expand menu, toggle non-destructive control)
3. Wait for UI stabilization
4. Capture after state
5. Compare states
6. Generate useful state-specific locators
7. Restore original state where practical

Do not generate before/after locators simply because something visually changed — changes must be meaningful for automation.

---

## Dropdown Rules

Where a dropdown is safely inspectable:

- Identify the control element
- Identify available meaningful options
- Generate locators for options where practical
- Avoid destructive interaction (no selecting options that commit irreversible actions without user intent)
- Support native `<select>` and common custom dropdown patterns (ARIA listbox, menu, combobox)

Document unsupported patterns rather than failing silently.

---

## Naming Rules (Generated Output)

Generated element names must be:

- **Human-readable**
- **Deterministic** (same element → same name across runs on identical DOM)
- **Meaningful** (derived from label, aria, placeholder, stable id)
- **Valid** for the target language (Python, Java, C#, etc.)
- **Consistent** within a page analysis session
- **Collision-safe** (suffix or disambiguation when names collide)

### Prefer

```text
Username
Login
Forgot_your_password
ProfileDropdown
SidePanelOpened
```

### Avoid

```text
element1
button2
div17
```

Naming logic belongs in dedicated modules, separate from locator string generation.

---

## Generated Code Rules

Generated code must:

- Be **syntactically valid** for the selected target language
- Use the user's **preferred locator strategy** (CSS, XPath, role-based, etc.) when configured
- Remain **readable** — consistent indentation, logical grouping
- Avoid **unnecessary escaping**
- Avoid **duplicate definitions**
- **Preserve useful grouping** (forms, dialogs, navigation sections)
- **Detect reusable selector patterns** when confidence is high (e.g., repeated `data-testid` prefix)

Do **not** force Page Object abstraction when flat named constants are clearer.

Pattern detection must not produce false-positive abstractions.

---

## Performance

Avoid:

- Unnecessary repeated DOM traversal
- Unnecessary OCR (OCR is fallback only)
- Continuous page polling when idle
- Expensive synchronous work on the main thread in content scripts
- Large unnecessary data copies (clone entire DOM trees)

Performance-sensitive operations should be **measurable** (simple timing hooks or tests) when optimization is claimed.

Target: analysis triggered by user action should feel responsive on medium-complexity pages.

---

## Dependency Rules

Before adding a dependency:

1. Check existing dependencies and browser-native APIs.
2. Determine whether a **small local implementation** is simpler.
3. Consider **bundle size** impact on extension install size.
4. Consider **security** (supply chain, maintenance, permissions).
5. Consider **maintenance** (last publish date, issue activity).
6. Consider **Chrome Web Store** implications (remote code, obfuscation policies).

Every dependency must have a **documented purpose** in `sourceMap.md` or a dedicated `DEPENDENCIES.md` if the list grows.

Prefer zero runtime dependencies in `core/` pure logic modules.

---

## Documentation

### New source files

Every new major source file must be reflected in `sourceMap.md` with:

- Purpose
- Responsibility
- Inputs / outputs
- Dependencies
- Important notes

### Responsibility changes

When a module's ownership changes, update:

- File header comment
- `sourceMap.md`
- Tests referencing the module

### Public API changes

Update relevant tests and any message contract documentation in `sourceMap.md`.

---

## TypeScript-Specific Rules (when project is initialized)

- Enable **`strict`** in `tsconfig.json`.
- Prefer **`interface`** for object shapes; use **`type`** for unions and mapped types.
- Use **`unknown`** instead of **`any`** at trust boundaries; narrow explicitly.
- Use **`===`** and **`!==`** always.
- No **`eval`**, **`new Function`**, or dynamic **`import()`** with user-controlled specifiers.
- No user input in **`require()`** or dynamic module paths.

---

## Security Coding Checklist (per change touching boundaries)

- [ ] Messages validated at receiver
- [ ] Page strings escaped before UI render
- [ ] No secrets in logs or storage
- [ ] No new permission without documented rationale
- [ ] No network call with page content without explicit design approval
- [ ] State analysis does not trigger destructive actions
