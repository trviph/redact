# Releasing Redact

Redact is a [WXT](https://wxt.dev) browser extension. A release has two parts: an automated
**GitHub Release** (built by CI from a version tag) and a manual **store submission** to each
browser's add-on store (these require developer accounts and human review, so they can't be fully
automated here).

## 1. Cut a version (automated)

1. Bump `version` in `package.json` — WXT copies this into the extension manifest.
2. Commit it: `git commit -am "chore: release vX.Y.Z"`.
3. Tag and push:
   ```sh
   git tag -s vX.Y.Z -m "vX.Y.Z"
   git push origin main vX.Y.Z
   ```

Pushing the `vX.Y.Z` tag triggers `.github/workflows/release.yml`, which runs `npm ci`,
`npm run compile`, `npm test`, then `npm run zip` + `npm run zip:firefox`, and publishes a GitHub
Release with these artifacts attached:

- `redact-extension-X.Y.Z-chrome.zip` — Chrome / Edge / other Chromium browsers
- `redact-extension-X.Y.Z-firefox.zip` — Firefox
- `redact-extension-X.Y.Z-sources.zip` — source bundle for Firefox's review

The GitHub Release is immediate and is enough for sideloading and early testers. Store
distribution is the manual step below.

> **Note on `v0.1.0`:** that tag was pushed before this workflow existed, so it has no built
> release. To produce one through CI, re-push the tag after this workflow is on `main`:
> ```sh
> git push origin :v0.1.0 && git tag -d v0.1.0 && git tag -s v0.1.0 -m "v0.1.0" && git push origin v0.1.0
> ```
> Otherwise CI will kick in automatically on the next version tag.

## 2. Chrome Web Store

1. One-time: register a developer account (~$5 one-time fee) at the
   [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. **Add new item** → upload `redact-extension-X.Y.Z-chrome.zip` from the GitHub Release.
3. Fill the listing: description, screenshots, an icon, a category, and a **privacy / permissions
   justification** (explain why the extension needs its host/content-script permissions).
4. Submit for review. Approval is asynchronous (hours to a few days).

## 3. Firefox Add-ons (AMO)

1. One-time: create a free account at [addons.mozilla.org](https://addons.mozilla.org/developers/).
2. **Submit a New Add-on** → upload `redact-extension-X.Y.Z-firefox.zip`.
3. Also upload `redact-extension-X.Y.Z-sources.zip` — Mozilla reviews source for extensions built
   from a bundler.
4. Fill the listing and submit for review.

## 4. Edge Add-ons (optional)

Microsoft Edge accepts the same Chromium package. Register at
[Partner Center](https://partner.microsoft.com/dashboard/microsoftedge) and upload the
`redact-extension-X.Y.Z-chrome.zip`.

## Building locally (optional)

To produce the same zips without tagging:

```sh
npm run zip          # Chromium → .output/redact-extension-<version>-chrome.zip
npm run zip:firefox  # Firefox  → .output/redact-extension-<version>-firefox.zip (+ -sources.zip)
```
