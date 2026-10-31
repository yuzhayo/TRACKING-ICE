<script lang="ts">
  import { list, s } from './lib/text.svelte'
  import { box, paint } from './lib/layout.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'

  /* The date grid. It is three bands, and every band is a box in
     public/layout.json with art of its own in public/content.json:

       calendar.grid          the whole grid
       calendar.grid.title    the month row   (< Oktober 2026 >)
       calendar.grid.weekday  the weekday row (Sen ... Min)
       calendar.grid.day      the 42-cell area

     Every face carries position: relative + z-index 1, because a positioned art
     layer paints over a static sibling - that is what hid "PILIH TANGGAL". */

  let {
    path = 'calendar.grid',
    value = '',
    onSelect
  }: {
    path?: string
    value?: string
    onSelect: (date: string) => void
  } = $props()

  const gridPath = $derived(path)
  const titlePath = $derived(`${path}.title`)
  const weekdayPath = $derived(`${path}.weekday`)
  const dayPath = $derived(`${path}.day`)

  const GridArt = $derived(renderFor(gridPath))
  const gridProps = $derived(propsFor(gridPath))
  const TitleArt = $derived(renderFor(titlePath))
  const titleProps = $derived(propsFor(titlePath))
  const WeekdayArt = $derived(renderFor(weekdayPath))
  const weekdayProps = $derived(propsFor(weekdayPath))
  const DayArt = $derived(renderFor(dayPath))
  const dayProps = $derived(propsFor(dayPath))

  const weekdays = list('calendar.grid.weekdays')
  const monthFormat = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })
  const dayFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function initialMonth() {
    const [year, month] = value.split('-').map(Number)
    return value ? new Date(year, month - 1, 1) : new Date(today.getFullYear(), today.getMonth(), 1)
  }

  function dateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  let month = $state(initialMonth())
  const firstWeekday = $derived((month.getDay() + 6) % 7)
  const daysInMonth = $derived(new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate())
  const days = $derived(Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1
    return day > 0 && day <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), day) : null
  }))
  const nextMonth = $derived(new Date(month.getFullYear(), month.getMonth() + 1, 1))

  function moveMonth(offset: number) {
    month = new Date(month.getFullYear(), month.getMonth() + offset, 1)
  }
</script>

<section class="date-grid" aria-label="Pilih tanggal nota" style={box(gridPath) + paint(gridPath)}>
  {#if GridArt}
    <div class="art-layer"><GridArt {...gridProps} /></div>
  {/if}

  <div class="cal-title" style={box(titlePath)}>
    {#if TitleArt}
      <div class="art-layer"><TitleArt {...titleProps} /></div>
    {/if}
    <button type="button" aria-label="Bulan sebelumnya" onclick={() => moveMonth(-1)}>&lt;</button>
    <h3 aria-live="polite" style={s(titlePath)}>{monthFormat.format(month)}</h3>
    <button type="button" aria-label="Bulan berikutnya" disabled={nextMonth > today} onclick={() => moveMonth(1)}>&gt;</button>
  </div>

  <div class="cal-weekday" style={box(weekdayPath)}>
    {#if WeekdayArt}
      <div class="art-layer"><WeekdayArt {...weekdayProps} /></div>
    {/if}
    {#each weekdays as weekday}
      <span class="weekday-cell" style={s(weekdayPath)}>{weekday}</span>
    {/each}
  </div>

  <div class="cal-days" style={box(dayPath)}>
    {#if DayArt}
      <div class="art-layer"><DayArt {...dayProps} /></div>
    {/if}
    {#each days as day}
      {#if day}
        <button
          type="button"
          class:selected={dateKey(day) === value}
          style={s(dayPath)}
          aria-label={dayFormat.format(day)}
          aria-pressed={dateKey(day) === value}
          aria-current={dateKey(day) === dateKey(today) ? 'date' : undefined}
          disabled={day > today}
          onclick={() => onSelect(dateKey(day))}
        >{day.getDate()}</button>
      {:else}
        <span class="day-empty" aria-hidden="true"></span>
      {/if}
    {/each}
  </div>
</section>

<style>
  .date-grid {
    position: absolute;
    container-type: size;
  }

  /* Every band is absolutely positioned, because that is what makes the left/top
     from box() take effect - on a static element those two are ignored. */
  .cal-title {
    position: absolute;
    display: grid;
    grid-template-columns: 15% 70% 15%;
    align-items: center;
  }

  h3 {
    position: relative;
    z-index: 1;
    margin: 0;
    text-align: center;
    font-weight: 600;
  }

  .cal-weekday {
    position: absolute;
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    align-items: center;
  }

  .weekday-cell {
    position: relative;
    z-index: 1;
    text-align: center;
    color: #94a3b8;
  }

  .cal-days {
    position: absolute;
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    grid-template-rows: repeat(6, minmax(0, 1fr));
    gap: 1%;
  }

  button {
    position: relative;
    z-index: 1;
    min-width: 0;
    border: 0;
    padding: 0;
    background: #172a39;
    color: #e2e8f0;
    font: inherit;
    box-shadow: inset 0 0 0 0.15cqi #3d6680;
    cursor: pointer;
    touch-action: manipulation;
  }

  .cal-title button {
    width: 85%;
    height: 80%;
    justify-self: center;
  }

  button[aria-current='date'] {
    color: #67e8f9;
    box-shadow: inset 0 0 0 0.3cqi #67e8f9;
  }

  button.selected {
    background: #0e7490;
    color: #ffffff;
  }

  button:disabled {
    opacity: 0.3;
    cursor: default;
  }

  button:focus-visible {
    outline: 0.4cqi solid #f8fafc;
    outline-offset: -0.4cqi;
  }

  .art-layer {
    position: absolute;
    inset: 0%;
    pointer-events: none;
    z-index: 0;
  }
</style>
