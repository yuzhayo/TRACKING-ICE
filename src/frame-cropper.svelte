<script lang="ts">
  import { box, paint } from './lib/layout.svelte'
  import { t as txt, s } from './lib/text.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'
  import {
    IDENTITY,
    ZOOM_MIN,
    ZOOM_MAX,
    clampPan,
    drawCrop,
    loadImg,
    normalizeRot,
    quantize,
    type CropTransform
  } from './lib/crop'

  let {
    path = 'crop',
    src = '',
    initial = null,
    padColor = '#ffffff',
    onOk = () => {},
    onCancel = () => {}
  }: {
    path?: string
    src?: string
    initial?: CropTransform | null
    padColor?: string
    onOk?: (t: CropTransform) => void
    onCancel?: () => void
  } = $props()

  let canvas = $state<HTMLCanvasElement>()
  let img = $state<HTMLImageElement | null>(null)
  let t = $state<CropTransform>(IDENTITY)
  let frame = $state({ w: 0, h: 0 })

  const ArtComp = $derived(renderFor(path))
  const artProps = $derived(propsFor(path))
  const FrameComp = $derived(renderFor(`${path}.frame`))
  const frameProps = $derived(propsFor(`${path}.frame`))
  const CancelComp = $derived(renderFor(`${path}.cancel`))
  const cancelProps = $derived(propsFor(`${path}.cancel`))
  const ConfirmComp = $derived(renderFor(`${path}.confirm`))
  const confirmProps = $derived(propsFor(`${path}.confirm`))

  // Both input paths land in the same map. Pointer events are the modern one;
  // touch events are the fallback for browsers (iOS 12 and older) that have no
  // pointer events at all, so the crop would otherwise be dead there. The first
  // pointer event seen wins, and the touch path stands down for that session.
  const pointers = new Map<string, { x: number; y: number }>()
  let pointerSeen = false
  let prev: { x1: number; y1: number; x2: number; y2: number } | null = null

  $effect(() => {
    const source = src
    if (!source) {
      img = null
      return
    }
    let cancelled = false
    t = initial ?? IDENTITY
    loadImg(source)
      .then((loaded) => { if (!cancelled) img = loaded })
      .catch(() => { if (!cancelled) img = null })
    return () => { cancelled = true }
  })

  // Read the frame's REAL rendered box (3:4 by CSS), never derive one side.
  $effect(() => {
    const el = canvas
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w > 0 && h > 0) frame = { w, h }
    }
    measure()
    // ResizeObserver is Chrome 64+ / Safari 13.1+. Below that the box still has
    // to be tracked, or the crop surface stays at its first size after rotation.
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  })

  $effect(() => {
    if (!canvas || !img || frame.w <= 0 || frame.h <= 0) return
    const dpr = Math.min(3, window.devicePixelRatio || 1)
    canvas.width = Math.round(frame.w * dpr)
    canvas.height = Math.round(frame.h * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCrop(ctx, img, t, canvas.width, canvas.height, padColor)
  })

  function pair() {
    const pts = [...pointers.values()]
    if (pts.length < 2) return null
    return { x1: pts[0].x, y1: pts[0].y, x2: pts[1].x, y2: pts[1].y }
  }

  function addPoint(id: string, x: number, y: number) {
    pointers.set(id, { x, y })
    prev = pair()
  }

  function dropPoint(id: string) {
    pointers.delete(id)
    prev = pair()
  }

  // One point moving is a pan, applied per point so a two-finger drag pans from
  // whichever finger reported last.
  function movePoint(id: string, x: number, y: number) {
    const last = pointers.get(id)
    if (!last || !img) return
    pointers.set(id, { x, y })
    if (pointers.size !== 1) return
    t = clampPan(
      { ...t, px: t.px + (x - last.x) / frame.w, py: t.py + (y - last.y) / frame.h },
      img.naturalWidth, img.naturalHeight, frame.w, frame.h
    )
  }

  // Two points: rotate and pinch about the midpoint of the pair.
  function applyPair() {
    if (pointers.size < 2) {
      prev = pair()
      return
    }
    const g = pair()
    const p = prev
    prev = g
    if (!g || !p || !img) return

    const v1x = p.x2 - p.x1
    const v1y = p.y2 - p.y1
    const v2x = g.x2 - g.x1
    const v2y = g.y2 - g.y1
    const d1 = Math.hypot(v1x, v1y)
    const d2 = Math.hypot(v2x, v2y)
    if (d1 <= 0 || d2 <= 0) return

    const dRot = Math.atan2(v1x * v2y - v1y * v2x, v1x * v2x + v1y * v2y) * (180 / Math.PI)
    const dmx = (g.x1 + g.x2) / 2 - (p.x1 + p.x2) / 2
    const dmy = (g.y1 + g.y2) / 2 - (p.y1 + p.y2) / 2

    t = clampPan(
      {
        rot: normalizeRot(t.rot + dRot),
        zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, t.zoom * (d2 / d1))),
        px: t.px + dmx / frame.w,
        py: t.py + dmy / frame.h
      },
      img.naturalWidth, img.naturalHeight, frame.w, frame.h
    )
  }

  function onDown(event: PointerEvent) {
    if (!img || !canvas) return
    pointerSeen = true
    try {
      canvas.setPointerCapture(event.pointerId)
    } catch {
      // capture only keeps events flowing when the finger leaves the element
    }
    addPoint(String(event.pointerId), event.clientX, event.clientY)
  }

  function onMove(event: PointerEvent) {
    pointerSeen = true
    movePoint(String(event.pointerId), event.clientX, event.clientY)
    applyPair()
  }

  function onUp(event: PointerEvent) {
    dropPoint(String(event.pointerId))
  }

  function onTouchStart(event: TouchEvent) {
    if (pointerSeen || !img) return
    if (event.cancelable) event.preventDefault()
    for (const touch of Array.from(event.changedTouches)) {
      addPoint(`t${touch.identifier}`, touch.clientX, touch.clientY)
    }
  }

  // A touch event can carry several fingers at once, so every point is written
  // before the pair is compared - otherwise the second finger pans twice.
  function onTouchMove(event: TouchEvent) {
    if (pointerSeen) return
    if (event.cancelable) event.preventDefault()
    for (const touch of Array.from(event.changedTouches)) {
      movePoint(`t${touch.identifier}`, touch.clientX, touch.clientY)
    }
    applyPair()
  }

  function onTouchEnd(event: TouchEvent) {
    if (pointerSeen) return
    for (const touch of Array.from(event.changedTouches)) {
      dropPoint(`t${touch.identifier}`)
    }
  }
