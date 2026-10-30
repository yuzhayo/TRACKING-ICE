<script>
  import '../motion/animations.css'
  import { s } from '../lib/text.svelte'

  /* PilJawaban - component 3 of PWA/SPRITE-COMPONENTS.md (an answer pill).
     Two art layers and a face: the pill canvas, its shine canvas centered on
     top of it (mix-blend-mode: screen, so the glow stops inside the frame), and
     the answer text.

     This is ONE pill. Which pills exist and where the stack sits is geometry,
     so that belongs to public/layout.json - not to this file.

     Birth: the pill flies up from the wheel it was just chosen in and lands with
     the original bounceInUp beats (rise -> overshoot -> settle, with the
     squash/stretch). The distance is measured, never guessed.

     NOT wired to any placeholder - that mapping is the operator's call. */

  let {
    label = '',
    textStyle = s('jawaban'),
    /* the wheel this answer came from is open: the pill holds its box, blanked */
    open = false,
    /* selector of the element the answer came from; empty -> fly half a screen */
    fromSelector = '',
    onClick = () => {}
  } = $props()

  let rootEl = $state(null)
  let kilat = $state(false)

  $effect(() => {
    const el = rootEl
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const source = fromSelector ? document.querySelector(fromSelector) : null
    const dock = el.getBoundingClientRect().top
    const distance = source ? source.getBoundingClientRect().top - dock : window.innerHeight * 0.5

    el.animate(
      [
        { opacity: 0, transform: `translate3d(0, ${distance}px, 0) scaleY(5)` },
        { opacity: 1, transform: 'translate3d(0, -20px, 0) scaleY(.9)', offset: 0.6 },
        { transform: 'translate3d(0, 10px, 0) scaleY(.95)', offset: 0.75 },
        { transform: 'translate3d(0, -5px, 0) scaleY(.985)', offset: 0.9 },
        { transform: 'translateZ(0)' }
      ],
      { duration: 750, easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)' }
    )
  })

  function flash() {
    if (open) return
    kilat = false
    requestAnimationFrame(() => {
      kilat = true
    })
  }

  function handleAnimationEnd(event) {
    if (event.animationName.includes('pil-kilat')) kilat = false
  }
</script>

<button
  class="pil-jawaban"
  class:kilat
  class:open
  type="button"
  bind:this={rootEl}
  {onClick}
  onpointerdown={flash}
  onanimationend={handleAnimationEnd}
>
  <span class="pil-jawaban-dasar" aria-hidden="true"></span>
  <span class="pil-jawaban-kilat" aria-hidden="true"></span>
  <span class="pil-jawaban-teks" style={textStyle}>{label}</span>
</button>

<style>
  .pil-jawaban {
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

  .pil-jawaban.open {
    visibility: hidden;
  }

  .pil-jawaban:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
  }

  .pil-jawaban-dasar {
    position: absolute;
    inset: 0;
    background: url('/utx_btn_common_00_l.png') center / 100% 100% no-repeat;
    pointer-events: none;
  }

  /* The shine box is the effect canvas centered on the base canvas - pure
     canvas ratio (450/460 and 58/72), checked against the native composite.
     Stretching it over the whole base pushes the glow outside the frame. */
  .pil-jawaban-kilat {
    position: absolute;
    left: 1.087%;
    right: 1.087%;
    top: 9.722%;
    bottom: 9.722%;
    background: url('/utx_btn_common_00_l_effect.png') center / 100% 100% no-repeat;
    mix-blend-mode: screen;
    opacity: 0;
    pointer-events: none;
  }

  .pil-jawaban.kilat .pil-jawaban-kilat {
    animation: pil-kilat 0.35s ease-out;
  }

  .pil-jawaban-teks {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding-inline: 9%;
    font-weight: 600;
    line-height: 1;
    color: #e2e8f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  }
</style>
