import { describe, it, expect } from 'vitest';
import {
  toMatchPatterns,
  domainsToMatchPatterns,
  hostMatchesDomain,
  hostMatchesAnyDomain,
} from './domain-match';

describe('toMatchPatterns', () => {
  it('maps an exact domain to a single host pattern', () => {
    expect(toMatchPatterns('example.com')).toEqual(['*://example.com/*']);
  });

  it('maps a subdomain wildcard to a single *. pattern', () => {
    expect(toMatchPatterns('*.example.com')).toEqual(['*://*.example.com/*']);
  });

  it('maps the catch-all wildcard to an all-hosts pattern', () => {
    expect(toMatchPatterns('*')).toEqual(['*://*/*']);
  });

  it('normalizes case, whitespace, scheme, and trailing path', () => {
    expect(toMatchPatterns('  HTTPS://Example.com/  ')).toEqual(['*://example.com/*']);
  });

  it('returns no patterns for an empty or blank domain', () => {
    expect(toMatchPatterns('')).toEqual([]);
    expect(toMatchPatterns('   ')).toEqual([]);
  });
});

describe('domainsToMatchPatterns', () => {
  it('flattens and deduplicates patterns across domains', () => {
    expect(
      domainsToMatchPatterns(['example.com', 'example.com', '*.app.com']),
    ).toEqual(['*://example.com/*', '*://*.app.com/*']);
  });

  it('skips blank entries', () => {
    expect(domainsToMatchPatterns(['example.com', '', '  '])).toEqual([
      '*://example.com/*',
    ]);
  });
});

describe('hostMatchesDomain', () => {
  it('matches an exact host', () => {
    expect(hostMatchesDomain('example.com', 'example.com')).toBe(true);
  });

  it('does not treat an exact domain as a subdomain wildcard', () => {
    expect(hostMatchesDomain('www.example.com', 'example.com')).toBe(false);
  });

  it('is case insensitive', () => {
    expect(hostMatchesDomain('Example.COM', 'example.com')).toBe(true);
  });

  it('matches the base domain for a subdomain wildcard', () => {
    expect(hostMatchesDomain('app.com', '*.app.com')).toBe(true);
  });

  it('matches any depth of subdomain for a subdomain wildcard', () => {
    expect(hostMatchesDomain('a.b.app.com', '*.app.com')).toBe(true);
  });

  it('does not match a different base for a subdomain wildcard', () => {
    expect(hostMatchesDomain('notapp.com', '*.app.com')).toBe(false);
    expect(hostMatchesDomain('evil-app.com', '*.app.com')).toBe(false);
  });

  it('matches everything for the catch-all wildcard', () => {
    expect(hostMatchesDomain('anything.test', '*')).toBe(true);
  });
});

describe('hostMatchesAnyDomain', () => {
  it('is true when at least one domain matches', () => {
    expect(hostMatchesAnyDomain('www.app.com', ['example.com', '*.app.com'])).toBe(true);
  });

  it('is false when none match', () => {
    expect(hostMatchesAnyDomain('other.com', ['example.com', '*.app.com'])).toBe(false);
  });
});
