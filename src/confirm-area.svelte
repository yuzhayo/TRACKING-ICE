<script>
  import { box, paint } from './lib/layout.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'

  let {
    path = '',
    onClick = () => {}
  } = $props()

  const ArtComp = $derived(renderFor(path))
  const artProps = $derived(propsFor(path))
</script>

<button
  class="confirm-area"
  type="button"
  aria-label="Konfirmasi pilihan"
  style={box(path) + paint(path)}
  onclick={onClick}
>
  {#if ArtComp}
    <div class="art-layer"><ArtComp {...artProps} /></div>
  {/if}
</button>

<style>
  .art-layer {
    position: absolute;
    inset: 0%;
    pointer-events: none;
    z-index: 0;
  }

  .confirm-area {
    position: absolute;
    container-type: size;
    margin: 0;
    padding: 0;
    border: 0;
    background: var(--fill);
    outline: 0.5cqi solid var(--line);
    outline-offset: -0.5cqi;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
</style>
