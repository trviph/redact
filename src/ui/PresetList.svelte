<script lang="ts">
  import type { Preset } from '../core/types';
  import { t } from '../i18n';
  import { hostMatchesAnyDomain } from '../core/domain-match';
  import { paginate } from './paginate';

  let {
    presets,
    currentHost = null,
    onToggle,
    onEdit,
    onAdd,
    pageSize = 10,
  }: {
    presets: Preset[];
    currentHost?: string | null;
    onToggle: (preset: Preset) => void;
    onEdit: (id: string) => void;
    onAdd: () => void;
    pageSize?: number;
  } = $props();

  let page = $state(1);

  function matches(preset: Preset): boolean {
    return currentHost !== null && currentHost !== '' && hostMatchesAnyDomain(currentHost, preset.domains);
  }

  // Presets matching the current site sort to the top so they land on page 1.
  const ordered = $derived(
    [...presets].sort((a, b) => Number(matches(b)) - Number(matches(a))),
  );
  const view = $derived(paginate(ordered, page, pageSize));
</script>

<div class="list">
  <div class="bar">
    <button class="b-btn b-btn--accent add" onclick={onAdd}>+ {$t('list.addPreset')}</button>
  </div>

  {#if presets.length === 0}
    <p class="empty b-card">{$t('list.empty')}</p>
  {:else}
    <ul>
      {#each view.items as preset (preset.id)}
        <li class="row b-card" class:active={matches(preset)}>
          <input
            type="checkbox"
            class="toggle"
            checked={preset.enabled}
            onchange={() => onToggle(preset)}
            aria-label={preset.name}
          />
          <button class="main" onclick={() => onEdit(preset.id)}>
            <span class="name">
              {preset.name || '—'}
              {#if matches(preset)}<span class="b-badge">{$t('list.activeHere')}</span>{/if}
            </span>
            <span class="domains">{preset.domains.join(', ')}</span>
          </button>
        </li>
      {/each}
    </ul>

    {#if view.pageCount > 1}
      <div class="pager">
        <button class="b-btn" disabled={view.page <= 1} onclick={() => (page = view.page - 1)}>
          {$t('list.prev')}
        </button>
        <span class="indicator">{$t('list.pageOf', { page: view.page, count: view.pageCount })}</span>
        <button class="b-btn" disabled={view.page >= view.pageCount} onclick={() => (page = view.page + 1)}>
          {$t('list.next')}
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .bar {
    display: flex;
  }
  .add {
    width: 100%;
  }
  .empty {
    padding: 16px;
    margin: 0;
    font-weight: 700;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .row {
    display: flex;
    align-items: stretch;
    gap: 10px;
    padding: 10px;
  }
  .row.active {
    background: var(--b-accent);
  }
  .toggle {
    width: 20px;
    height: 20px;
    align-self: center;
    flex: none;
  }
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: left;
    background: transparent;
    border: 0;
    padding: 0;
    font: inherit;
    cursor: pointer;
  }
  .name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 800;
  }
  .domains {
    font-size: 12px;
    color: #555;
    word-break: break-all;
  }
  .row.active .domains {
    color: #000;
  }
  .pager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .indicator {
    font-weight: 700;
    font-size: 13px;
  }
</style>
