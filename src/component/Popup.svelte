<script>
  import '../motion/animations.css'
  import { s } from '../lib/text.svelte'

  /* Popup - component 5 of PWA/SPRITE-COMPONENTS.md (the dialog shell).
     The whole look is built from its original art layers; every number is a
     percentage of the 512x512 frame canvas, so the shell scales with whatever
     box it enters and the internal layout cannot drift.

       langit  starry sky        frame   gold dialog frame
       banner  title bar, deliberately over the top edge
       aura    rune glow behind the button cluster
       cincin  empty gold ring
       tutup   the X disc (the tap target) with its white star face
       deco    the gold divider, drawn twice, left one mirrored

     Text is never positioned by hand: the title sits in the banner's own box
     and the body occupies the interior. AntD chrome is gone, and so is a second
     copy of any button - the body takes a snippet, whoever wires it decides.

     NOT wired to any placeholder - that mapping is the operator's call. */

  let {
    title = '',
    message = '',
    titleStyle = s('popup.title'),
    messageStyle = s('popup.message'),
    onClose = () => {},
    children
  } = $props()
</script>

<div class="popup">
  <div class="popup-langit" aria-hidden="true"></div>
  <div class="popup-frame" aria-hidden="true"></div>
  <div class="popup-banner" aria-hidden="true"></div>
  <div class="popup-aura" aria-hidden="true"></div>

  {#if title}
    <div class="popup-header" style={titleStyle}>{title}</div>
  {/if}

  <div class="popup-body" style={messageStyle}>
    {#if message}
      <div class="popup-pesan">{message}</div>
    {/if}
    {#if children}
      <div class="popup-slot">{@render children()}</div>
    {/if}
  </div>

  <div class="popup-deco popup-deco-kiri" aria-hidden="true"></div>
  <div class="popup-deco popup-deco-kanan" aria-hidden="true"></div>
  <div class="popup-cincin" aria-hidden="true"></div>

  <button class="popup-tutup" type="button" aria-label="Tutup" onclick={onClose}>
    <span class="popup-kelip" aria-hidden="true"></span>
  </button>
</div>

<style>
  /* The box itself is layout.json's; every layer below is a share of it. */
  .popup {
    position: relative;
    container-type: size;
    width: 100%;
    height: 100%;
  }

  .popup-langit,
  .popup-frame,
  .popup-banner,
  .popup-aura,
  .popup-cincin,
  .popup-deco {
    position: absolute;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    pointer-events: none;
  }

  .popup-langit {
    inset: 0;
    z-index: 0;
    background-image: url('/bg_12.png');
  }

  .popup-frame {
    inset: 0;
    z-index: 1;
    background-image: url('/utx_base_dialog_frame.png');
  }

  /* Wider than the frame and raised above it, exactly as exported: the dark
     bar lands on the frame's top edge. */
  .popup-banner {
    left: -1.5625%;
    top: -15.625%;
    width: 103.32%;
    height: 47.79%;
    z-index: 2;
    background-image: url('/PentaB.png');
  }

  /* The button cluster's centers all fall on (256, 512) of the 512 canvas -
     right on the frame's bottom edge, so they straddle the border the way the
     mockup does. z = export order (first listed = on top). */
  .popup-aura {
    left: 22.07%;
    top: 72.07%;
    width: 55.86%;
    height: 55.86%;
    z-index: 3;
    background-image: url('/bg_yuganghuawen.png');
  }

  .popup-cincin {
    left: 30.86%;
    top: 80.66%;
    width: 38.48%;
    height: 38.48%;
    z-index: 4;
    background-image: url('/head_frame_arenadefault.png');
  }

  .popup-deco {
    top: 95.31%;
    width: 30.58%;
    height: 9.375%;
    z-index: 8;
    background-image: url('/login_deco04.png');
  }

  .popup-deco-kanan {
    left: 57.23%;
  }

  .popup-deco-kiri {
    left: 12.78%;
    transform: scaleX(-1);
  }

  /* Two text boxes only: header reuses the banner box, so the title centers in
     the bar without a second set of numbers; body takes the interior. */
  .popup-header {
    position: absolute;
    left: -1.5625%;
    top: -15.625%;
    width: 103.32%;
    height: 47.79%;
    z-index: 7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    line-height: 1;
    color: #f0f9ff;
    text-shadow: 0 0.4% 1.2% rgba(0, 0, 0, 0.6);
    pointer-events: none;
  }

  .popup-body {
    position: absolute;
    inset: 18% 8% 21% 8%;
    z-index: 7;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.953%;
    overflow: hidden;
    color: #e2e8f0;
  }

  .popup-pesan {
    flex: 0 0 auto;
    line-height: 1.45;
    text-align: center;
  }

  /* The body takes the message and a snippet. It does NOT pull a button in:
     Svelte scopes a component's CSS to its own markup, so a parent class
     (.popup-sahkan below) cannot restyle a cooked child's layers. Whoever
     wires this popup puts the control in the snippet, at the size its own
     placeholder gives it - the way reset/confirm already do. */
  .popup-slot {
    flex: 0 1 auto;
    min-height: 0;
    width: 58%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* The X is the only chrome, and the button element IS its dark disc - so the
     tap target is exactly the size of the button. */
  .popup-tutup {
    position: absolute;
    left: 39.26%;
    top: 89.06%;
    z-index: 6;
    width: 21.48%;
    aspect-ratio: 1;
    padding: 0;
    border: 0;
    background: url('/login_frame_08.png') center / 100% 100% no-repeat;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.14s ease;
  }

  /* kelip: 98 inside 110, offset (49,49)-(43,43) = 6 -> 6/110 = 5.45%. */
  .popup-kelip {
    position: absolute;
    left: 5.45%;
    top: 5.45%;
    width: 89.09%;
    height: 89.09%;
    background: url('/login_btn_01.png') center / 100% 100% no-repeat;
    pointer-events: none;
  }

  .popup-tutup:active {
    transform: scale(0.9);
  }

  .popup-tutup:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 3px;
    border-radius: 50%;
  }

  @media (prefers-reduced-motion: reduce) {
    .popup-tutup,
    .popup-tutup:active {
      transition: none;
      transform: none;
    }
  }
</style>
