<script lang="ts">
  import { daysInMonth, formatRp, monthLabel, type BAReport, type ReportRow } from './lib/reports'

  let {
    report = null,
    month = '',
    expanded = false,
    onToggle = () => {}
  }: {
    report: BAReport | null
    month?: string
    expanded?: boolean
    onToggle?: () => void
  } = $props()

  const total = $derived(report?.total ?? 0)
  const baName = $derived(report?.ba ?? '')
  const days = $derived(month ? daysInMonth(month) : [])
  const byDay = $derived(report?.byDay ?? new Map<string, ReportRow[]>())

  function rowsFor(dayKey: string): ReportRow[] {
    return byDay.get(dayKey) ?? []
  }
</script>

{#if report}
  <div class="check-report-detail" class:detail-expanded={expanded}>
    <button class="ba-row" type="button" aria-expanded={expanded} aria-label={baName} onclick={onToggle}>
      <span class="ba-name">{baName}</span>
      <span class="ba-total">{formatRp(total)}</span>
    </button>

    {#if expanded}
      <div class="child-scroll">
        <ul class="child-list">
          {#each days as d (d.key)}
            {@const entries = rowsFor(d.key)}
            {@const dayTotal = entries.reduce((a, r) => a + r.nominal, 0)}
            <li class="child-row" class:empty={entries.length === 0}>
              <span class="c-date">{d.label} {monthLabel(month)}</span>
              <span class="c-amount">{formatRp(dayTotal)}</span>
            </li>
          {/each}
          <li class="child-row empty child-row-extra" aria-hidden="true">
            <span class="c-date"></span>
            <span class="c-amount c-amount-transparent">{formatRp(0)}</span>
            <span class="extra-divider"></span>
          </li>
        </ul>
      </div>
    {/if}
  </div>
{/if}

<style>
  .check-report-detail {
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    border-bottom: 0.3cqi solid rgba(226, 232, 240, 0.08);
  }

  .check-report-detail.detail-expanded {
    flex: 1;
    min-height: 0;
    height: 100%;
  }

  .ba-row {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 3cqi;
    width: 100%;
    box-sizing: border-box;
    padding: 2% 5%;
    border: 0;
    border-bottom: 0.5cqi solid var(--line);
    background-color: #0f172a;
    background-image: url('/utx_base_info_header02.png');
    background-position: center center;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    color: #e2e8f0;
    font: inherit;
    text-align: left;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .ba-name {
    position: relative;
    z-index: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    height: 100%;
    font-size: 3.6cqi;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }

  .ba-total {
    position: relative;
    z-index: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    height: 100%;
    font-size: 3.6cqi;
    font-weight: 800;
    color: #fbbf24;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    line-height: 1.2;
  }

  .check-report-detail.detail-expanded .ba-row {
    position: sticky;
    top: 0;
    z-index: 5;
  }

  .child-scroll {
    display: flex;
    flex-direction: column;
    max-height: 300px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    background: #0b1120;
  }

  .check-report-detail.detail-expanded .child-scroll {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none;
    overflow: hidden;
  }

  .check-report-detail.detail-expanded .child-list {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .check-report-detail.detail-expanded .child-row {
    flex: 1 1 auto;
    min-height: 0;
  }

  .child-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .child-row {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 2%;
    padding: 1% 4%;
    box-sizing: border-box;
    font-size: 3cqi;
    line-height: 1.15;
    border-bottom: 0.4cqi solid rgba(226, 232, 240, 0.06);
    font-variant-numeric: tabular-nums;
  }

  .child-row.empty {
    color: #475569;
  }

  .child-row-extra {
    position: relative;
  }

  .c-amount-transparent {
    color: transparent;
  }

  .extra-divider {
    position: absolute;
    inset: 0;
    z-index: 2;
    width: 100%;
    height: 100%;
    min-height: 0;
    pointer-events: none;
    background-image: url('/5_objects.png');
    background-position: center center;
    background-size: contain;
    background-repeat: no-repeat;
  }

  .c-date,
  .c-amount {
    display: flex;
    align-items: center;
    min-height: 1.2em;
  }

  .c-amount {
    justify-content: flex-end;
    text-align: right;
  }
</style>
