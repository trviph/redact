import { describe, it, expect } from 'vitest';
import type { RedactStrategy } from '../../core/types';
import { registerStrategy, getStrategy, listStrategies, redactText } from './registry';

describe('strategy registry', () => {
  it('registers the whole strategy by default', () => {
    expect(getStrategy('whole')?.name).toBe('whole');
    expect(listStrategies().some((s) => s.name === 'whole')).toBe(true);
  });

  it('returns undefined for an unknown strategy name', () => {
    expect(getStrategy('does-not-exist')).toBeUndefined();
  });

  it('makes a registered strategy resolvable by name', () => {
    const upper: RedactStrategy = { name: 'upper', redactText: (t) => t.toUpperCase() };
    registerStrategy(upper);
    expect(getStrategy('upper')).toBe(upper);
  });

  it('applies the configured strategy', () => {
    expect(redactText({ strategy: 'whole' }, 'John')).toBe('████');
  });

  it('passes options through to the strategy', () => {
    expect(redactText({ strategy: 'whole', options: { blockChar: '*' } }, 'John')).toBe('****');
  });

  it('falls back to block redaction for an unknown strategy, never leaking the text', () => {
    const result = redactText({ strategy: 'nope' }, 'secret');
    expect(result).not.toContain('secret');
    expect(result).toBe('██████');
  });
});
