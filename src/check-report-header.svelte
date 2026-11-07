<script lang="ts">
  import { box, paint } from './lib/layout.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'
  import { t, s } from './lib/text.svelte'
  import { formatRp, monthLabel } from './lib/reports'

  let {
    path = 'checkReport.header',
    months = [],
    month = '',
    total = 0,
    onMonth = (_m: string) => {},
    onClose = () => {}
  }: {
    path?: string
    months?: string[]
    month?: string
    total?: number
    onMonth?: (m: string) => void
    onClose?: () => void
  } = $props()

  const ArtComp = $derived(renderFor(path))
  const artProps = $derived(propsFor(path))
  const MonthComp = $derived(renderFor(`${path}.month`))
  const CloseComp = $derived(renderFor(`${path}.close`))

  function monthName(key: string): string {
    return monthLabel(key).replace(/\s\d{4}$/, '').toUpperCase() || key.toUpperCase()
  }
</script>

<header class="check-report-header" style={box(path) + paint(path)}>
  {#if ArtComp}
    <div class="art-layer"><ArtComp {...artProps} /></div>
  {/if}
  <div class="month-wrap">
    {#if MonthComp}
      <MonthComp label={monthName(month)} textStyle={s(`${path}.month`)} onClick={() => {}} />
    {/if}
    <select class="month-select" aria-label={t('checkReport.header.month') ?? 'Bulan'} bind:value={month} onchange={() => onMonth(month)}>
      {#if months.length === 0}
        <option value="">{monthName(month)}</option>
      {:else}
        {#each months as m (m)}
          <option value={m}>{monthName(m)}</option>
        {/each}
      {/if}
    </select>
  </div>
  <div class="sep" aria-hidden="true"></div>
  <div class="month-total" aria-label="Total bulan ini">{formatRp(total)}</div>
  <div class="close-slot">
    {#if CloseComp}
      <CloseComp label={t(`${path}.close`)} textStyle={s(`${path}.close`)} onClick={onClose} />
    {:else}
      <button class="close-fallback" type="button" aria-label={t('checkReport.header.close') ?? 'TUTUP'} onclick={onClose}>
        {t('checkReport.header.close') ?? 'TUTUP'}
      </button>
    {/if}
  </div>
</header>

<style>
  .check-report-header {
    position: absolute;
    container-type: size;
    display: flex;
    align-items: center;
    gap: 4cqi;
    padding: 2% 3%;
    box-sizing: border-box;
    background: var(--fill);
    border-bottom: 0.5cqi solid var(--line);
    z-index: 5;
  }

  .art-layer {
    position: absolute;
    inset: 0%;
    pointer-events: none;
    z-index: 0;
  }

  .month-wrap {
    position: relative;
    z-index: 1;
    flex: 0 0 auto;
    width: calc(9ch + 10cqw);
    max-width: 34%;
    height: 62%;
    align-self: center;
    display: flex;
  }

  .month-wrap :global(.btn) {
    flex: 1;
    pointer-events: none;
  }

  .month-select {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    opacity: 0;
    border: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .sep {
    position: relative;
    z-index: 1;
    flex: 0 0 auto;
    width: 2.5cqi;
    min-height: 60%;
    height: 80%;
    align-self: center;
    background-image: url('/utx_line_common_02.png');
    background-position: center center;
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }

  .month-total {
    position: relative;
    z-index: 1;
    flex: 1 1 auto;
    min-width: 0;
    text-align: left;
    font-size: 4.2cqi;
    font-weight: 800;
    color: #fbbf24;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.25;
  }

  .close-slot {
    position: relative;
    z-index: 1;
    flex: 0 0 18%;
    min-width: 0;
    height: 62%;
    align-self: center;
    display: flex;
  }

  .close-slot :global(.btn) {
    flex: 1;
  }

  .close-fallback {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    margin: 0;
    padding: 0 6cqw;
    border: 0.5cqi solid var(--line);
    border-radius: 1.5cqi;
    background: #0f172a;
    color: #e2e8f0;
    font-size: 3.6cqi;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
</style>
