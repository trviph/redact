import { describe, it, expect } from 'vitest';
import { toBlocks, DEFAULT_BLOCK_CHAR } from './blocks';

describe('toBlocks', () => {
  it('replaces visible characters with the default block char', () => {
    expect(toBlocks('John')).toBe('████');
  });

  it('preserves spaces so word lengths and layout survive', () => {
    expect(toBlocks('John Doe')).toBe('████ ███');
  });

  it('preserves newlines and tabs', () => {
    expect(toBlocks('ab\n\tc')).toBe('██\n\t█');
  });

  it('uses a custom block char when given', () => {
    expect(toBlocks('hi', '*')).toBe('**');
  });

  it('returns an empty string unchanged', () => {
    expect(toBlocks('')).toBe('');
  });

  it('exposes the default block char', () => {
    expect(DEFAULT_BLOCK_CHAR).toBe('█');
  });
});
