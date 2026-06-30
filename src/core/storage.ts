import { storage } from '#imports';
import type { Preset } from './types';

/** Presets are the single source of truth; everything else is derived. */
const presetsItem = storage.defineItem<Preset[]>('local:presets', { fallback: [] });

/** Fills in fields added after a preset was stored, so older data stays valid. */
function normalize(preset: Preset): Preset {
  return {
    ...preset,
    rules: preset.rules.map((rule) => ({ ...rule, media: rule.media ?? [] })),
  };
}

/** Returns all stored presets (empty when none have been saved). */
export async function getPresets(): Promise<Preset[]> {
  return (await presetsItem.getValue()).map(normalize);
}

/** Replaces the entire stored preset list. */
export async function setPresets(presets: Preset[]): Promise<void> {
  await presetsItem.setValue(presets);
}

/** Inserts a preset, or replaces the existing one with the same id. */
export async function savePreset(preset: Preset): Promise<void> {
  const presets = await getPresets();
  const exists = presets.some((p) => p.id === preset.id);
  const next = exists
    ? presets.map((p) => (p.id === preset.id ? preset : p))
    : [...presets, preset];
  await setPresets(next);
}

/** Removes the preset with the given id, if present. */
export async function deletePreset(id: string): Promise<void> {
  const presets = await getPresets();
  await setPresets(presets.filter((p) => p.id !== id));
}

/** Toggles a single preset's enabled flag. */
export async function setPresetEnabled(id: string, enabled: boolean): Promise<void> {
  const presets = await getPresets();
  await setPresets(presets.map((p) => (p.id === id ? { ...p, enabled } : p)));
}

/** Calls back with the full preset list whenever it changes; returns an unsubscribe. */
export function watchPresets(callback: (presets: Preset[]) => void): () => void {
  return presetsItem.watch((presets) => callback(presets ?? []));
}
