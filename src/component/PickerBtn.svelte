<script>
  /* PickerBtn - the wheel's center-row button, built from THREE sprites.

     Piece 1 of the two you asked out of the old PWA PickerWheel (the other is
     PickerGlow). The PWA stacked only the bloom and the gold frame here and let
     the face come from the pill underneath; the face canvas
     (utx_btn_common_01_m, 316x112) was sitting unused in PWA/public.

     Bottom to top:
       dasar    utx_btn_common_01_m.png          316x112  the blue face + gold edge
       cahaya   utx_btn_common_00_m_effect.png   310x58   its bloom, screen-blended
       bingkai  utx_btn_evo_super_00_frame.png   276x64   the hollow gold frame

     The bloom box is the effect canvas centered on the face canvas - pure canvas
     ratio: (316-310)/2/316 = 0.949% per side, (112-58)/2/112 = 24.107% per edge.
     Stretched over the whole face it climbs out of the frame, which is the bug
     this math exists to stop.

     One instance per placeholder. Where it sits, how big, and what it is called
     by the list above it is public/layout.json's decision.

     NOT wired to any placeholder - that mapping is the operator's call. */

  let {
    /* the bloom is the light of this button; off = face + frame only */
    bloom = true,
    frame = true
  } = $props()
</script>

<div class="picker-btn">
  <span class="picker-btn-dasar" aria-hidden="true"></span>
  {#if bloom}
    <span class="picker-btn-cahaya" aria-hidden="true"></span>
  {/if}
  {#if frame}
    <span class="picker-btn-bingkai" aria-hidden="true"></span>
  {/if}
</div>

<style>
  .picker-btn {
    position: relative;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .picker-btn-dasar,
  .picker-btn-cahaya,
  .picker-btn-bingkai {
    position: absolute;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    background-position: center;
    pointer-events: none;
  }

  .picker-btn-dasar {
    inset: 0;
    background-image: url('/utx_btn_common_01_m.png');
    z-index: 0;
  }

  .picker-btn-cahaya {
    left: 0.949%;
    right: 0.949%;
    top: 24.107%;
    bottom: 24.107%;
    background-image: url('/utx_btn_common_00_m_effect.png');
    mix-blend-mode: screen;
    z-index: 1;
  }

  .picker-btn-bingkai {
    inset: 0;
    background-image: url('/utx_btn_evo_super_00_frame.png');
    z-index: 2;
  }
</style>
