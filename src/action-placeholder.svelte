<script>
  import ResetButton from './reset-button.svelte'
  import ConfirmButton from './confirm-button.svelte'
  import './motion/animations.css'

  let {
    left = '0%',
    top = '0%',
    width = '100%',
    height = '100%',
    hidden = false,
    out = false,
    in: enter = false,
    onOutEnd = () => {},
    onInEnd = () => {},
    onReset = () => {},
    onConfirm = () => {},
    confirmReady = false
  } = $props()

  function handleAnimationEnd(event) {
    if (event.animationName.includes('action-in-impact')) {
      onInEnd()
      return
    }

    onOutEnd()
  }
</script>

<section
  class="action-placeholder"
  class:hidden={hidden}
  class:out={out}
  class:in={enter}
  aria-label="Action button area"
  style="left: {left}; top: {top}; width: {width}; height: {height};"
  onanimationend={handleAnimationEnd}
>
  <span class="edge edge-top" aria-hidden="true"></span>
  <span class="edge edge-right" aria-hidden="true"></span>
  <span class="edge edge-bottom" aria-hidden="true"></span>
  <span class="edge edge-left" aria-hidden="true"></span>

  <ResetButton
    left="6.6667%"
    top="30%"
    width="40%"
    height="35%"
    onClick={onReset}
  />

  <ConfirmButton
    left="53.3333%"
    top="30%"
    width="40%"
    height="35%"
    disabled={!confirmReady}
    onClick={onConfirm}
  />
</section>

<style>
  .action-placeholder {
    position: absolute;
    container-type: size;
    background: none;
  }

  .action-placeholder.hidden {
    display: none;
  }

  .edge {
    position: absolute;
    z-index: 1;
    background: rgba(251, 191, 36, 0.75);
    pointer-events: none;
  }

  .edge-top {
    left: 0%;
    top: 0%;
    width: 100%;
    height: 0.6cqi;
  }

  .edge-right {
    top: 0%;
    right: 0%;
    width: 0.6cqi;
    height: 100%;
  }

  .edge-bottom {
    right: 0%;
    bottom: 0%;
    width: 100%;
    height: 0.6cqi;
  }

  .edge-left {
    bottom: 0%;
    left: 0%;
    width: 0.6cqi;
    height: 100%;
  }
</style>
