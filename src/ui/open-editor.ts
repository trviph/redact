import { browser } from '#imports';

/** Opens the full-page preset editor in a new tab (blank when no id). */
export function openEditorTab(id?: string): void {
  const base = browser.runtime.getURL('/options.html');
  const url = id ? `${base}?edit=${encodeURIComponent(id)}` : `${base}?new`;
  void browser.tabs.create({ url });
}
