<script>
  import { box, paint } from './lib/layout.svelte'
  import { t, s } from './lib/text.svelte'
  import { renderFor } from './lib/content.svelte'

  let {
    path = 'action.reset',
    onClick = () => {}
  } = $props()

  // content.json decides what fills this placeholder; null keeps the outline.
  const Comp = $derived(renderFor(path))
</script>

{#if Comp}
  <div class="btn-slot" style={box(path)}>
    <Comp label={t(path)} textStyle={s(path)} {onClick} />
  </div>
{:else}
  <button
    class="reset-placeholder"
    type="button"
    aria-label="Reset placeholder"
    style={box(path) + paint(path)}
    onclick={onClick}
  >
    <span class="edge edge-top" aria-hidden="true"></span>
    <span class="edge edge-right" aria-hidden="true"></span>
    <span class="edge edge-bottom" aria-hidden="true"></span>
    <span class="edge edge-left" aria-hidden="true"></span>
    <span class="placeholder-text" style={s('action.reset')}>{t('action.reset')}</span>
  </button>
{/if}

<style>
  .btn-slot {
    position: absolute;
  }

  .reset-placeholder {
    position: absolute;
    container-type: size;
    margin: 0;
    padding: 0;
    border: none;
    background: var(--fill);
    color: inherit;
    font: inherit;
    -webkit-tap-highlight-color: transparent;
  }

  .edge {
    position: absolute;
    z-index: 1;
    background: var(--line);
    pointer-events: none;
  }

  .edge-top { left: 0%; top: 0%; width: 100%; height: 0.8cqi; }
  .edge-right { top: 0%; right: 0%; width: 0.8cqi; height: 100%; }
  .edge-bottom { right: 0%; bottom: 0%; width: 100%; height: 0.8cqi; }
  .edge-left { bottom: 0%; left: 0%; width: 0.8cqi; height: 100%; }

  .placeholder-text {
    position: absolute;
    inset: 0%;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    line-height: 1;
    color: #e2e8f0;
    pointer-events: none;
  }
</style>
