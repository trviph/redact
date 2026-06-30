<script lang="ts">
  import { untrack } from 'svelte';
  import type { Preset } from '../core/types';
  import { t } from '../i18n';
  import { newRule } from '../core/factory';
  import RuleRow from './RuleRow.svelte';

  let { preset, onSave, onCancel }: { preset: Preset; onSave: () => void; onCancel: () => void } =
    $props();

  // Domains are edited as newline-separated text, seeded once from the preset
  // and parsed back on save.
  let domainsText = $state(untrack(() => preset.domains.join('\n')));

  function save() {
    preset.domains = domainsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    onSave();
  }

  function addRule() {
    preset.rules = [...preset.rules, newRule()];
  }

  function removeRule(id: string) {
    preset.rules = preset.rules.filter((rule) => rule.id !== id);
  }
</script>

<form class="editor" onsubmit={(e) => (e.preventDefault(), save())}>
  <label>
    <span>{$t('preset.name')}</span>
    <input class="b-field" bind:value={preset.name} placeholder={$t('preset.namePlaceholder')} required />
  </label>

  <label>
    <span>{$t('preset.domains')}</span>
    <textarea class="b-field" bind:value={domainsText} rows="3"></textarea>
    <small>{$t('preset.domainsHint')}</small>
  </label>

  <label class="inline">
    <input type="checkbox" bind:checked={preset.enabled} />
    <span>{$t('preset.enabled')}</span>
  </label>

  <fieldset class="b-card">
    <legend>{$t('preset.rules')}</legend>
    {#each preset.rules as rule (rule.id)}
      <RuleRow {rule} onRemove={() => removeRule(rule.id)} />
    {/each}
    <button type="button" class="b-btn" onclick={addRule}>{$t('preset.addRule')}</button>
  </fieldset>

  <div class="actions">
    <button type="submit" class="b-btn b-btn--accent">{$t('preset.save')}</button>
    <button type="button" class="b-btn" onclick={onCancel}>{$t('preset.cancel')}</button>
  </div>
</form>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-weight: 700;
  }
  label.inline {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
  textarea {
    font-family: ui-monospace, monospace;
    resize: vertical;
  }
  small {
    font-weight: 400;
    color: #555;
  }
  fieldset {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
  }
  legend {
    font-weight: 800;
    padding: 0 6px;
  }
  .actions {
    display: flex;
    gap: 8px;
  }
</style>
