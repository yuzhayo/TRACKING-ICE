<script lang="ts">
  import { box, paint } from './lib/layout.svelte'
  import CheckReportTableDetail from './check-report-table-detail.svelte'
  import type { BAReport } from './lib/reports'

  let {
    path = 'checkReport.table',
    reports = [],
    month = '',
    expandedBA = '',
    onToggle = (_ba: string) => {}
  }: {
    path?: string
    reports: BAReport[]
    month?: string
    expandedBA?: string
    onToggle?: (ba: string) => void
  } = $props()
</script>

<div class="check-report-table" class:table-expanded={!!expandedBA} style={box(path) + paint(path)}>
  {#if reports.length === 0}
    <p class="empty-state">Daftar BA belum termuat.</p>
  {:else}
    <div class="ba-list" class:ba-list-expanded={!!expandedBA}>
      {#each reports as r (r.ba)}
        {#if !expandedBA || expandedBA === r.ba}
          <CheckReportTableDetail
            report={r}
            month={month}
            expanded={expandedBA === r.ba}
            onToggle={() => onToggle(r.ba)}
          />
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .check-report-table {
    position: absolute;
    container-type: size;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    background: var(--fill);
  }

  .check-report-table.table-expanded {
    overflow: hidden;
  }

  .ba-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.2cqi;
    padding: 1.2cqi;
    box-sizing: border-box;
  }

  .ba-list-expanded {
    flex: 1;
    min-height: 0;
    gap: 0;
    padding: 0;
  }

  .empty-state {
    margin: 0;
    padding: 8cqi 4cqi;
    color: #94a3b8;
    font-size: 4cqi;
    text-align: center;
  }
</style>
