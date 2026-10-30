<script>
  /* PickerGlow - the half-circle light, built from TWO sprites.

     Piece 2 of the two you asked out of the old PWA PickerWheel (the other is
     PickerBtn).

     Bottom to top:
       ekor   utx_base_footer_menu_active_semicircle.png        400x147  the tail
       kubah  utx_base_footer_menu_active_semicircle_trim.png   295x92   the dome

     The tail canvas is "almost full" by its ALPHA profile - the bottom 51 rows
     are the light's tail, not empty space - so it is always drawn whole at
     100% 100%. Threshold-cropping it amputates the tail and the glow clumps.

     Inside that canvas the dome occupies x 53..347, i.e. 295 of 400 wide. The
     trim file IS that dome, exported on its own, so it goes exactly over its own
     pixels: left 13.25%, width 73.75%, top 0, height 92/147 = 62.585%.

     One instance per placeholder, `flip` for the one that hangs above the wheel.
     Where each sits is public/layout.json's decision - the component never draws
     a pair of itself.

     NOT wired to any placeholder - that mapping is the operator's call. */

  let {
    flip = false,
    tail = true,
    dome = true
  } = $props()
</script>

<div class="picker-glow" class:flip aria-hidden="true">
  {#if tail}
    <span class="picker-glow-ekor"></span>
  {/if}
  {#if dome}
    <span class="picker-glow-kubah"></span>
  {/if}
</div>

<style>
  .picker-glow {
    position: relative;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .picker-glow.flip {
    transform: scaleY(-1);
  }

  .picker-glow-ekor {
    position: absolute;
    inset: 0;
    background: url('/utx_base_footer_menu_active_semicircle.png') center / 100% 100% no-repeat;
    pointer-events: none;
  }

  .picker-glow-kubah {
    position: absolute;
    left: 13.25%;
    width: 73.75%;
    top: 0;
    height: 62.585%;
    background: url('/utx_base_footer_menu_active_semicircle_trim.png') center / 100% 100% no-repeat;
    pointer-events: none;
  }
</style>
