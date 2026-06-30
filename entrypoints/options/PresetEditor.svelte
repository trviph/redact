<script lang="ts">
  import { untrack } from 'svelte';
  import type { Preset } from '../../src/core/types';
  import { t } from '../../src/i18n';
  import { newRule } from '../../src/core/factory';
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
    <input bind:value={preset.name} placeholder={$t('preset.namePlaceholder')} required />
  </label>

  <label>
    <span>{$t('preset.domains')}</span>
    <textarea bind:value={domainsText} rows="3"></textarea>
    <small>{$t('preset.domainsHint')}</small>
  </label>

  <label class="inline">
    <input type="checkbox" bind:checked={preset.enabled} />
    <span>{$t('preset.enabled')}</span>
  </label>

  <fieldset>
    <legend>{$t('preset.rules')}</legend>
    {#each preset.rules as rule (rule.id)}
      <RuleRow {rule} onRemove={() => removeRule(rule.id)} />
    {/each}
    <button type="button" onclick={addRule}>{$t('preset.addRule')}</button>
  </fieldset>

  <div class="actions">
    <button type="submit" class="primary">{$t('preset.save')}</button>
    <button type="button" onclick={onCancel}>{$t('preset.cancel')}</button>
  </div>
</form>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
  }
  label.inline {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
  input,
  textarea {
    padding: 6px 8px;
    font: inherit;
  }
  textarea {
    font-family: ui-monospace, monospace;
    resize: vertical;
  }
  small {
    color: #666;
  }
  fieldset {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 1px solid #eee;
    border-radius: 6px;
  }
  .actions {
    display: flex;
    gap: 8px;
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
