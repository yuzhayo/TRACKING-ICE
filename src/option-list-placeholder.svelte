<script>
  import './motion/animations.css'
  import { box, paint } from './lib/layout.svelte'
  import { s } from './lib/text.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'

  /* The wheel. The app moves the names itself - translate3d and opacity only.
     No native scroll, no scroll-snap, no clip-path: those are the three things
     mobile engines disagree about, and a phone's settings are not a fix.
     A finger, a mouse drag or a wheel tick sets an offset in pixels; the offset
     is thrown from the pointer's speed, then settles on the nearest name. */

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
  let trackEl = $state(null)
  let activeIndex = $state(0)
  // Keep the names that were on screen when the wheel started closing, so the
  // collapse finishes with the old set instead of the newly swapped one.
  let displayOptions = $state([])
  let collapsing = $state(false)
  let prevOpen = $state(false)

  // Offset from the resting position of the first name, in px. Deliberately NOT
  // reactive state: it changes every frame and only the transform reads it.
  let offset = 0
  let rowH = 0
  let raf = 0
  let wheelTimer = 0

  let dragging = false
  let moved = false
  let startY = 0
  let startOffset = 0
  let lastY = 0
  let lastT = 0
  let velocity = 0

  const VISIBLE_ROWS = 5
  const THROW_MS = 140
  const MAX_VELOCITY = 2.5
  const RUBBER = 0.35
  const TAP_SLOP = 6

  function measure() {
    if (!listEl) return
    rowH = listEl.clientHeight / VISIBLE_ROWS
    listEl.style.setProperty('--wheel-row', `${rowH}px`)
  }

  function apply() {
    if (trackEl) trackEl.style.transform = `translate3d(0, ${-offset}px, 0)`
  }

  function maxOffset() {
    return Math.max(0, (options.length - 1) * rowH)
  }

  function hardClamp(v) {
    return Math.max(0, Math.min(maxOffset(), v))
  }

  // Past either end the track keeps moving, but resisted, so the phone still
  // answers the finger instead of freezing.
  function rubber(v) {
    const max = maxOffset()
    if (v < 0) return v * RUBBER
    if (v > max) return max + (v - max) * RUBBER
    return v
  }

  function setOffset(v) {
    offset = v
    apply()
    if (!rowH) return
    const i = Math.max(0, Math.min(options.length - 1, Math.round(hardClamp(v) / rowH)))
    if (i !== activeIndex) {
      activeIndex = i
      onHighlight(options[i] ?? '')
    }
  }

  function stopAnim() {
    if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }

  function animateTo(target, dur) {
    stopAnim()
    const from = offset
    const delta = target - from
    if (!delta || dur <= 0) {
      setOffset(target)
      return
    }
    const t0 = performance.now()
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur)
      setOffset(from + delta * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step)
      else {
        raf = 0
        setOffset(target)
      }
    }
    raf = requestAnimationFrame(step)
  }

  // Land on the name the throw points at, so the centre row is always a whole row.
  function settle() {
    if (!rowH) return
    const projected = hardClamp(offset + velocity * THROW_MS)
    const i = Math.max(0, Math.min(options.length - 1, Math.round(projected / rowH)))
    const target = i * rowH
    animateTo(target, Math.min(600, 140 + Math.abs(target - offset) * 1.4))
  }

  function goTo(i) {
    const clamped = Math.max(0, Math.min(options.length - 1, i))
    animateTo(clamped * rowH, 320)
  }

  function dragStart(y) {
    stopAnim()
    dragging = true
    moved = false
    velocity = 0
    startY = y
    startOffset = offset
    lastY = y
    lastT = performance.now()
  }

  function dragMove(y) {
    if (!dragging || !rowH) return
    const now = performance.now()
    const dt = now - lastT
    if (dt < 8) return
    // A stalled finger has no throw left in it.
    if (dt > 120) velocity = 0
    const v = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, (lastY - y) / dt))
    velocity = velocity * 0.6 + v * 0.4
    lastY = y
    lastT = now
    if (Math.abs(y - startY) > TAP_SLOP) moved = true
    setOffset(rubber(startOffset - (y - startY)))
  }

  function dragEnd() {
    if (!dragging) return
    dragging = false
    settle()
  }

  function onTouchStart(e) {
    if (e.touches.length === 1) dragStart(e.touches[0].clientY)
  }

  function onTouchMove(e) {
    if (e.touches.length !== 1) return
    if (e.cancelable) e.preventDefault()
    dragMove(e.touches[0].clientY)
  }

  function onMouseMove(e) {
    dragMove(e.clientY)
  }

  function onMouseUp() {
    dragEnd()
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  function onMouseDown(e) {
    if (e.button !== 0) return
    e.preventDefault()
    dragStart(e.clientY)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function onWheel(e) {
    if (e.cancelable) e.preventDefault()
    stopAnim()
    velocity = 0
    setOffset(hardClamp(offset + e.deltaY * 0.5))
    clearTimeout(wheelTimer)
    wheelTimer = window.setTimeout(settle, 140)
  }

  // A tap on a name above or below the centre line brings it to the centre.
  // A drag also ends in a click, so the travel that made it a drag vetoes it.
  function onRowTap(event) {
    if (moved) {
      moved = false
      return
    }
    const row = event.target.closest?.('.option-item')
    if (!row || !event.currentTarget.contains(row)) return
    const i = Number(row.dataset.index)
    if (Number.isInteger(i) && i !== activeIndex) goTo(i)
  }

  // One focusable listbox, arrows move the band - the names themselves are not
  // controls, they are positions on the wheel.
  function onKeyDown(event) {
    const k = event.key
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      event.preventDefault()
      goTo(activeIndex + (k === 'ArrowDown' ? 1 : -1))
    } else if (k === 'Home') {
      event.preventDefault()
      goTo(0)
    } else if (k === 'End') {
      event.preventDefault()
      goTo(options.length - 1)
    }
  }

  // The band holds its old names for the length of the close, timed here rather
  // than read off a transition end: an engine that never animates never fires
  // that event, and a stranded flag keeps the band shut on the next open.
  $effect(() => {
    if (!collapsing) return
    const timer = window.setTimeout(() => { collapsing = false }, 340)
    return () => clearTimeout(timer)
  })

  $effect(() => {
    if (open) displayOptions = [...options]
  })

  $effect(() => {
    if (open && !prevOpen) {
      collapsing = false
      measure()
      const i = Math.max(0, options.indexOf(selected))
      activeIndex = i
      onHighlight(options[i] ?? '')
      offset = i * rowH
      apply()
    } else if (!open && prevOpen) {
      collapsing = true
      stopAnim()
    }
    prevOpen = open
  })

  // Rows are sized from the box, so whenever the box changes (viewport, keyboard,
  // rotation) recompute the row height and re-snap, or names drift off the centre.
  $effect(() => {
    const el = listEl
    if (!el) return
    const onResize = () => {
      measure()
      if (!rowH) return
      const i = Math.max(0, Math.min(options.length - 1, Math.round(offset / rowH)))
      offset = i * rowH
      apply()
    }
    let ro = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize)
      ro.observe(el)
    } else {
      window.addEventListener('resize', onResize)
    }
    return () => {
      if (ro) ro.disconnect()
      else window.removeEventListener('resize', onResize)
    }
  })

  $effect(() => () => {
    stopAnim()
    clearTimeout(wheelTimer)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  })

  // Text opacity is purely distance-from-centre; show/hide is the reveal only.
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
  tabindex={open ? 0 : -1}
  style={box(path) + paint(path)}
  ontouchstart={onTouchStart}
  ontouchmove={onTouchMove}
  ontouchend={dragEnd}
  ontouchcancel={dragEnd}
  onmousedown={onMouseDown}
  onwheel={onWheel}
  onclick={onRowTap}
  onkeydown={onKeyDown}
