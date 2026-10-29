<script>
  import './motion/animations.css'
  import { box } from './lib/layout.svelte'

  let {
    path = '',
    open = false,
    options = [],
    selected = '',
    onHighlight = () => {}
  } = $props()

  let listEl = $state(null)
  let activeIndex = $state(0)
  let programmatic = false
  let collapsing = $state(false)
  let prevOpen = $state(false)

  function rowHeight() {
    return listEl ? listEl.clientHeight / 5 : 0
  }

  function measure() {
    if (listEl) listEl.style.setProperty('--wheel-row', `${rowHeight()}px`)
  }

  function scrollToIndex(i) {
    if (!listEl) return
    programmatic = true
    listEl.scrollTop = i * rowHeight()
    window.setTimeout(() => { programmatic = false }, 120)
  }

  $effect(() => {
    if (open && !prevOpen) {
      collapsing = false
      measure()
      const i = Math.max(0, options.indexOf(selected))
      activeIndex = i
      onHighlight(options[i] ?? '')
      scrollToIndex(i)
    } else if (!open && prevOpen) {
      collapsing = true
    }
    prevOpen = open
  })

  function handleScroll() {
    if (!listEl || programmatic) return
    const h = rowHeight()
    const i = Math.max(0, Math.min(options.length - 1, Math.round(listEl.scrollTop / h)))
    if (i !== activeIndex) {
      activeIndex = i
      onHighlight(options[i] ?? '')
    }
  }

  function handleAnimationEnd(event) {
    if (event.animationName.includes('clip-collapse')) collapsing = false
  }

  // Text opacity is purely distance-from-center; show/hide is the clip only.
  function itemOpacity(i) {
    const d = Math.abs(i - activeIndex)
    return d === 0 ? 1 : d === 1 ? 0.5 : d === 2 ? 0.22 : 0
  }
</script>

<div
  class="option-list"
  class:revealing={open && !collapsing}
  class:collapsing={collapsing}
  bind:this={listEl}
  role="listbox"
  aria-label="Daftar pilihan"
  style={box(path)}
  onscroll={handleScroll}
  onanimationend={handleAnimationEnd}
>
  {#each options as option, i (option)}
    <div class="option-item" class:active={open && i === activeIndex} style="opacity: {itemOpacity(i)}" role="option" aria-selected={i === activeIndex}>{option}</div>
  {/each}
</div>

<style>
  .option-list {
    position: absolute;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    overscroll-behavior: contain;
    touch-action: pan-y;
    scrollbar-width: none;
    -ms-overflow-style: none;
    pointer-events: none;
    clip-path: inset(50% 0% 50% 0%);
    padding-block: calc(var(--wheel-row, 20%) * 2);
  }

  .option-list::-webkit-scrollbar {
    display: none;
  }

  .option-list.revealing {
    pointer-events: auto;
  }

  .option-item {
    height: var(--wheel-row, 20%);
    scroll-snap-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-inline: 3%;
    font-size: 4cqi;
    font-weight: 700;
    line-height: 1;
    color: #e2e8f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .option-item.active {
    color: transparent;
  }
</style>
