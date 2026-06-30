<script lang="ts">
  import { browser } from '#imports';
  import type { Preset } from '../../src/core/types';
  import { t } from '../../src/i18n';
  import { getPresets, setPresetEnabled } from '../../src/core/storage';
  import { hostMatchesAnyDomain } from '../../src/core/domain-match';

  let host = $state('');
  let matching = $state<Preset[]>([]);

  async function load() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    try {
      host = tab?.url ? new URL(tab.url).hostname : '';
    } catch {
      host = '';
    }
    const presets = await getPresets();
    matching = presets.filter((preset) => host !== '' && hostMatchesAnyDomain(host, preset.domains));
  }
  void load();

  async function toggle(preset: Preset) {
    await setPresetEnabled(preset.id, !preset.enabled);
    await load();
  }

  function openOptions() {
    void browser.runtime.openOptionsPage();
  }
</script>

<main>
  <h1>{$t('popup.title')}</h1>

  {#if matching.length === 0}
    <p class="empty">{$t('popup.noPresetsForSite')}</p>
  {:else}
    <p class="host">{$t('popup.presetsForSite', { host })}</p>
    <ul>
      {#each matching as preset (preset.id)}
        <li>
          <label>
            <input type="checkbox" checked={preset.enabled} onchange={() => toggle(preset)} />
            <span>{preset.name}</span>
          </label>
        </li>
      {/each}
    </ul>
  {/if}

  <button onclick={openOptions}>{$t('popup.openOptions')}</button>
</main>

<style>
  main {
    width: 260px;
    padding: 14px;
    font: 14px/1.4 system-ui, -apple-system, sans-serif;
    color: #1e1e1e;
  }
  h1 {
    font-size: 16px;
    margin: 0 0 10px;
  }
  .empty,
  .host {
    color: #666;
    margin: 0 0 10px;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0 0 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  button {
    width: 100%;
    padding: 8px;
    font: inherit;
    cursor: pointer;
  }
</style>
