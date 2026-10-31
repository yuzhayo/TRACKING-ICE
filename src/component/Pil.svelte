<script>
  import '../motion/animations.css'
  import { s } from '../lib/text.svelte'

  /* Pil - component 1 of PWA/SPRITE-COMPONENTS.md (the pill row).
     Three art layers plus a face: normal_base, the SAME canvas lit (only its
     opacity changes, so nothing shifts), and the gold band above the text.

     It fills whatever box its parent hands it, so the position/size stay in
     public/layout.json and only the layer stack lives in this file.

     open = the wheel belonging to this pill is showing: the pill keeps its box,
     its contents stop being drawn (the wheel takes that exact place).

     Wired through content.json: any entry whose "render" is "pil" gets this component. */

  let {
    textStyle = s('pil'),
    onClick = () => {}
  } = $props()
</script>

<button
  class="pil"
  type="button"
  aria-label="Pill button"
  {onClick}
>
  <span class="pil-dasar" aria-hidden="true"></span>
  <span class="pil-light" aria-hidden="true"></span>
  <span class="pil-band" aria-hidden="true"></span>
  <span class="pil-teks" style={textStyle}></span>
</button>

<style>
  .pil {
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

  .pil:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
  }

  .pil-dasar {
    position: absolute;
    inset: 0;
    background: url('/utx_btn_common_h360_v72_normal_base.png') center / 100% 100% no-repeat;
    pointer-events: none;
  }

  /* The lit face is a swap over the identical canvas, so opacity is the only
     thing that changes - chamfer, notch and height stay exactly where they were. */
  .pil-light {
    position: absolute;
    inset: 0;
    background: url('/utx_btn_common_h360_v72_light_base.png') center / 100% 100% no-repeat;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.16s ease;
  }

  .pil:focus-within .pil-light {
    opacity: 1;
  }

  /* The band is the pill's own layer, not the wheel's: without it a pill reads
     as a plain slab. Hollow center, so the text still reads through it. */
  .pil-band {
    position: absolute;
    inset: 0;
    background: url('/utx_btn_evo_super_00_frame.png') center / 100% 100% no-repeat;
    pointer-events: none;
    z-index: 4;
  }

  .pil-teks {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding-inline: 5.5%;
    font-weight: 600;
    line-height: 1;
    color: #e2e8f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  }


  @media (prefers-reduced-motion: reduce) {
    .pil-light {
      transition: none;
    }
  }
</style>
