<script lang="ts">
  import type { Rule } from '../core/types';
  import { t } from '../i18n';

  // `rule` is the reactive object from the parent's list; mutating its fields
  // here updates the parent directly, so it does not need to be a bindable prop.
  let { rule, onRemove }: { rule: Rule; onRemove: () => void } = $props();
</script>

<div class="rule b-card">
  <input
    class="b-field selector"
    placeholder={$t('rule.selectorPlaceholder')}
    bind:value={rule.selector}
  />
  <select class="b-field type" bind:value={rule.selectorType} aria-label={$t('rule.selectorType')}>
    <option value="css">{$t('rule.typeCss')}</option>
    <option value="xpath">{$t('rule.typeXpath')}</option>
  </select>
  <input
    class="b-field description"
    placeholder={$t('rule.descriptionPlaceholder')}
    bind:value={rule.description}
  />
  <button type="button" class="b-btn" onclick={onRemove}>{$t('rule.remove')}</button>
</div>

<style>
  .rule {
    display: grid;
    grid-template-columns: 2fr auto 2fr auto;
    gap: 8px;
    align-items: center;
    padding: 10px;
  }
  .selector {
    font-family: ui-monospace, monospace;
  }
  .type {
    width: auto;
  }
</style>
