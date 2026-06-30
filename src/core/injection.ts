import { browser } from '#imports';
import type { Preset } from './types';
import { hostMatchesAnyDomain } from './domain-match';
import { CONTENT_SCRIPT_JS } from './registration';

/** The subset of a browser tab this module needs. */
export interface InjectableTab {
  id?: number;
  url?: string;
}

/** Ids of open tabs whose host matches an enabled preset domain. */
export function tabsToInject(tabs: InjectableTab[], presets: Preset[]): number[] {
  const enabledDomains = presets.filter((preset) => preset.enabled).flatMap((preset) => preset.domains);
  if (enabledDomains.length === 0) return [];

  const ids: number[] = [];
  for (const tab of tabs) {
    if (tab.id === undefined || !tab.url) continue;
    let host: string;
    try {
      host = new URL(tab.url).hostname;
    } catch {
      continue;
    }
    if (host !== '' && hostMatchesAnyDomain(host, enabledDomains)) ids.push(tab.id);
  }
  return ids;
}

/**
 * Ensures every open tab matching an enabled preset has the content script.
 * Already-scripted tabs re-run their guarded entry and no-op; script-less tabs
 * initialize and redact — this is what makes enabling a preset take effect on
 * an open page without a reload.
 */
export async function ensureInjected(presets: Preset[]): Promise<void> {
  const tabs = await browser.tabs.query({});
  await Promise.all(
    tabsToInject(tabs, presets).map((tabId) =>
      browser.scripting
        .executeScript({ target: { tabId, allFrames: true }, files: [`/${CONTENT_SCRIPT_JS}`] })
        // A tab may have closed, navigated, or be a page we can't script; ignore.
        .catch(() => {}),
    ),
  );
}
