<script>
  import './motion/animations.css'
  import { box, paint } from './lib/layout.svelte'
  import { s } from './lib/text.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'

  let {
    path = '',
    open = false,
    options = [],
    selected = '',
    onHighlight = () => {}
  } = $props()

  const ArtComp = $derived(renderFor(path))
  const artProps = $derived(propsFor(path))

  let listEl = $state(null)
  let activeIndex = $state(0)
  // Keep the items that were on screen when the list started closing, so the
  // collapse animation finishes with the old set instead of the newly swapped one.
  let displayOptions = $state([])
  let programmatic = false
  let collapsing = $state(false)
  let prevOpen = $state(false)

  $effect(() => {
    if (open || !collapsing) {
      displayOptions = [...options]
    }
  })

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

  // The band is sized in %, so whenever the list box changes size (viewport,
  // rotation, keyboard) recompute the row px and re-snap, or rows drift under
  // the band and overlap.
  $effect(() => {
    const el = listEl
    if (!el) return
    const ro = new ResizeObserver(() => {
      measure()
      scrollToIndex(activeIndex)
    })
    ro.observe(el)
    return () => ro.disconnect()
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

  $effect(() => {
    if (!collapsing) return
    const timer = setTimeout(() => { collapsing = false }, 320)
    return () => clearTimeout(timer)
  })

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
  style={box(path) + paint(path)}
  onscroll={handleScroll}
  onanimationend={handleAnimationEnd}
>
  {#if ArtComp}
    <div class="art-layer"><ArtComp {...artProps} /></div>
  {/if}
  {#each displayOptions as option, i (option)}
    <div class="option-item" class:active={open && i === activeIndex} style="opacity: {itemOpacity(i)}; {s(path)}" role="option" aria-selected={i === activeIndex}>{option}</div>
  {/each}
</div>

<style>
  .art-layer {
    position: absolute;
    inset: 0%;
    pointer-events: none;
    z-index: 0;
  }

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
