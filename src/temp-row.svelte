<script>
  import './motion/animations.css'
  import { box, paint } from './lib/layout.svelte'
  import { s } from './lib/text.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'

  let {
    path = '',
    label = '',
    text = '',
    revealed = false,
    onClick = () => {}
  } = $props()

  const ArtComp = $derived(renderFor(path))
  const artProps = $derived(propsFor(path))

  function handleKeydown(event) {
    if (!revealed) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }
</script>

<div
  class="temp-row"
  class:revealed
  class:editable={revealed}
  role="button"
  tabindex={revealed ? 0 : -1}
  aria-disabled={!revealed}
  aria-label={`Ubah jawaban ${label}`}
  style={box(path) + paint(path)}
  onclick={() => revealed && onClick()}
  onkeydown={handleKeydown}
>
  {#if ArtComp}
    <div class="art-layer"><ArtComp {...artProps} /></div>
  {/if}
  <span class="edge edge-top" aria-hidden="true"></span>
  <span class="edge edge-right" aria-hidden="true"></span>
  <span class="edge edge-bottom" aria-hidden="true"></span>
  <span class="edge edge-left" aria-hidden="true"></span>
  <span class="temp-row-text" style={s('temp.row')}>{text}</span>
</div>

<style>
  .temp-row {
    position: absolute;
    box-sizing: border-box;
    container-type: size;
    background: var(--fill);
  }

  .art-layer {
    position: absolute;
    inset: 0%;
    pointer-events: none;
    z-index: 0;
  }

  .temp-row.editable {
    pointer-events: auto;
    cursor: pointer;
  }

  .temp-row.editable:focus-visible {
    outline: 0.5cqi solid #f8fafc;
    outline-offset: -0.5cqi;
  }

  .edge {
    position: absolute;
    z-index: 1;
    background: var(--line);
    pointer-events: none;
  }

  .edge-top {
    left: 0%;
    top: 0%;
    width: 100%;
    height: 0.8cqi;
  }

  .edge-right {
    top: 0%;
    right: 0%;
    width: 0.8cqi;
    height: 100%;
  }

  .edge-bottom {
    right: 0%;
    bottom: 0%;
    width: 100%;
    height: 0.8cqi;
  }

  .edge-left {
    bottom: 0%;
    left: 0%;
    width: 0.8cqi;
    height: 100%;
  }

  .temp-row-text {
    position: absolute;
    inset: 0%;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-inline: 3%;
    font-weight: 700;
    line-height: 1;
    color: #fecaca;
    pointer-events: none;
  }
</style>
