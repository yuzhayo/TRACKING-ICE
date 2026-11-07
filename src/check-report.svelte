<script lang="ts">
  import { untrack } from 'svelte'
  import { box, paint } from './lib/layout.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'
  import { t } from './lib/text.svelte'
  import {
    loadReports,
    availableMonths,
    aggregate,
    readReportsCache
  } from './lib/reports'
  import CheckReportHeader from './check-report-header.svelte'
  import CheckReportTable from './check-report-table.svelte'
  import type { ReportRow } from './lib/reports'

  let {
    path = 'checkReport',
    open = false,
    cfg = null,
    roster = [],
    onClose = () => {}
  }: {
    path?: string
    open?: boolean
    cfg?: { apiUrl: string; token: string } | null
    roster?: string[]
    onClose?: () => void
  } = $props()

  const ArtComp = $derived(renderFor(path))
  const artProps = $derived(propsFor(path))
  // Base is a solid box (placeholder color via paint()), not an image render.
  // The art keeps working if content.json ever points at an image again.

  let rows = $state<ReportRow[]>([])
  let loaded = $state(false)

  function monthOptions(list: ReportRow[]): string[] {
    // Only months that actually appear in jawaban (+ current month as fallback
    // before any data arrives). No forced previous month.
    const dataMonths = availableMonths(list)
    if (dataMonths.length === 0) {
      const now = new Date()
      return [`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`]
    }
    return [...dataMonths].sort().reverse()
  }

  const now = new Date()
  let month = $state(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  let months = $state<string[]>(monthOptions([]))
  let expandedBA = $state('')

  const reports = $derived(aggregate(rows, month, roster))
  const monthTotal = $derived(reports.reduce((a, r) => a + r.total, 0))

  async function boot() {
    const cached = readReportsCache()
    if (cached) {
      rows = cached
      months = monthOptions(cached)
      if (!months.includes(month)) month = months[0] ?? month
      loaded = true
    } else {
      loaded = false
    }
    if (!cfg) {
      loaded = true
      return
    }
    try {
      const fresh = await loadReports(cfg.apiUrl, cfg.token)
      rows = fresh
      months = monthOptions(fresh)
      if (!months.includes(month)) month = months[0] ?? month
      loaded = true
    } catch {
      loaded = true
    }
  }

  $effect(() => {
    if (open) untrack(() => void boot())
  })

  $effect(() => {
    if (!open) untrack(() => (expandedBA = ''))
  })

  function toggle(ba: string) {
    expandedBA = expandedBA === ba ? '' : ba
  }

</script>

{#if open}
  <div class="check-report" role="dialog" aria-modal="true" aria-label={t('checkReport.header.title') ?? 'Check hasil input'} style={box(path) + paint(path)}>
    {#if ArtComp}
      <div class="art-layer"><ArtComp {...artProps} /></div>
    {/if}
    <CheckReportHeader
      path={`${path}.header`}
      months={months}
      month={month}
      total={monthTotal}
      onMonth={(m) => (month = m)}
      onClose={onClose}
    />
    <CheckReportTable
      path={`${path}.table`}
      reports={reports}
      month={month}
      expandedBA={expandedBA}
      onToggle={toggle}
    />
  </div>
{/if}

<style>
  .check-report {
    position: absolute;
    inset: 0;
    z-index: 30;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    background: var(--fill);
    color: #e2e8f0;
    overflow: hidden;
  }

  .check-report > :global(.check-report-header) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 8%;
    z-index: 5;
  }

  .check-report > :global(.check-report-table) {
    position: absolute;
    top: 8%;
    left: 0;
    width: 100%;
    height: 92%;
    z-index: 1;
  }

  .art-layer {
    position: absolute;
    inset: 0%;
    pointer-events: none;
    z-index: 0;
  }
</style>
