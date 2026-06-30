import type { Preset, Rule } from './types';

/** Creates a blank, enabled preset with a fresh id. */
export function newPreset(): Preset {
  return { id: crypto.randomUUID(), name: '', domains: [], enabled: true, rules: [] };
}

/** Creates a blank CSS rule with a fresh id. */
export function newRule(): Rule {
  return {
    id: crypto.randomUUID(),
    selector: '',
    selectorType: 'css',
    description: '',
    style: { strategy: 'whole' },
    media: [],
  };
}
