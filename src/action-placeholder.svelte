<script>
  import ResetButton from './reset-button.svelte'
  import ConfirmButton from './confirm-button.svelte'
  import './motion/animations.css'
  import { box, paint } from './lib/layout.svelte'

  let {
    path = '',
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
  style={box(path) + paint(path)}
  onanimationend={handleAnimationEnd}
>
  <span class="edge edge-top" aria-hidden="true"></span>
  <span class="edge edge-right" aria-hidden="true"></span>
  <span class="edge edge-bottom" aria-hidden="true"></span>
  <span class="edge edge-left" aria-hidden="true"></span>

  <ResetButton
    path={`${path}.reset`}
    onClick={onReset}
  />

  <ConfirmButton
    path={`${path}.confirm`}
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
    background: var(--line);
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
