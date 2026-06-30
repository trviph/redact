import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import type { Preset } from './types';
import {
  getPresets,
  setPresets,
  savePreset,
  deletePreset,
  setPresetEnabled,
  watchPresets,
} from './storage';

function makePreset(id: string, overrides: Partial<Preset> = {}): Preset {
  return {
    id,
    name: `Preset ${id}`,
    domains: ['example.com'],
    enabled: true,
    rules: [],
    ...overrides,
  };
}

describe('storage', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('returns an empty list when nothing is stored', async () => {
    expect(await getPresets()).toEqual([]);
  });

  it('saves a new preset', async () => {
    await savePreset(makePreset('a'));
    expect((await getPresets()).map((p) => p.id)).toEqual(['a']);
  });

  it('upserts a preset with an existing id instead of duplicating', async () => {
    await savePreset(makePreset('a', { name: 'first' }));
    await savePreset(makePreset('a', { name: 'second' }));
    const presets = await getPresets();
    expect(presets).toHaveLength(1);
    expect(presets[0]?.name).toBe('second');
  });

  it('deletes a preset by id', async () => {
    await setPresets([makePreset('a'), makePreset('b')]);
    await deletePreset('a');
    expect((await getPresets()).map((p) => p.id)).toEqual(['b']);
  });

  it('toggles the enabled flag of a single preset', async () => {
    await setPresets([makePreset('a', { enabled: true }), makePreset('b', { enabled: true })]);
    await setPresetEnabled('a', false);
    const presets = await getPresets();
    expect(presets.find((p) => p.id === 'a')?.enabled).toBe(false);
    expect(presets.find((p) => p.id === 'b')?.enabled).toBe(true);
  });

  it('notifies watchers on change and stops after unsubscribe', async () => {
    const seen: number[] = [];
    const unsubscribe = watchPresets((presets) => seen.push(presets.length));

    await savePreset(makePreset('a'));
    await savePreset(makePreset('b'));
    unsubscribe();
    await savePreset(makePreset('c'));

    expect(seen).toEqual([1, 2]);
  });
});
