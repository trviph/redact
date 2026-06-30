import { browser } from '#imports';
import type { Preset } from './types';
import { domainsToMatchPatterns } from './domain-match';

/** Single id for our one dynamically-registered content script. */
export const CONTENT_SCRIPT_ID = 'redact-content';

/** Build output path of the content script, registered at runtime. */
const CONTENT_SCRIPT_JS = 'content-scripts/content.js';

/** Derives the match patterns the content script should run on (enabled presets only). */
export function deriveContentScriptMatches(presets: Preset[]): string[] {
  const domains = presets.filter((preset) => preset.enabled).flatMap((preset) => preset.domains);
  return domainsToMatchPatterns(domains);
}

/**
 * Rebuilds the content-script registration from the current presets. Idempotent
 * and safe to call repeatedly: it removes any prior registration first, then
 * registers afresh. Registrations are ephemeral (persistAcrossSessions is not
 * supported on Firefox), so this must run on every browser startup.
 */
export async function syncRegistrations(presets: Preset[]): Promise<void> {
  const matches = deriveContentScriptMatches(presets);

  const existing = await browser.scripting.getRegisteredContentScripts({
    ids: [CONTENT_SCRIPT_ID],
  });
  if (existing.length > 0) {
    await browser.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] });
  }

  if (matches.length === 0) return;

  await browser.scripting.registerContentScripts([
    {
      id: CONTENT_SCRIPT_ID,
      js: [CONTENT_SCRIPT_JS],
      matches,
      runAt: 'document_start',
      allFrames: true,
      persistAcrossSessions: false,
    },
  ]);
}
