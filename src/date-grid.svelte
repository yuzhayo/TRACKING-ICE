<script lang="ts">
  import { list, s } from './lib/text.svelte'

  let { value = '', onSelect }: {
    value?: string
    onSelect: (date: string) => void
  } = $props()

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

<section class="date-grid" aria-label="Pilih tanggal nota">
  <div class="month-navigation">
    <button type="button" aria-label="Bulan sebelumnya" onclick={() => moveMonth(-1)}>&lt;</button>
    <h3 aria-live="polite" style={s('calendar.grid.title')}>{monthFormat.format(month)}</h3>
    <button type="button" aria-label="Bulan berikutnya" disabled={nextMonth > today} onclick={() => moveMonth(1)}>&gt;</button>
  </div>

  <div class="days">
    {#each weekdays as weekday}
      <span class="weekday" style={s('calendar.grid.weekday')} aria-hidden="true">{weekday}</span>
    {/each}
    {#each days as day}
      {#if day}
        <button
          type="button"
          class:selected={dateKey(day) === value}
          style={s('calendar.grid.day')}
          aria-label={dayFormat.format(day)}
          aria-pressed={dateKey(day) === value}
          aria-current={dateKey(day) === dateKey(today) ? 'date' : undefined}
          disabled={day > today}
          onclick={() => onSelect(dateKey(day))}
        >{day.getDate()}</button>
      {:else}
        <span aria-hidden="true"></span>
      {/if}
    {/each}
  </div>
</section>

<style>
  .date-grid {
    container-type: size;
    display: grid;
    grid-template-rows: 14% 86%;
    width: 100%;
    height: 100%;
  }

  .month-navigation {
    display: grid;
    grid-template-columns: 15% 70% 15%;
    align-items: center;
  }

  h3 {
    margin: 0;
    text-align: center;
    font-weight: 600;
  }

  .days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    grid-template-rows: repeat(7, minmax(0, 1fr));
    gap: 1%;
    min-height: 0;
  }

  .weekday {
    display: grid;
    place-items: center;
    color: #94a3b8;
  }

  button {
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

  .month-navigation button {
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
</style>
