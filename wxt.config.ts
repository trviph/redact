import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-svelte'],
  srcDir: '.',
  // Firefox defaults to MV2 in WXT; force MV3 on both so the scripting API,
  // event-page background, and optional_host_permissions model are consistent.
  manifestVersion: 3,
  // Our own modules under src/ are always imported explicitly. WXT's framework
  // helpers (defineBackground, defineContentScript, browser, storage) stay
  // auto-imported, which is the documented and test-supported path.
  manifest: {
    name: 'Redact',
    description: 'Redact page elements before first render, by CSS or XPath selector',
    permissions: ['storage', 'scripting', 'tabs'],
    optional_host_permissions: ['*://*/*'],
    browser_specific_settings: {
      gecko: {
        id: 'redact@local.extension',
      },
    },
  },
});
