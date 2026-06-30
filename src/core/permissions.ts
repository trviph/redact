import { browser } from '#imports';
import { domainsToMatchPatterns } from './domain-match';

/**
 * Requests the host permissions needed to inject into the given domains. Must be
 * called from a user gesture (e.g. a Save click). Resolves true when the
 * permissions are granted (or none were needed).
 */
export async function ensureHostPermissions(domains: string[]): Promise<boolean> {
  const origins = domainsToMatchPatterns(domains);
  if (origins.length === 0) return true;
  return browser.permissions.request({ origins });
}
