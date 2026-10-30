<script lang="ts">
  import PopupPlaceholder from './popup-placeholder.svelte'
  import DateGrid from './date-grid.svelte'
  import { box, paint } from './lib/layout.svelte'
  import { t, s } from './lib/text.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'

  let {
    path = '',
    hidden = false,
    expanded = false,
    value = '',
    onSelect = () => {},
    onExpandedChange = () => {}
  }: {
    path?: string
    hidden?: boolean
    expanded?: boolean
    value?: string
    onSelect?: (dateKey: string) => void
    onExpandedChange?: (expanded: boolean) => void
  } = $props()
  const dateFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const displayDate = $derived(value
    ? dateFormat.format(new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10))))
    : t('calendar.prompt'))

  const ArtComp = $derived(renderFor(path))
  const artProps = $derived(propsFor(path))
</script>

<section class="calendar-placeholder" {hidden} aria-label="Calendar placeholder" style={box(path) + paint(path)}>
  {#if ArtComp}
    <div class="art-layer"><ArtComp {...artProps} /></div>
  {/if}
  <button
    class="calendar-trigger"
    type="button"
    aria-label="Pilih tanggal nota"
    aria-haspopup="dialog"
    aria-expanded={expanded}
    style={s('calendar')}
    onclick={() => onExpandedChange(true)}
  >{displayDate}</button>

  <PopupPlaceholder open={expanded && !hidden} onClose={() => onExpandedChange(false)}>
    {#if expanded}
      <DateGrid value={value} onSelect={(dateKey) => { onSelect(dateKey); onExpandedChange(false) }} />
    {/if}
  </PopupPlaceholder>
</section>

<style>
  .art-layer {
    position: absolute;
    inset: 0%;
    pointer-events: none;
    z-index: 0;
  }

  .calendar-placeholder {
    position: absolute;
    position: absolute;
    container-type: size;
  }

  .calendar-trigger {
    width: 100%;
    height: 100%;
    border: 0;
    padding: 0% 3%;
    background: var(--fill);
    color: #e2e8f0;
    box-shadow: inset 0 0 0 0.35cqi var(--line);
    font: inherit;
    cursor: pointer;
  }

  .calendar-trigger:focus-visible {
    outline: 0.4cqi solid #f8fafc;
    outline-offset: -0.8cqi;
  }
</style>
