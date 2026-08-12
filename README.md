# AutoLocator

Chrome extension that analyzes **visible web UI** and generates **automation-ready locators** locally for QA engineers.

## Features

- DOM-based locator generation (CSS / XPath)
- Readable element names (`DD_`, `Button_`, `Input_`, `Link_`, etc.)
- Optional dropdown expansion for hidden options
- Python, Java, and TypeScript code export
- Popup and pinned side panel UI
- No silent telemetry — analysis runs in your browser

## Build & load (development)

```bash
npm install
npm run build
```

Load **`dist/`** as an unpacked extension in `chrome://extensions`.

## Health checks

Run the same checks used in CI and the daily GitHub Action:

```bash
npm run health        # icons + lint + tests + build
npm run health:quick  # lint + tests only
```

### Automation (GitHub Actions)

| Workflow | When |
|----------|------|
| **CI** | Every push/PR to `main` |
| **Daily Health Check** | Every day at 06:00 UTC + manual trigger |

Enable GitHub Actions on your repo to receive daily pass/fail status on the Actions tab.

## Chrome Web Store package

```bash
npm run build
npm run package:store
```

Upload `release/autolocator-store.zip` to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).

See [CHROME_WEB_STORE.md](./CHROME_WEB_STORE.md) for the full submission checklist.

## Privacy

[Privacy Policy](./PRIVACY.md)

## Developer

**Chetan Shavanti** — QA & Test Automation Engineer  
[LinkedIn](https://www.linkedin.com/in/chetan-shavanti/) · [GitHub](https://github.com/ChetanShavanti/AutoLocator)

## License

Private / All rights reserved (update if you add an open-source license).
