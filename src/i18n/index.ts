import { writable, derived } from 'svelte/store';
import { storage, browser } from '#imports';
import { en } from './messages/en';
import { vi } from './messages/vi';
import type { Messages, MessageKey } from './messages/en';

export type Locale = 'en' | 'vi';
export type TranslateParams = Record<string, string | number>;

export const SUPPORTED_LOCALES: Locale[] = ['en', 'vi'];
export const DEFAULT_LOCALE: Locale = 'en';
export const catalogs: Record<Locale, Messages> = { en, vi };

/** Looks up a message and fills in `{name}` placeholders from params. */
export function translate(catalog: Messages, key: MessageKey, params: TranslateParams = {}): string {
  return catalog[key].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}

/** Picks the best supported locale for a browser UI language like "vi-VN". */
export function resolveLocale(uiLanguage: string): Locale {
  const base = uiLanguage.toLowerCase().split('-')[0];
  return SUPPORTED_LOCALES.find((code) => code === base) ?? DEFAULT_LOCALE;
}

const localeItem = storage.defineItem<Locale | null>('local:locale', { fallback: null });

/** The active UI locale. */
export const locale = writable<Locale>(DEFAULT_LOCALE);

/** A translator bound to the active locale, for use in components: `$t('app.name')`. */
export const t = derived(locale, ($locale) => {
  const catalog = catalogs[$locale];
  return (key: MessageKey, params?: TranslateParams) => translate(catalog, key, params);
});

/** Loads the saved locale, or falls back to the browser UI language. */
export async function initLocale(): Promise<void> {
  const saved = await localeItem.getValue();
  locale.set(saved ?? resolveLocale(browser.i18n.getUILanguage()));
}

/** Switches locale and persists the choice. */
export async function setLocale(next: Locale): Promise<void> {
  locale.set(next);
  await localeItem.setValue(next);
}
