import { describe, it, expect } from 'vitest';
import type { Preset } from './types';
import { tabsToInject } from './injection';

function preset(id: string, overrides: Partial<Preset> = {}): Preset {
  return { id, name: id, domains: [`${id}.com`], enabled: true, rules: [], ...overrides };
}

describe('tabsToInject', () => {
  it('returns ids of tabs whose host matches an enabled preset domain', () => {
    const tabs = [
      { id: 1, url: 'https://a.com/page' },
      { id: 2, url: 'https://other.com/' },
    ];
    expect(tabsToInject(tabs, [preset('a')])).toEqual([1]);
  });

  it('matches subdomain wildcards', () => {
    const tabs = [{ id: 7, url: 'https://app.b.com/x' }];
    expect(tabsToInject(tabs, [preset('b', { domains: ['*.b.com'] })])).toEqual([7]);
  });

  it('ignores tabs that match only disabled presets', () => {
    const tabs = [{ id: 1, url: 'https://a.com/' }];
    expect(tabsToInject(tabs, [preset('a', { enabled: false })])).toEqual([]);
  });

  it('skips tabs without an id or url, and invalid urls', () => {
    const tabs = [
      { url: 'https://a.com/' },
      { id: 2 },
      { id: 3, url: 'not a url' },
      { id: 4, url: 'https://a.com/ok' },
    ];
    expect(tabsToInject(tabs, [preset('a')])).toEqual([4]);
  });

  it('returns nothing when no presets are enabled', () => {
    const tabs = [{ id: 1, url: 'https://a.com/' }];
    expect(tabsToInject(tabs, [])).toEqual([]);
  });
});
