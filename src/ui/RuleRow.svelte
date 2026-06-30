<script lang="ts">
  import type { Rule } from '../core/types';
  import { t } from '../i18n';

  // `rule` is the reactive object from the parent's list; mutating its fields
  // here updates the parent directly, so it does not need to be a bindable prop.
  let { rule, onRemove }: { rule: Rule; onRemove: () => void } = $props();
</script>

<div class="rule b-card">
  <div class="fields">
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

  <div class="media">
    <span class="media-label">{$t('rule.media')}</span>
    <label><input type="checkbox" bind:group={rule.media} value="image" /> {$t('rule.mediaImages')}</label>
    <label><input type="checkbox" bind:group={rule.media} value="video" /> {$t('rule.mediaVideo')}</label>
    <label><input type="checkbox" bind:group={rule.media} value="embed" /> {$t('rule.mediaEmbeds')}</label>
  </div>
</div>

<style>
  .rule {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }
  .fields {
    display: grid;
    grid-template-columns: 2fr auto 2fr auto;
    gap: 8px;
    align-items: center;
  }
  .selector {
    font-family: ui-monospace, monospace;
  }
  .type {
    width: auto;
  }
  .media {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    font-weight: 700;
  }
  .media label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
  }
  .media-label {
    color: #555;
  }
</style>
