/**
 * Domain matching: converts user-entered domains (with optional wildcards) into
 * WebExtension match patterns for content-script registration, and tests page
 * hostnames against those domains at runtime.
 *
 * Supported domain forms:
 *   - `example.com`   exact host only
 *   - `*.example.com` the base domain and any subdomain
 *   - `*`             any host
 */

/** Strips scheme, path, casing, and surrounding whitespace to a bare host. */
function normalize(domain: string): string {
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) return '';
  return trimmed.replace(/^[a-z]+:\/\//, '').replace(/\/.*$/, '');
}

/** Converts one domain into the match pattern(s) that cover it. */
export function toMatchPatterns(domain: string): string[] {
  const host = normalize(domain);
  if (!host) return [];
  if (host === '*') return ['*://*/*'];
  return [`*://${host}/*`];
}

/** Converts a list of domains into a deduplicated list of match patterns. */
export function domainsToMatchPatterns(domains: string[]): string[] {
  const patterns: string[] = [];
  for (const domain of domains) {
    for (const pattern of toMatchPatterns(domain)) {
      if (!patterns.includes(pattern)) patterns.push(pattern);
    }
  }
  return patterns;
}

/** Tests whether a page hostname is covered by a single configured domain. */
export function hostMatchesDomain(hostname: string, domain: string): boolean {
  const host = hostname.trim().toLowerCase();
  const target = normalize(domain);
  if (!host || !target) return false;
  if (target === '*') return true;
  if (target.startsWith('*.')) {
    const base = target.slice(2);
    return host === base || host.endsWith(`.${base}`);
  }
  return host === target;
}

/** Tests whether a page hostname is covered by any of the configured domains. */
export function hostMatchesAnyDomain(hostname: string, domains: string[]): boolean {
  return domains.some((domain) => hostMatchesDomain(hostname, domain));
}
