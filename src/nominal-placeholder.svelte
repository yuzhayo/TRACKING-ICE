<script lang="ts">
  import NumberPadPlaceholder from './number-pad-placeholder.svelte'
  import NominalWarningPopup from './nominal-warning-popup.svelte'
  import { box } from './lib/layout.svelte'

  let {
    path = '',
    hidden = false,
    expanded = false,
    value = '',
    max = 15000,
    onConfirm = () => {},
    onExpandedChange = () => {}
  }: {
    path?: string
    hidden?: boolean
    expanded?: boolean
    value?: string
    max?: number
    onConfirm?: (digits: string) => void
    onExpandedChange?: (expanded: boolean) => void
  } = $props()

  let draft = $state('')
  let warnOpen = $state(false)
  let wasOver = $state(false)

  const overLimit = $derived(draft !== '' && Number(draft) > max)

  $effect(() => {
    if (expanded && !hidden) {
      draft = value
      wasOver = value !== '' && Number(value) > max
    }
  })

  const group = (d: string) => d.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const collapsedLabel = $derived(value ? `Rp ${group(value)}` : 'SELECT NOMINAL')
  const displayAmount = $derived(draft ? `Rp ${group(draft)}` : 'Masukkan nominal')

  // Fire the warning once, on the step that pushes the value past the limit.
  function checkOver() {
    const over = draft !== '' && Number(draft) > max
    if (over && !wasOver) {
      warnOpen = true
      wasOver = true
    } else if (!over) {
      wasOver = false
    }
  }

  function appendDigit(digit: string) {
    if (draft === '0') draft = digit
    else if (draft.length < 12) draft += digit
    checkOver()
  }

  function deleteOne() {
    draft = draft.slice(0, -1)
    checkOver()
  }

  function clearAll() {
    draft = ''
    checkOver()
  }

  function confirm() {
    if (overLimit) return
    onConfirm(draft)
    onExpandedChange(false)
  }
</script>

<section class="nominal-placeholder" {hidden} aria-label="Nominal placeholder" style={box(path)}>
  {#if expanded}
    <output class="nominal-display" class:invalid={overLimit} aria-label="Nominal nota" aria-live="polite">{displayAmount}</output>
    <NumberPadPlaceholder onDigit={appendDigit} onDelete={deleteOne} onClear={clearAll} onConfirm={confirm} confirmDisabled={overLimit} />
    <NominalWarningPopup open={warnOpen} {max} onClose={() => warnOpen = false} />
  {:else}
    <button class="nominal-trigger" type="button" aria-label="Nominal nota" onclick={() => onExpandedChange(true)}>{collapsedLabel}</button>
  {/if}
</section>

<style>
  .nominal-placeholder {
    position: absolute;
    container-type: size;
  }

  .nominal-trigger {
    position: absolute;
    inset: 0%;
    border: 0;
    padding: 0 3%;
    background: #152d26;
    color: #e2e8f0;
    box-shadow: inset 0 0 0 0.35cqi #6ee7b7;
    font: inherit;
    font-size: min(5cqi, 35cqb);
    cursor: pointer;
  }

  .nominal-display {
    position: absolute;
    inset: 0%;
    display: grid;
    place-items: center;
    padding-inline: 3%;
    background: #152d26;
    color: #e2e8f0;
    box-shadow: inset 0 0 0 0.35cqi #6ee7b7;
    font-size: min(5cqi, 35cqb);
  }

  .nominal-display.invalid {
    color: #fbbf24;
    box-shadow: inset 0 0 0 0.35cqi #fbbf24;
  }
</style>
