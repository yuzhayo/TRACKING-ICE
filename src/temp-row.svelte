<script>
  import './motion/animations.css'

  let {
    label = '',
    text = '',
    revealed = false,
    height = '11%',
    onClick = () => {}
  } = $props()

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
  style="height: {height};"
  onclick={() => revealed && onClick()}
  onkeydown={handleKeydown}
>
  <span class="edge edge-top" aria-hidden="true"></span>
  <span class="edge edge-right" aria-hidden="true"></span>
  <span class="edge edge-bottom" aria-hidden="true"></span>
  <span class="edge edge-left" aria-hidden="true"></span>
  <span class="temp-row-index" aria-hidden="true">{label}</span>
  <span class="temp-row-text">{text}</span>
</div>

<style>
  .temp-row {
    position: relative;
    width: 100%;
    box-sizing: border-box;
    flex: 0 0 auto;
    container-type: size;
    background: rgba(15, 23, 42, 0.35);
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
    background: rgba(248, 113, 133, 0.85);
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

  .temp-row-index {
    position: absolute;
    top: 0%;
    left: 0%;
    z-index: 2;
    padding: 0 1.5cqi;
    font-size: 2.5cqi;
    font-weight: 700;
    line-height: 1;
    color: rgba(254, 202, 202, 0.5);
    pointer-events: none;
  }

  .temp-row-text {
    position: absolute;
    inset: 0%;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-inline: 3%;
    font-size: 3.5cqi;
    font-weight: 700;
    line-height: 1;
    color: #fecaca;
    pointer-events: none;
  }
</style>
