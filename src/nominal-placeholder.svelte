<script lang="ts">
  import NumberPadPlaceholder from './number-pad-placeholder.svelte'

  let {
    hidden = false,
    expanded = false,
    value = '',
    onConfirm = () => {},
    onExpandedChange = () => {}
  }: {
    hidden?: boolean
    expanded?: boolean
    value?: string
    onConfirm?: (digits: string) => void
    onExpandedChange?: (expanded: boolean) => void
  } = $props()

  let draft = $state('')

  $effect(() => {
    if (expanded && !hidden) draft = value
  })

  const group = (d: string) => d.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const collapsedLabel = $derived(value ? `Rp ${group(value)}` : 'SELECT NOMINAL')
  const displayAmount = $derived(draft ? `Rp ${group(draft)}` : 'Masukkan nominal')

  function appendDigit(digit: string) {
    if (draft === '0') draft = digit
    else if (draft.length < 12) draft += digit
  }

  function deleteOne() {
    draft = draft.slice(0, -1)
  }

  function clearAll() {
    draft = ''
  }

  function confirm() {
    onConfirm(draft)
    onExpandedChange(false)
  }
</script>

<section class="nominal-placeholder" {hidden} aria-label="Nominal placeholder">
  {#if expanded}
    <output class="nominal-display" aria-label="Nominal nota" aria-live="polite">{displayAmount}</output>
    <NumberPadPlaceholder onDigit={appendDigit} onDelete={deleteOne} onClear={clearAll} onConfirm={confirm} />
  {:else}
    <button class="nominal-trigger" type="button" aria-label="Nominal nota" onclick={() => onExpandedChange(true)}>{collapsedLabel}</button>
  {/if}
</section>

<style>
  .nominal-placeholder {
    position: absolute;
    inset: 0%;
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
</style>
