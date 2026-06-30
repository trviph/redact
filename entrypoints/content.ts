import { browser } from '#imports';
import type { Preset, Rule } from '../src/core/types';
import { getPresets, watchPresets } from '../src/core/storage';
import { hostMatchesAnyDomain } from '../src/core/domain-match';
import { createFoucController } from '../src/engine/fouc';
import { createRedactionSession } from '../src/engine/session';
import { catalogs, resolveLocale } from '../src/i18n';

/** Rules whose preset is enabled and matches the host. */
function rulesFromPresets(presets: Preset[], hostname: string): Rule[] {
  return presets
    .filter((preset) => preset.enabled && hostMatchesAnyDomain(hostname, preset.domains))
    .flatMap((preset) => preset.rules);
}

/** A stable key identifying a rule set, so we can skip unchanged reconciles. */
function rulesKey(rules: Rule[]): string {
  return JSON.stringify(rules.map((rule) => [rule.selector, rule.selectorType, rule.style]));
}

export default defineContentScript({
  // Registered at runtime from the background script for the user's configured
  // domains, so no static matches are declared here.
  registration: 'runtime',
  matches: [],
  runAt: 'document_start',
  allFrames: true,
  async main() {
    const root = document.documentElement;
    // The background may inject this script into an already-running tab; the
    // guard makes that a no-op so we never set up a second session.
    if (root.dataset.redactInitialized) return;
    root.dataset.redactInitialized = 'true';

    const overlayMessage = catalogs[resolveLocale(browser.i18n.getUILanguage())]['overlay.message'];
    const session = createRedactionSession();
    let appliedKey = '';

    function redactBehindOverlay(rules: Rule[]): void {
      const fouc = createFoucController({ message: overlayMessage });
      fouc.hide();
      try {
        session.apply(rules);
      } finally {
        fouc.reveal();
      }
    }

    // Initial load: hide synchronously BEFORE any await so nothing can paint,
    // then load rules during the hidden window and redact.
    const fouc = createFoucController({ message: overlayMessage });
    fouc.hide();
    try {
      const initialRules = rulesFromPresets(await getPresets(), location.hostname);
      appliedKey = rulesKey(initialRules);
      session.apply(initialRules);
    } finally {
      fouc.reveal();
    }

    // React to preset toggles without a reload.
    watchPresets((presets) => {
      const rules = rulesFromPresets(presets, location.hostname);
      const key = rulesKey(rules);
      if (key === appliedKey) return;
      appliedKey = key;

      if (rules.length === 0) {
        // Unblocking reveals the real text; no overlay needed.
        session.clear();
        return;
      }
      // Overlay hides the brief restore-then-reblock churn.
      redactBehindOverlay(rules);
    });
  },
});
