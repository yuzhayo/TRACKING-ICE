<script lang="ts">
  import NumberPad from './number-pad.svelte'

  let {
    onDigit = () => {},
    onDelete = () => {},
    onClear = () => {},
    onConfirm = () => {},
    confirmDisabled = false
  }: {
    onDigit?: (digit: string) => void
    onDelete?: () => void
    onClear?: () => void
    onConfirm?: () => void
    confirmDisabled?: boolean
  } = $props()
</script>

<section class="number-pad-placeholder" aria-label="Number pad placeholder">
  <NumberPad {onDigit} {onDelete} {onClear} {onConfirm} {confirmDisabled} />
</section>

<style>
  .number-pad-placeholder {
    --pad-edge-color: rgba(110, 231, 183, 0.55);
    position: absolute;
    left: 3%;
    top: 115%;
    width: 94%;
    height: 340%;
    background-image:
      linear-gradient(var(--pad-edge-color), var(--pad-edge-color)),
      linear-gradient(var(--pad-edge-color), var(--pad-edge-color)),
      linear-gradient(var(--pad-edge-color), var(--pad-edge-color)),
      linear-gradient(var(--pad-edge-color), var(--pad-edge-color));
    background-size: 100% 0.6%, 0.6% 100%, 100% 0.6%, 0.6% 100%;
    background-position: 0% 0%, 100% 0%, 0% 100%, 0% 0%;
    background-repeat: no-repeat;
  }
</style>
