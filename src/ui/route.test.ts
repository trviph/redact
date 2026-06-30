import { describe, it, expect } from 'vitest';
import { parseEditorTarget } from './route';

describe('parseEditorTarget', () => {
  it('returns edit mode with the id from ?edit', () => {
    expect(parseEditorTarget('?edit=abc')).toEqual({ mode: 'edit', id: 'abc' });
  });

  it('decodes an encoded id', () => {
    expect(parseEditorTarget('?edit=a%20b')).toEqual({ mode: 'edit', id: 'a b' });
  });

  it('returns new mode for ?new', () => {
    expect(parseEditorTarget('?new')).toEqual({ mode: 'new' });
    expect(parseEditorTarget('?new=1')).toEqual({ mode: 'new' });
  });

  it('returns list mode for an empty or unrelated query', () => {
    expect(parseEditorTarget('')).toEqual({ mode: 'list' });
    expect(parseEditorTarget('?foo=bar')).toEqual({ mode: 'list' });
  });

  it('treats an empty edit id as list', () => {
    expect(parseEditorTarget('?edit=')).toEqual({ mode: 'list' });
  });

  it('prefers edit over new when both are present', () => {
    expect(parseEditorTarget('?new&edit=x')).toEqual({ mode: 'edit', id: 'x' });
  });
});
