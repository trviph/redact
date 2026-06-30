<script lang="ts">
  import { browser } from '#imports';
  import type { Preset } from '../../src/core/types';
  import { t } from '../../src/i18n';
  import { getPresets, setPresetEnabled } from '../../src/core/storage';
  import { openEditorTab } from '../../src/ui/open-editor';
  import PresetList from '../../src/ui/PresetList.svelte';
  import '../../src/ui/brutalism.css';

  let presets = $state<Preset[]>([]);
  let host = $state<string | null>(null);

  async function load() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    try {
      host = tab?.url ? new URL(tab.url).hostname : null;
    } catch {
      host = null;
    }
    presets = await getPresets();
  }
  void load();

  async function toggle(preset: Preset) {
    await setPresetEnabled(preset.id, !preset.enabled);
    await load();
  }
</script>

<main>
  <h1>{$t('popup.title')}</h1>
  <PresetList
    {presets}
    currentHost={host}
    onToggle={toggle}
    onEdit={(id) => openEditorTab(id)}
    onAdd={() => openEditorTab()}
  />
</main>

<style>
  main {
    width: 320px;
    padding: 14px;
  }
  h1 {
    font-size: 18px;
    font-weight: 900;
    margin: 0 0 12px;
  }
</style>
