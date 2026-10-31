<script>
  import '../motion/animations.css'
  import { s } from '../lib/text.svelte'

  /* Reusable cooked button - the first sprite component.
     One button = one file: the two art layers, the shine, and its CSS all live
     here. It fills whatever box its parent gives it (a placeholder later), so it
     carries no position of its own. The label is passed in; the text style comes
     from public/text.json key "btn" unless the caller overrides it.
     Wired through content.json: any entry whose "render" is "btn" gets this component. */

  let {
    label = '',
    disabled = false,
    textStyle = s('btn'),
    onClick = () => {}
  } = $props()

  let kilat = $state(false)

  function flash() {
    if (disabled) return
    kilat = false
    requestAnimationFrame(() => { kilat = true })
  }

  function handleAnimationEnd(event) {
    if (event.animationName.includes('btn-kilat')) kilat = false
  }
</script>

<button
  class="btn"
  class:kilat
  type="button"
  {disabled}
  onclick={onClick}
  onpointerdown={flash}
  onanimationend={handleAnimationEnd}
>
  <span class="btn-dasar" aria-hidden="true"></span>
  <span class="btn-kilat" aria-hidden="true"></span>
  <span class="btn-teks" style={textStyle}>{label}</span>
</button>

<style>
  .btn {
    position: relative;
    container-type: size;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    color: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  /* Base layer: the button face, stretched to the box. */
  .btn-dasar {
    position: absolute;
    inset: 0%;
    background: url('/btn_base.png') center / 100% 100% no-repeat;
    pointer-events: none;
  }

  /* Shine layer: the effect canvas centered on the base (419/448 and 113/136 of
     the export canvases), screen-blended, flashed once per tap. */
  .btn-kilat {
    position: absolute;
    left: 3.237%;
    right: 3.237%;
    top: 8.456%;
    bottom: 8.456%;
    background: url('/btn_shine.png') center / 100% 100% no-repeat;
    mix-blend-mode: screen;
    opacity: 0;
    pointer-events: none;
  }

  .btn.kilat .btn-kilat {
    animation: btn-kilat 0.35s ease-out;
  }

  .btn-teks {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding-inline: 3%;
    font-weight: 700;
    line-height: 1;
    color: #0a3350;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  }

  /* Gray until every question is filled (confirm) - the art dims, no shine. */
  .btn:disabled {
    cursor: default;
  }

  .btn:disabled .btn-dasar {
    filter: grayscale(1) brightness(0.6);
  }

  .btn:disabled .btn-teks {
    color: #64748b;
  }
</style>
