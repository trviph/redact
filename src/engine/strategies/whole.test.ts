import { describe, it, expect } from 'vitest';
import { wholeStrategy } from './whole';

describe('wholeStrategy', () => {
  it('is named "whole"', () => {
    expect(wholeStrategy.name).toBe('whole');
  });

  it('blocks the whole text with the default char', () => {
    expect(wholeStrategy.redactText('John Doe')).toBe('████ ███');
  });

  it('respects a blockChar option', () => {
    expect(wholeStrategy.redactText('John', { blockChar: '*' })).toBe('****');
  });
});
