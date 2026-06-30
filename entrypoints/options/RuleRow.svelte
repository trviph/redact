<script lang="ts">
  import type { Rule } from '../../src/core/types';
  import { t } from '../../src/i18n';

  // `rule` is the reactive object from the parent's list; mutating its fields
  // here updates the parent directly, so it does not need to be a bindable prop.
  let { rule, onRemove }: { rule: Rule; onRemove: () => void } = $props();
</script>

<div class="rule">
  <input
    class="selector"
    placeholder={$t('rule.selectorPlaceholder')}
    bind:value={rule.selector}
  />
  <select bind:value={rule.selectorType} aria-label={$t('rule.selectorType')}>
    <option value="css">{$t('rule.typeCss')}</option>
    <option value="xpath">{$t('rule.typeXpath')}</option>
  </select>
  <input
    class="description"
    placeholder={$t('rule.descriptionPlaceholder')}
    bind:value={rule.description}
  />
  <button type="button" class="remove" onclick={onRemove}>{$t('rule.remove')}</button>
</div>

<style>
  .rule {
    display: grid;
    grid-template-columns: 2fr auto 2fr auto;
    gap: 8px;
    align-items: center;
  }
  input,
  select {
    padding: 6px 8px;
    font: inherit;
  }
  .selector {
    font-family: ui-monospace, monospace;
  }
  .remove {
    padding: 6px 10px;
  }
</style>
