# Redact

A cross-browser (Chrome + Firefox) extension that redacts page elements **before first render**, based on CSS or XPath selectors. Matched content is replaced in place with ASCII block characters (a VSCode-minimap look). Because the page is hidden behind a loading overlay until redaction finishes, sensitive data never paints to the screen — safe for screen-sharing, recording, and shoulder-surfing.

## Use cases

- **Handling regulated data (HIPAA, PCI, GDPR).** Staff who must screenshot or screen-record a patient record, claim, or billing page can keep names, dates of birth, card numbers, and other regulated fields blocked out the entire time — the data never reaches the screen, so it can't leak into a capture.
- **Live demos and screen sharing.** Present a real, logged-in app to customers or in a webinar with customer PII, internal IDs, and pricing redacted automatically on the pages and fields you choose.
- **Support and pair debugging.** Share your screen with a colleague or vendor while access tokens, emails, and account details on known dashboards stay covered.
- **Tutorials, docs, and bug reports.** Capture clean screenshots of internal tools without manually blurring each one afterward.
- **Shoulder-surfing in public.** Keep sensitive columns of an admin panel or inbox blocked while working on a laptop in the open.

Because redaction happens *before first render*, these all hold even at the instant a page loads — there is no split-second flash of the real data.

## How it works

- A content script runs at `document_start` and **synchronously** hides the page behind a loading overlay before anything paints.
- It loads the presets that match the current host, redacts the matched elements' text, then reveals the page. A timeout failsafe guarantees the page is never left hidden.
- A `MutationObserver` keeps redacting content added later (incremental parse and SPA updates).
- Content scripts are registered at runtime only for the domains you configure (no `<all_urls>`), using optional host permissions requested when you save a preset.

See `.claude/plans/` for the full design notes.

## Project layout

```
entrypoints/        background, content script, options + popup (Svelte)
src/core/           types, storage, domain matching, registration, permissions, factory
src/engine/         FOUC overlay, selector matching, redactor, observer, strategies/
src/i18n/           translate() + locale store + en/vi message catalogs
test-fixtures/      sensitive.html for manual FOUC testing
```

## Develop

```bash
npm install
npm run dev            # Chrome, with HMR
npm run dev:firefox    # Firefox
npm test               # unit/integration tests (Vitest)
npm run compile        # type check
```

## Build

```bash
npm run build          # -> .output/chrome-mv3
npm run build:firefox  # -> .output/firefox-mv3
npm run zip            # packaged zip
```

## Load the built extension

- **Chrome:** `chrome://extensions` → enable Developer mode → Load unpacked → `.output/chrome-mv3`.
- **Firefox:** `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → pick `.output/firefox-mv3/manifest.json`.

## Manual verification

### Set up a preset

1. Serve the fixture so it has a real origin (content scripts don't register on `file://` by default):
   ```bash
   npx http-server test-fixtures -p 8080   # or: python3 -m http.server 8080 -d test-fixtures
   ```
2. Open the extension's options page and add a preset:
   - **Domains:** `localhost`
   - **Rules:** `.pii` (CSS) and `//div[@id="balance"]` (XPath)
   - Enable it and Save (grant the host-permission prompt).

### FOUC test (the critical one)

1. Open DevTools → Performance → set **CPU: 6× slowdown** (and/or throttle network) to widen the window where a flash would show.
2. Load `http://localhost:8080/sensitive.html` and watch closely / screen-record.
3. **Pass criteria:** you see the "Redacting…" overlay, then the page appears with the name, email, card, and balance already shown as block characters. At no point is the real text visible.
4. The element added after 1.5s ("Late-rendered secret") should also become blocks via the observer.

### Failsafe test

Temporarily throw early in `entrypoints/content.ts` (before `reveal()`), reload, and confirm the page still reveals after the failsafe timeout rather than staying blank.

### Cross-browser persistence (Firefox)

Configure a preset, fully restart Firefox, and confirm redaction still applies — this validates the `onStartup` re-registration (Firefox does not persist dynamic registrations).
