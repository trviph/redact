<script lang="ts">
  import type { Preset } from '../../src/core/types';
  import { t } from '../../src/i18n';
  import { getPresets, savePreset, deletePreset, setPresetEnabled } from '../../src/core/storage';
  import { ensureHostPermissions } from '../../src/core/permissions';
  import { newPreset } from '../../src/core/factory';
  import { parseEditorTarget } from '../../src/ui/route';
  import PresetList from '../../src/ui/PresetList.svelte';
  import PresetEditor from '../../src/ui/PresetEditor.svelte';
  import LanguageSwitcher from '../../src/ui/LanguageSwitcher.svelte';
  import '../../src/ui/brutalism.css';

  let presets = $state<Preset[]>([]);
  // The preset currently being edited; null means the list view.
  let editing = $state<Preset | null>(null);
  let isNew = $state(false);

  async function load(): Promise<Preset[]> {
    presets = await getPresets();
    return presets;
  }

  // Resolve the initial view from the URL the popup deep-linked to.
  async function init() {
    const loaded = await load();
    const target = parseEditorTarget(location.search);
    if (target.mode === 'new') {
      editing = newPreset();
      isNew = true;
    } else if (target.mode === 'edit') {
      const found = loaded.find((preset) => preset.id === target.id);
      if (found) editing = $state.snapshot(found) as Preset;
    }
  }
  void init();

  function openNew() {
    editing = newPreset();
    isNew = true;
  }

  function openEdit(id: string) {
    const found = presets.find((preset) => preset.id === id);
    if (found) {
      editing = $state.snapshot(found) as Preset;
      isNew = false;
    }
  }

  function backToList() {
    editing = null;
    isNew = false;
  }

  async function save() {
    if (!editing) return;
    const draft = $state.snapshot(editing) as Preset;
    await ensureHostPermissions(draft.domains);
    await savePreset(draft);
    await load();
    backToList();
  }

  async function remove() {
    if (editing && !isNew) {
      await deletePreset(editing.id);
      await load();
    }
    backToList();
  }

  async function toggle(preset: Preset) {
    await setPresetEnabled(preset.id, !preset.enabled);
    await load();
  }
</script>

<main>
  <header>
    <h1>{editing ? $t(isNew ? 'editor.newTitle' : 'editor.editTitle') : $t('list.title')}</h1>
    <LanguageSwitcher />
  </header>

  {#if editing}
    <div class="editor-actions">
      <button class="b-btn" onclick={backToList}>← {$t('editor.back')}</button>
      {#if !isNew}
        <button class="b-btn delete" onclick={remove}>{$t('preset.delete')}</button>
      {/if}
    </div>
    <div class="b-card editor-card">
      <PresetEditor preset={editing} onSave={save} onCancel={backToList} />
    </div>
  {:else}
    <PresetList {presets} onToggle={toggle} onEdit={openEdit} onAdd={openNew} />
  {/if}
</main>

<style>
  main {
    max-width: 760px;
    margin: 0 auto;
    padding: 28px 20px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }
  h1 {
    font-size: 26px;
    font-weight: 900;
    margin: 0;
  }
  .editor-actions {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .delete {
    background: var(--b-pink);
  }
  .editor-card {
    padding: 18px;
  }
</style>
