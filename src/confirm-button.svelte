<script>
  import { box } from './lib/layout.svelte'

  let {
    path = '',
    disabled = false,
    onClick = () => {}
  } = $props()
</script>

<button
  class="confirm-button"
  class:disabled
  type="button"
  aria-label="Confirm report"
  {disabled}
  style={box(path)}
  onclick={onClick}
>
  <span class="edge edge-top" aria-hidden="true"></span>
  <span class="edge edge-right" aria-hidden="true"></span>
  <span class="edge edge-bottom" aria-hidden="true"></span>
  <span class="edge edge-left" aria-hidden="true"></span>
  <span class="placeholder-text">Confirm</span>
</button>

<style>
  .confirm-button {
    position: absolute;
    container-type: size;
    margin: 0;
    padding: 0;
    border: none;
    background: rgba(15, 23, 42, 0.35);
    color: inherit;
    font: inherit;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
  }

  .edge {
    position: absolute;
    z-index: 1;
    background: rgba(251, 146, 60, 0.85);
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
    font-size: 3.5cqi;
    font-weight: 700;
    line-height: 1;
    color: #e2e8f0;
    pointer-events: none;
  }

  /* Gray until every question is filled. */
  .confirm-button.disabled {
    cursor: default;
    background: rgba(30, 41, 59, 0.25);
  }

  .confirm-button.disabled .edge {
    background: rgba(100, 116, 139, 0.5);
  }

  .confirm-button.disabled .placeholder-text {
    color: #64748b;
  }
</style>
