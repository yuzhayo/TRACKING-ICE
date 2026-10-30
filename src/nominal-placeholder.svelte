<script lang="ts">
  import NumberPadPlaceholder from './number-pad-placeholder.svelte'
  import NominalWarningPopup from './nominal-warning-popup.svelte'
  import { box, paint } from './lib/layout.svelte'
  import { t, s } from './lib/text.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'

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

  const ArtComp = $derived(renderFor(path))
  const artProps = $derived(propsFor(path))

  const overLimit = $derived(draft !== '' && Number(draft) > max)

  $effect(() => {
    if (expanded && !hidden) {
      draft = value
      wasOver = value !== '' && Number(value) > max
    }
  })

  const group = (d: string) => d.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const collapsedLabel = $derived(value ? `Rp ${group(value)}` : t('nominal.trigger.prompt'))
  const displayAmount = $derived(draft ? `Rp ${group(draft)}` : t('nominal.display.prompt'))

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

<section class="nominal-placeholder" {hidden} aria-label="Nominal placeholder" style={box(path) + paint(path)}>
  {#if ArtComp}
    <div class="art-layer"><ArtComp {...artProps} /></div>
  {/if}
  {#if expanded}
    <output class="nominal-display" class:invalid={overLimit} aria-label="Nominal nota" aria-live="polite" style={s('nominal.display')}>{displayAmount}</output>
    <NumberPadPlaceholder path={`${path}.pad`} onDigit={appendDigit} onDelete={deleteOne} onClear={clearAll} onConfirm={confirm} confirmDisabled={overLimit} />
    <NominalWarningPopup open={warnOpen} {max} onClose={() => warnOpen = false} />
  {:else}
    <button class="nominal-trigger" type="button" aria-label="Nominal nota" style={s('nominal.trigger')} onclick={() => onExpandedChange(true)}>{collapsedLabel}</button>
  {/if}
</section>

<style>
  .art-layer {
    position: absolute;
    inset: 0%;
    pointer-events: none;
    z-index: 0;
  }

  .nominal-placeholder {
    position: absolute;
    container-type: size;
  }

  .nominal-trigger {
    position: absolute;
    inset: 0%;
    border: 0;
    padding: 0 3%;
    background: var(--fill);
    color: #e2e8f0;
    box-shadow: inset 0 0 0 0.35cqi var(--line);
    font: inherit;
    cursor: pointer;
  }

  .nominal-display {
    position: absolute;
    inset: 0%;
    display: grid;
    place-items: center;
    padding-inline: 3%;
    background: var(--fill);
    color: #e2e8f0;
    box-shadow: inset 0 0 0 0.35cqi var(--line);
  }

  .nominal-display.invalid {
    color: #fbbf24;
    box-shadow: inset 0 0 0 0.35cqi #fbbf24;
  }
</style>