</script>

<!-- Root placeholder: a 1:1 square that follows the viewport. -->
<div class="frame-cropper" style={paint(path)}>
  {#if ArtComp}
    <div class="crop-art"><ArtComp {...artProps} /></div>
  {/if}
  <!-- Child placeholder: the 3:4 crop frame. -->
  <div class="crop-area" style={box(`${path}.frame`)}>
    <div class="crop-frame" style={paint(`${path}.frame`)}>
      <canvas
        class="crop-surface"
        bind:this={canvas}
        aria-label="Bingkai potong foto"
        onpointerdown={onDown}
        onpointermove={onMove}
        onpointerup={onUp}
        onpointercancel={onUp}
        onpointerleave={onUp}
        ontouchstart={onTouchStart}
        ontouchmove={onTouchMove}
        ontouchend={onTouchEnd}
        ontouchcancel={onTouchEnd}
      ></canvas>
      {#if FrameComp}
        <div class="frame-art"><FrameComp {...frameProps} /></div>
      {/if}
    </div>
  </div>

  {#if CancelComp}
    <div class="crop-slot" style={box(`${path}.cancel`)}>
      <CancelComp {...cancelProps} label={txt(`${path}.cancel`)} textStyle={s(`${path}.button`)} onClick={onCancel} />
    </div>
  {/if}
  {#if ConfirmComp}
    <div class="crop-slot" style={box(`${path}.confirm`)}>
      <ConfirmComp {...confirmProps} label={txt(`${path}.confirm`)} textStyle={s(`${path}.button`)} onClick={() => onOk(quantize(t))} />
    </div>
  {/if}
</div>

<style>
  .frame-cropper {
    position: relative;
    width: min(100cqw, 100cqh);
    /* Explicit square, not aspect-ratio (Safari 15+, Chrome 88+). */
    height: min(100cqw, 100cqh);
    container-type: size;
    box-sizing: border-box;
    display: grid;
    padding: 5%;
    background: var(--fill);
    outline: 0.5cqi solid var(--line);
    outline-offset: -0.5cqi;
  }

  .crop-art {
    position: absolute;
    inset: 0%;
    pointer-events: none;
    z-index: 0;
  }

  .crop-area {
    position: absolute;
    z-index: 1;
    container-type: size;
    min-height: 0;
    display: grid;
    place-items: center;
  }

  .crop-frame {
    position: relative;
    height: min(100cqh, 133.333cqw);
    /* Explicit width from the same measure, not aspect-ratio. 3 wide : 4 tall. */
    width: calc(min(100cqh, 133.333cqw) * 0.75);
    overflow: hidden;
    background: #0f172a;
    outline: 0.5cqi solid var(--line);
    outline-offset: -0.5cqi;
  }

  .crop-surface {
    position: absolute;
    inset: 0%;
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    cursor: grab;
    -webkit-tap-highlight-color: transparent;
  }

  .crop-surface:active {
    cursor: grabbing;
  }

  /* The 512x512 dialog frame stretched over the 3:4 box, above the photo. */
  .frame-art {
    position: absolute;
    inset: 0%;
    z-index: 2;
    pointer-events: none;
  }

  .crop-slot {
    position: absolute;
  }
</style>
