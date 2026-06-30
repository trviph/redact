import { describe, it, expect, beforeEach, vi } from 'vitest';
import { browser } from '#imports';
import type { Preset } from './types';
import { deriveContentScriptMatches, syncRegistrations, CONTENT_SCRIPT_ID } from './registration';

function makePreset(id: string, overrides: Partial<Preset> = {}): Preset {
  return { id, name: id, domains: [`${id}.com`], enabled: true, rules: [], ...overrides };
}

describe('deriveContentScriptMatches', () => {
  it('includes patterns for every enabled preset domain', () => {
    expect(
      deriveContentScriptMatches([makePreset('a'), makePreset('b', { domains: ['*.b.com'] })]),
    ).toEqual(['*://a.com/*', '*://*.b.com/*']);
  });

  it('excludes disabled presets', () => {
    expect(
      deriveContentScriptMatches([makePreset('a'), makePreset('b', { enabled: false })]),
    ).toEqual(['*://a.com/*']);
  });

  it('deduplicates patterns shared across presets', () => {
    expect(
      deriveContentScriptMatches([makePreset('a'), makePreset('a2', { domains: ['a.com'] })]),
    ).toEqual(['*://a.com/*']);
  });

  it('returns nothing when no presets are enabled', () => {
    expect(deriveContentScriptMatches([makePreset('a', { enabled: false })])).toEqual([]);
  });
});

describe('syncRegistrations', () => {
  beforeEach(() => {
    browser.scripting.getRegisteredContentScripts = vi.fn().mockResolvedValue([]);
    browser.scripting.unregisterContentScripts = vi.fn().mockResolvedValue(undefined);
    browser.scripting.registerContentScripts = vi.fn().mockResolvedValue(undefined);
  });

  it('registers a document_start, all-frames, non-persistent script with the derived matches', async () => {
    await syncRegistrations([makePreset('a')]);
    expect(browser.scripting.registerContentScripts).toHaveBeenCalledTimes(1);
    const [[scripts]] = (browser.scripting.registerContentScripts as any).mock.calls;
    expect(scripts[0]).toMatchObject({
      id: CONTENT_SCRIPT_ID,
      matches: ['*://a.com/*'],
      runAt: 'document_start',
      allFrames: true,
      persistAcrossSessions: false,
    });
  });

  it('removes a prior registration before registering again', async () => {
    browser.scripting.getRegisteredContentScripts = vi
      .fn()
      .mockResolvedValue([{ id: CONTENT_SCRIPT_ID }]);
    await syncRegistrations([makePreset('a')]);
    expect(browser.scripting.unregisterContentScripts).toHaveBeenCalledWith({
      ids: [CONTENT_SCRIPT_ID],
    });
    expect(browser.scripting.registerContentScripts).toHaveBeenCalledTimes(1);
  });

  it('does not register when there are no enabled presets', async () => {
    await syncRegistrations([makePreset('a', { enabled: false })]);
    expect(browser.scripting.registerContentScripts).not.toHaveBeenCalled();
  });

  it('does not attempt to unregister when nothing was registered', async () => {
    await syncRegistrations([makePreset('a')]);
    expect(browser.scripting.unregisterContentScripts).not.toHaveBeenCalled();
  });
});
