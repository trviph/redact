import { describe, it, expect, beforeEach } from 'vitest';
import { findMatches } from './selector';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('findMatches (css)', () => {
  it('finds descendant elements of the root', () => {
    document.body.innerHTML = '<p class="secret">a</p><p class="secret">b</p><p>c</p>';
    const matches = findMatches(document, '.secret', 'css');
    expect(matches.map((el) => el.textContent)).toEqual(['a', 'b']);
  });

  it('includes the root itself when it matches', () => {
    document.body.innerHTML = '<div class="secret"><span>inner</span></div>';
    const root = document.querySelector('.secret')!;
    const matches = findMatches(root, '.secret', 'css');
    expect(matches).toContain(root);
  });

  it('returns an empty array for an invalid selector instead of throwing', () => {
    document.body.innerHTML = '<p>a</p>';
    expect(() => findMatches(document, '::::nope', 'css')).not.toThrow();
    expect(findMatches(document, '::::nope', 'css')).toEqual([]);
  });

  it('returns an empty array when nothing matches', () => {
    document.body.innerHTML = '<p>a</p>';
    expect(findMatches(document, '.missing', 'css')).toEqual([]);
  });
});

describe('findMatches (xpath)', () => {
  it('finds elements matched by an absolute expression', () => {
    document.body.innerHTML = '<div class="a">x</div><span>y</span><div class="a">z</div>';
    const matches = findMatches(document, '//div[@class="a"]', 'xpath');
    expect(matches.map((el) => el.textContent)).toEqual(['x', 'z']);
  });

  it('scopes a relative expression to the root context', () => {
    document.body.innerHTML =
      '<section id="s"><b>keep</b></section><b>outside</b>';
    const root = document.getElementById('s')!;
    const matches = findMatches(root, './/b', 'xpath');
    expect(matches.map((el) => el.textContent)).toEqual(['keep']);
  });

  it('returns only element nodes', () => {
    document.body.innerHTML = '<p>hello</p>';
    const matches = findMatches(document, '//p/text()', 'xpath');
    expect(matches).toEqual([]);
  });

  it('returns an empty array for an invalid expression instead of throwing', () => {
    document.body.innerHTML = '<p>a</p>';
    expect(() => findMatches(document, '//[bad', 'xpath')).not.toThrow();
    expect(findMatches(document, '//[bad', 'xpath')).toEqual([]);
  });
});
