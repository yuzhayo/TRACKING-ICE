<script lang="ts">
  import { paint } from './lib/layout.svelte'
  import { t as txt, s } from './lib/text.svelte'
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

  const pointers = new Map<number, { x: number; y: number }>()
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

  function onDown(event: PointerEvent) {
    if (!img || !canvas) return
    try {
      canvas.setPointerCapture(event.pointerId)
    } catch {
      // capture only keeps events flowing when the finger leaves the element
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    prev = pair()
  }

  function onMove(event: PointerEvent) {
    const last = pointers.get(event.pointerId)
    if (!last || !img) return
    const cur = { x: event.clientX, y: event.clientY }
    const iw = img.naturalWidth
    const ih = img.naturalHeight

    if (pointers.size === 1) {
      pointers.set(event.pointerId, cur)
      t = clampPan(
        { ...t, px: t.px + (cur.x - last.x) / frame.w, py: t.py + (cur.y - last.y) / frame.h },
        iw, ih, frame.w, frame.h
      )
      return
    }

    pointers.set(event.pointerId, cur)
    const g = pair()
    const p = prev
    prev = g
    if (!g || !p) return

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
      iw, ih, frame.w, frame.h
    )
  }

  function onUp(event: PointerEvent) {
    pointers.delete(event.pointerId)
    prev = pair()
  }
</script>

<!-- Root placeholder: a 1:1 square that follows the viewport. -->
<div class="frame-cropper" style={paint(path)}>
  <!-- Child placeholder: the 3:4 crop frame. -->
  <div class="crop-area">
    <div class="crop-frame">
      <canvas
        class="crop-surface"
        bind:this={canvas}
        aria-label="Bingkai potong foto"
        onpointerdown={onDown}
        onpointermove={onMove}
        onpointerup={onUp}
        onpointercancel={onUp}
        onpointerleave={onUp}
      ></canvas>
    </div>
  </div>

  <div class="crop-actions">
    <button type="button" class="crop-cancel" style={s('crop.button')} onclick={onCancel}>{txt('crop.cancel')}</button>
    <button type="button" class="crop-ok" style={s('crop.button')} onclick={() => onOk(quantize(t))}>{txt('crop.confirm')}</button>
  </div>
</div>

<style>
  .frame-cropper {
    width: min(100cqw, 100cqh);
    aspect-ratio: 1;
    container-type: size;
    box-sizing: border-box;
    display: grid;
    grid-template-rows: 1fr auto;
    gap: 4%;
    padding: 5%;
    background: #0d1420;
    outline: 0.5cqi solid #c084fc;
    outline-offset: -0.5cqi;
  }

  .crop-area {
    position: relative;
    container-type: size;
    min-height: 0;
    display: grid;
    place-items: center;
  }

  .crop-frame {
    position: relative;
    height: min(100cqh, 133.333cqw);
    aspect-ratio: 3 / 4;
    overflow: hidden;
    background: #0f172a;
    outline: 0.5cqi solid #fb923c;
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

  .crop-actions {
    display: flex;
    gap: 5%;
    width: 100%;
  }

  .crop-actions button {
    flex: 1;
    border: 0;
    padding: 3% 0;
    font: inherit;
    cursor: pointer;
    background: #243047;
    color: #e2e8f0;
  }

  .crop-ok {
    box-shadow: inset 0 0 0 0.35cqi #fb923c;
  }

  .crop-cancel {
    box-shadow: inset 0 0 0 0.35cqi #64748b;
  }

  .crop-actions button:focus-visible {
    outline: 0.4cqi solid #f8fafc;
  }
</style>
