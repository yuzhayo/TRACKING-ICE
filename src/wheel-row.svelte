<script>
  import './motion/animations.css'
  import { box, paint } from './lib/layout.svelte'

  let {
    path = '',
    variant = 'center',
    label = 'Wheel row',
    text = '',
    textStyle = '',
    open = true,
    closing = false,
    bumpKey = '',
    onClick = () => {}
  } = $props()

  const isCenter = $derived(variant === 'center')
</script>

<button
  class="wheel-row"
  class:variant-top={variant === 'top'}
  class:variant-center={isCenter}
  class:variant-bottom={variant === 'bottom'}
  class:closed={!isCenter && !open}
  class:closing={!isCenter && closing}
  type="button"
  aria-label={label}
  disabled={!isCenter && !open}
  style={box(path) + paint(path)}
  onclick={onClick}
>
  {#if text}
    <span class="wheel-row-text" style={textStyle} key={bumpKey}>{text}</span>
  {/if}
</button>

<style>
  .wheel-row {
    position: absolute;
    margin: 0;
    padding: 0;
    border: none;
    background-color: var(--fill);
    background-image:
      linear-gradient(var(--line), var(--line)),
      linear-gradient(var(--line), var(--line)),
      linear-gradient(var(--line), var(--line)),
      linear-gradient(var(--line), var(--line));
    background-size: 100% 1%, 1% 100%, 100% 1%, 1% 100%;
    background-position: 0% 0%, 100% 0%, 0% 100%, 0% 0%;
    background-repeat: no-repeat;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
  }

  .variant-top.closed {
    opacity: 0;
    transform: translate3d(0, 100%, 0);
    pointer-events: none;
  }

  .variant-bottom.closed {
    opacity: 0;
    transform: translate3d(0, -100%, 0);
    pointer-events: none;
  }

  .wheel-row-text {
    position: absolute;
    inset: 0%;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-inline: 3%;
    font-weight: 700;
    line-height: 1;
    color: #e2e8f0;
    pointer-events: none;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
