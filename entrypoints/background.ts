import { browser } from '#imports';
import { getPresets, watchPresets } from '../src/core/storage';
import { syncRegistrations } from '../src/core/registration';
import { ensureInjected } from '../src/core/injection';

export default defineBackground(() => {
  async function resync(): Promise<void> {
    await syncRegistrations(await getPresets());
  }

  // Registrations are ephemeral, so rebuild them on install and on every startup.
  browser.runtime.onInstalled.addListener(() => void resync());
  browser.runtime.onStartup.addListener(() => void resync());

  // On any preset change: update registrations for future loads, and update
  // already-open matching tabs in place so toggles take effect without a reload.
  watchPresets((presets) => {
    void syncRegistrations(presets);
    void ensureInjected(presets);
  });
});
