import { browser } from '#imports';
import type { Rule } from '../src/core/types';
import { getPresets } from '../src/core/storage';
import { hostMatchesAnyDomain } from '../src/core/domain-match';
import { createFoucController } from '../src/engine/fouc';
import { createRedactor } from '../src/engine/redactor';
import { createRedactionObserver } from '../src/engine/observer';
import { catalogs, resolveLocale } from '../src/i18n';

/** Collects the rules whose preset is enabled and matches the current host. */
async function rulesForHost(hostname: string): Promise<Rule[]> {
  const presets = await getPresets();
  return presets
    .filter((preset) => preset.enabled && hostMatchesAnyDomain(hostname, preset.domains))
    .flatMap((preset) => preset.rules);
}

export default defineContentScript({
  // Registered at runtime from the background script for the user's configured
  // domains, so no static matches are declared here.
  registration: 'runtime',
  matches: [],
  runAt: 'document_start',
  allFrames: true,
  async main() {
    const overlayMessage = catalogs[resolveLocale(browser.i18n.getUILanguage())]['overlay.message'];
    const fouc = createFoucController({ message: overlayMessage });

    // Hide synchronously before anything can paint. Everything after runs while
    // the page is hidden; the finally guarantees it is always revealed again.
    fouc.hide();
    try {
      const rules = await rulesForHost(location.hostname);
      if (rules.length > 0) {
        const redactor = createRedactor(rules);
        // Keep observing for the page lifetime so SPA and late content is redacted too.
        createRedactionObserver(redactor).start(document.documentElement);
        redactor.redactRoot(document);
      }
    } finally {
      fouc.reveal();
    }
  },
});
