import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { fakeBrowser } from 'wxt/testing';
import { browser } from '#imports';
import { en } from './messages/en';
import { vi as viCatalog } from './messages/vi';
import {
  translate,
  resolveLocale,
  catalogs,
  SUPPORTED_LOCALES,
  locale,
  t,
  initLocale,
  setLocale,
} from './index';

describe('translate', () => {
  it('returns a plain message unchanged', () => {
    expect(translate(en, 'preset.save')).toBe('Save');
  });

  it('interpolates named placeholders', () => {
    expect(translate(en, 'list.pageOf', { page: 2, count: 5 })).toBe('Page 2 of 5');
  });

  it('leaves a placeholder literal when no value is provided', () => {
    expect(translate(en, 'list.pageOf', { page: 2 })).toBe('Page 2 of {count}');
  });
});

describe('resolveLocale', () => {
  it('maps a regional code to its base locale', () => {
    expect(resolveLocale('vi-VN')).toBe('vi');
    expect(resolveLocale('en-US')).toBe('en');
  });

  it('falls back to the default for unsupported languages', () => {
    expect(resolveLocale('fr-FR')).toBe('en');
    expect(resolveLocale('')).toBe('en');
  });
});

describe('catalogs', () => {
  it('every supported locale has a catalog', () => {
    for (const code of SUPPORTED_LOCALES) {
      expect(catalogs[code]).toBeDefined();
    }
  });

  it('the Vietnamese catalog has exactly the English keys', () => {
    expect(Object.keys(viCatalog).sort()).toEqual(Object.keys(en).sort());
  });
});

describe('locale store', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    locale.set('en');
  });

  it('binds the translator to the active locale', () => {
    setLocale('vi');
    expect(get(t)('preset.save')).toBe(viCatalog['preset.save']);
  });

  it('persists the chosen locale', async () => {
    await setLocale('vi');
    locale.set('en');
    await initLocale();
    expect(get(locale)).toBe('vi');
  });

  it('falls back to the browser UI language when nothing is saved', async () => {
    browser.i18n.getUILanguage = vi.fn().mockReturnValue('vi-VN');
    await initLocale();
    expect(get(locale)).toBe('vi');
  });
});
