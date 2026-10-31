<script lang="ts">
  import { s } from '../lib/text.svelte'

  /* PadKey - one number-pad key. Three sprites on the SAME canvas, so only
     opacity ever moves: base is the frame, press is the bloom under the finger,
     off is the grayed plate a disabled key shows.
     The three filenames come from public/content.json - this file holds none. */

  let {
    base = '',
    press = '',
    off = '',
    textPath = '',
    label = '',
    ariaLabel,
    disabled = false,
    onClick = () => {},
    onPressStart = () => {},
    onPressEnd = () => {},
    onPressCancel = () => {}
  }: {
    base?: string
    press?: string
    off?: string
    textPath?: string
    label?: string
    ariaLabel?: string
    disabled?: boolean
    onClick?: () => void
    onPressStart?: () => void
    onPressEnd?: () => void
    onPressCancel?: () => void
  } = $props()
</script>

<button
  class="pad-key"
  type="button"
  {disabled}
  aria-label={ariaLabel}
  style={s(textPath)}
  onpointerdown={onPressStart}
  onpointerup={onPressEnd}
  onpointerleave={onPressCancel}
  onpointercancel={onPressCancel}
  onclick={onClick}
>
  <span class="pad-base" style={`background-image: url("${base}")`} aria-hidden="true"></span>
  <span class="pad-press" style={`background-image: url("${press}")`} aria-hidden="true"></span>
  <span class="pad-off" style={`background-image: url("${off}")`} aria-hidden="true"></span>
  <span class="pad-teks">{label}</span>
</button>

<style>
  .pad-key {
    position: relative;
    container-type: size;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: #e2e8f0;
    font: inherit;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .pad-base,
  .pad-press,
  .pad-off {
    position: absolute;
    inset: 0;
    background: center / 100% 100% no-repeat;
    pointer-events: none;
  }

  .pad-press,
  .pad-off {
    opacity: 0;
  }

  /* A disabled button never enters :active, so the bloom cannot flash on a dead key. */
  .pad-key:active .pad-press {
    opacity: 1;
  }

  .pad-key:disabled {
    cursor: default;
  }

  .pad-key:disabled .pad-off {
    opacity: 1;
  }

  .pad-teks {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    line-height: 1;
    pointer-events: none;
  }

  .pad-key:focus-visible {
    outline: 0.4cqi solid #f8fafc;
    outline-offset: -0.4cqi;
  }
</style>