>
  <div class="wheel-reveal">
    {#if ArtComp}
      <div class="art-layer"><ArtComp {...artProps} /></div>
    {/if}
    <div class="wheel-track" bind:this={trackEl}>
      {#each displayOptions as option, i (option)}
        <div
          class="option-item"
          class:active={open && i === activeIndex}
          style="opacity: {itemOpacity(i)}; {s(path)}"
          role="option"
          aria-selected={i === activeIndex}
          data-index={i}
        >{option}</div>
      {/each}
    </div>
  </div>
</div>

<style>
  .option-list {
    position: absolute;
    overflow: hidden;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
    pointer-events: none;
  }

  .option-list.revealing {
    pointer-events: auto;
  }

  /* The band grows from the centre line. It is its own element so the box keeps
     its size and the art inside it reveals with the names, as before. */
  .wheel-reveal {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform-origin: 50% 50%;
    transform: scaleY(0);
  }

  /* Two dead rows above and below: without them the first and last name can
     never reach the centre line, so they can never be confirmed. */
  .wheel-track {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding-top: calc(var(--wheel-row, 0px) * 2);
    padding-bottom: calc(var(--wheel-row, 0px) * 2);
    will-change: transform;
  }

  .art-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 0;
  }

  .option-item {
    height: var(--wheel-row, 0px);
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

  /* The centre row is already showing the next prompt while the band collapses.
     Any name still inside it would land on top of that text. */
  .option-list.collapsing .option-item {
    color: transparent;
  }
</style>
