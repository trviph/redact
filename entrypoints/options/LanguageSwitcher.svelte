<script lang="ts">
  import { t, locale, setLocale, SUPPORTED_LOCALES, type Locale } from '../../src/i18n';

  const labels: Record<Locale, string> = { en: 'English', vi: 'Tiếng Việt' };

  function change(event: Event) {
    void setLocale((event.currentTarget as HTMLSelectElement).value as Locale);
  }
</script>

<label class="language">
  <span>{$t('options.language')}</span>
  <select value={$locale} onchange={change}>
    {#each SUPPORTED_LOCALES as code (code)}
      <option value={code}>{labels[code]}</option>
    {/each}
  </select>
</label>

<style>
  .language {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  select {
    padding: 4px 8px;
  }
</style>
