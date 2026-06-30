<script lang="ts">
  import type { Preset } from '../../src/core/types';
  import { t } from '../../src/i18n';
  import { getPresets, savePreset, deletePreset, setPresetEnabled } from '../../src/core/storage';
  import { ensureHostPermissions } from '../../src/core/permissions';
  import { newPreset } from '../../src/core/factory';
  import PresetEditor from './PresetEditor.svelte';
  import LanguageSwitcher from './LanguageSwitcher.svelte';

  let presets = $state<Preset[]>([]);
  let editing = $state<Preset | null>(null);

  async function load() {
    presets = await getPresets();
  }
  void load();

  function add() {
    editing = newPreset();
  }

  function edit(preset: Preset) {
    editing = $state.snapshot(preset) as Preset;
  }

  async function save() {
    if (!editing) return;
    const draft = $state.snapshot(editing) as Preset;
    await ensureHostPermissions(draft.domains);
    await savePreset(draft);
    editing = null;
    await load();
  }

  async function remove(id: string) {
    await deletePreset(id);
    await load();
  }

  async function toggle(preset: Preset) {
    await setPresetEnabled(preset.id, !preset.enabled);
    await load();
  }
</script>

<main>
  <header>
    <h1>{$t('options.title')}</h1>
    <LanguageSwitcher />
  </header>

  {#if editing}
    <PresetEditor bind:preset={editing} onSave={save} onCancel={() => (editing = null)} />
  {:else}
    <button class="primary" onclick={add}>{$t('options.addPreset')}</button>

    {#if presets.length === 0}
      <p class="empty">{$t('options.noPresets')}</p>
    {:else}
      <ul class="presets">
        {#each presets as preset (preset.id)}
          <li>
            <label class="toggle">
              <input
                type="checkbox"
                checked={preset.enabled}
                onchange={() => toggle(preset)}
              />
            </label>
            <div class="info">
              <strong>{preset.name}</strong>
              <span class="domains">{preset.domains.join(', ')}</span>
            </div>
            <button onclick={() => edit(preset)}>{$t('preset.edit')}</button>
            <button onclick={() => remove(preset.id)}>{$t('preset.delete')}</button>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 24px;
    font: 14px/1.5 system-ui, -apple-system, sans-serif;
    color: #1e1e1e;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  h1 {
    font-size: 20px;
    margin: 0;
  }
  .empty {
    color: #666;
  }
  .presets {
    list-style: none;
    padding: 0;
    margin: 16px 0 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .presets li {
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 12px;
  }
  .info {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .domains {
    color: #666;
    font-size: 13px;
  }
  button {
    padding: 8px 14px;
    font: inherit;
    cursor: pointer;
  }
  .primary {
    background: #1e1e1e;
    color: #fff;
    border: none;
    border-radius: 6px;
  }
</style>
