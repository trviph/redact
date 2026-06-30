import { browser } from '#imports';
import { getPresets, watchPresets } from '../src/core/storage';
import { syncRegistrations } from '../src/core/registration';

export default defineBackground(() => {
  async function resync(): Promise<void> {
    await syncRegistrations(await getPresets());
  }

  // Registrations are ephemeral, so rebuild them on install and on every startup.
  browser.runtime.onInstalled.addListener(() => void resync());
  browser.runtime.onStartup.addListener(() => void resync());

  // Re-sync whenever presets change from the options or popup UI.
  watchPresets((presets) => void syncRegistrations(presets));
});
