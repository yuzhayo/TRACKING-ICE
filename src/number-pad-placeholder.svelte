<script lang="ts">
  import NumberPad from './number-pad.svelte'
  import { box, paint } from './lib/layout.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'

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

  const ArtComp = $derived(renderFor(path))
  const artProps = $derived(propsFor(path))
</script>

<section class="number-pad-placeholder" aria-label="Number pad placeholder" style={box(path) + paint(path)}>
  <NumberPad {path} {onDigit} {onDelete} {onClear} {onConfirm} {confirmDisabled} />
  {#if ArtComp}
    <div class="art-layer"><ArtComp {...artProps} /></div>
  {/if}
</section>

<style>
  .number-pad-placeholder {
    --pad-edge-color: rgba(110, 231, 183, 0.55);
    position: absolute;
    box-sizing: border-box;
    background-image:
      linear-gradient(var(--pad-edge-color), var(--pad-edge-color)),
      linear-gradient(var(--pad-edge-color), var(--pad-edge-color)),
      linear-gradient(var(--pad-edge-color), var(--pad-edge-color)),
      linear-gradient(var(--pad-edge-color), var(--pad-edge-color));
    background-size: 100% 0.6%, 0.6% 100%, 100% 0.6%, 0.6% 100%;
    background-position: 0% 0%, 100% 0%, 0% 100%, 0% 0%;
    background-repeat: no-repeat;
  }

  .art-layer {
    position: absolute;
    inset: 0%;
    pointer-events: none;
    z-index: 0;
  }
</style>
