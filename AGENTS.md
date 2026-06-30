# AGENTS.md

Operating manual for anyone — human or AI agent — working on this repository. For *how to write the code*, see [CONVENTIONS.md](./CONVENTIONS.md); this file is the *how to operate* reference: architecture, commands, workflow, invariants, and the non-obvious gotchas we hit while building it.

## Project overview

`redact` is a cross-browser (Chrome + Firefox, Manifest V3) WebExtension that redacts page elements **before first render**, based on CSS or XPath selectors. Matched content is replaced in place with block characters. The whole point is that sensitive data never paints to the screen — not even for the split second between load and redaction — so it is safe for screen-sharing, recording, and shoulder-surfing.

## The prime directive

**Never allow a flash of unredacted content.** This is the entire reason the project exists; breaking it defeats everything else. Before you touch the load path, understand these two files:

- `src/engine/fouc.ts` — synchronously hides the page behind a loading overlay and reveals it, with an idempotent `reveal()` and a timeout failsafe.
- `entrypoints/content.ts` — the pipeline that runs at `document_start`: **hide → load rules → sweep → reveal**, wrapped in `try/finally` so the page always comes back.

The synchronous hide is load-bearing. Storage is async, so the page stays hidden behind the overlay until the rules load; that is the design, not a bug.

## Architecture

```
entrypoints/
  background.ts     on preset change: syncRegistrations() + ensureInjected(); install/startup resync
  content.ts        document_start pipeline: hide → load → sweep → reveal; then live reconcile on changes
  options/          Svelte: preset CRUD + language switcher (fully localized)
  popup/            Svelte: quick enable/disable for the current site
src/core/           no DOM — types, storage, domain-match, registration, injection, permissions, factory
src/engine/         fouc, selector (CSS+XPath), redactor (reversible), observer, session
src/engine/strategies/  registry + strategies (whole, blocks); the extensibility seam
src/i18n/           translate() + Svelte locale store; messages/en.ts + vi.ts
test-fixtures/      sensitive.html for manual FOUC testing
```

**Data flow:** presets are saved to storage (the single source of truth) → the background script derives match patterns and calls `syncRegistrations()` → that registers one runtime content script for the configured domains → on a matching page the content script reads the applicable rules and the engine redacts them.

**Live toggle (no reload):** a preset change writes to storage, which fans out to every running content script via `watchPresets`; each reconciles its page through `session.apply`/`clear` (a `RedactionSession` wrapping a reversible redactor). For tabs that have no content script yet (a preset enabled after the page loaded), `background.ts` calls `ensureInjected()` to inject it on demand. `content.ts` sets `data-redact-initialized` on `<html>` so a re-injection into an already-running tab is a no-op.

## Commands

```bash
npm install            # install deps (add new ones via `npm install <pkg>@latest`)
npm test               # run the Vitest suite
npm run compile        # wxt prepare + tsc --noEmit (type check)
npm run dev            # Chrome dev build with HMR
npm run dev:firefox    # Firefox dev build
npm run build          # production build → .output/chrome-mv3
npm run build:firefox  # production build → .output/firefox-mv3
```

Load unpacked: Chrome → `chrome://extensions` → Load unpacked → `.output/chrome-mv3`. Firefox → `about:debugging` → Load Temporary Add-on → `.output/firefox-mv3/manifest.json`.

## Workflow

Follow the test-driven loop in CONVENTIONS.md: skeleton → failing tests → implementation. Before committing, make sure `npm test` and `npm run compile` are both green. Commits use Conventional Commits and should be signed.

## How to extend

**Add a redaction strategy.** Create a file in `src/engine/strategies/` exporting a `RedactStrategy` (a `name` and a pure `redactText(text, options)`), then register it in `src/engine/strategies/registry.ts`. Nothing else changes — the engine resolves strategies by name and never hard-codes a style. Write its test alongside it first.

**Add a locale.** Create `src/i18n/messages/<code>.ts` exporting a catalog typed `Messages` (so it must contain exactly the English keys), then add the code to `SUPPORTED_LOCALES` and `catalogs` in `src/i18n/index.ts`. TypeScript will fail the build until every key is translated.

## Gotchas learned (read before you trip on them)

- **Firefox must be forced to MV3.** WXT defaults Firefox to MV2, which silently drops `optional_host_permissions` and changes the background shape. We set `manifestVersion: 3` in `wxt.config.ts`. Keep it.
- **Firefox registrations are ephemeral.** Firefox does not support `persistAcrossSessions: true`, so dynamic content-script registrations are lost on restart. `background.ts` re-runs `syncRegistrations()` on `runtime.onStartup` and `onInstalled` — do not remove that, or the extension silently stops working after a restart on Firefox.
- **The content script is registered at runtime**, not from the manifest (`registration: 'runtime'`, so `content_scripts` is empty). The built file lands at `content-scripts/content.js`, which is hard-coded as `CONTENT_SCRIPT_JS` in `src/core/registration.ts`. If you rename or move the content entrypoint, update that constant.
- **Do not mutate values from storage.** WXT detects changes by reference; mutating a returned array in place can make a real change look like no change and silently break `watch`. Build new arrays/objects. (See CONVENTIONS.md.)
- **Testing the browser APIs.** jsdom *does* implement `document.evaluate`, so XPath logic is unit-testable. But `fakeBrowser` (from `wxt/testing`) does **not** implement `scripting.*` — those methods throw "not implemented". Mock them with `vi.fn()` in tests that exercise registration.
- **Dependencies.** Add via commands at latest version; resolve deprecations/vulnerabilities by upgrading or pinning transitive deps through `overrides` in `package.json`.

## Deferred features (not yet built)

- An interactive element picker (click an element to generate its selector).
- More redaction strategies and custom block/random characters.
- Preset import/export.
- A Chrome-only optimization that hides only the matched elements (instead of the whole page) when every rule is a plain CSS selector.
