<script>
  let {
    left = '0%',
    top = '0%',
    width = '100%',
    height = '100%',
    onClick = () => {}
  } = $props()
</script>

<button
  class="reset-placeholder"
  type="button"
  aria-label="Reset placeholder"
  style="left: {left}; top: {top}; width: {width}; height: {height};"
  onclick={onClick}
>
  <span class="edge edge-top" aria-hidden="true"></span>
  <span class="edge edge-right" aria-hidden="true"></span>
  <span class="edge edge-bottom" aria-hidden="true"></span>
  <span class="edge edge-left" aria-hidden="true"></span>
  <span class="placeholder-text">Reset</span>
</button>

<style>
  .reset-placeholder {
    position: absolute;
    container-type: size;
    margin: 0;
    padding: 0;
    border: none;
    background: rgba(15, 23, 42, 0.35);
    color: inherit;
    font: inherit;
    -webkit-tap-highlight-color: transparent;
  }

  .edge {
    position: absolute;
    z-index: 1;
    background: rgba(56, 189, 248, 0.85);
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
</style>
