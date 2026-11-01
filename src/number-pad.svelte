<script lang="ts">
  import { renderFor, propsFor } from './lib/content.svelte'
  import { t } from './lib/text.svelte'

  let {
    path = '',
    onDigit = () => {},
    onDelete = () => {},
    onClear = () => {},
    onConfirm = () => {},
    confirmDisabled = false
  }: {
    path?: string
    onDigit?: (digit: string) => void
    onDelete?: () => void
    onClear?: () => void
    onConfirm?: () => void
    confirmDisabled?: boolean
  } = $props()

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  // Which component draws a key, and with which three sprites, is content.json's
  // call: nominal.pad.key / .clear / .ok.
  const KeyComp = $derived(renderFor(`${path}.key`))
  const keyProps = $derived(propsFor(`${path}.key`))
  const ClearComp = $derived(renderFor(`${path}.clear`))
  const clearProps = $derived(propsFor(`${path}.clear`))
  const OkComp = $derived(renderFor(`${path}.ok`))
  const okProps = $derived(propsFor(`${path}.ok`))

  let holdTimer: ReturnType<typeof setTimeout> | null = null
  let didHold = false

  function startHold(event?: PointerEvent | TouchEvent) {
    event?.preventDefault()
    didHold = false
    holdTimer = setTimeout(() => {
      didHold = true
      onClear()
    }, 500)
  }

  function endHold() {
    if (holdTimer) {
      clearTimeout(holdTimer)
      holdTimer = null
    }
    if (!didHold) onDelete()
  }

  function cancelHold() {
    if (holdTimer) {
      clearTimeout(holdTimer)
      holdTimer = null
    }
  }
</script>

<section class="number-pad" aria-label="Papan angka">
  {#each digits as digit (digit)}
    {#if KeyComp}
      <KeyComp {...keyProps} textPath={`${path}.key`} label={digit} onClick={() => onDigit(digit)} />
    {/if}
  {/each}

  {#if ClearComp}
    <ClearComp
      {...clearProps}
      textPath={`${path}.clear`}
      label={t(`${path}.clear`)}
      ariaLabel="Ketuk untuk hapus satu angka, tahan untuk hapus semua"
      onPressStart={startHold}
      onPressEnd={endHold}
      onPressCancel={cancelHold}
    />
  {/if}

  {#if KeyComp}
    <KeyComp {...keyProps} textPath={`${path}.key`} label="0" onClick={() => onDigit('0')} />
  {/if}

  {#if OkComp}
    <OkComp {...okProps} textPath={`${path}.ok`} label={t(`${path}.ok`)} disabled={confirmDisabled} onClick={onConfirm} />
  {/if}
</section>

<style>
  .number-pad {
    container-type: size;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(4, minmax(0, 1fr));
    gap: 3%;
    width: 100%;
    height: 100%;
  }
</style>
