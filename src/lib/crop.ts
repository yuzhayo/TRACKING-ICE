/* Crop transform contract - ported from PWA/src/lib/crop.ts.
   The frame is fixed; the photo moves inside it. Only four numbers leave here:
   rot (deg clockwise), zoom (1.0 = whole image fits the frame), px, py
   (fractions of frame width/height). Operation order, identical on both sides:
     image centred in the frame (zoom 1.0) -> rotate about the frame centre
     -> shift by px, py.
   Everything is relative to the frame, so the render is resolution-independent
   and the PC can reconstruct the cut from these numbers alone. */

export interface CropTransform {
  rot: number
  zoom: number
  px: number
  py: number
}

export const IDENTITY: CropTransform = { rot: 0, zoom: 1, px: 0, py: 0 }

export const ZOOM_MIN = 0.3
export const ZOOM_MAX = 10

const DEG = Math.PI / 180

/** Base scale: the whole image fits inside the frame (contain). */
export function baseScale(imgW: number, imgH: number, frameW: number, frameH: number): number {
  return Math.min(frameW / imgW, frameH / imgH)
}

/** The frame centre must stay on the image, so a swipe can't send an empty box. */
export function clampPan(
  t: CropTransform,
  imgW: number,
  imgH: number,
  frameW: number,
  frameH: number
): CropTransform {
  const s = baseScale(imgW, imgH, frameW, frameH) * t.zoom
  const vx = Math.cos(-t.rot * DEG) * -t.px * frameW - Math.sin(-t.rot * DEG) * -t.py * frameH
  const vy = Math.sin(-t.rot * DEG) * -t.px * frameW + Math.cos(-t.rot * DEG) * -t.py * frameH

  let k = 1
  if (Math.abs(vx) > s * (imgW / 2)) k = (s * (imgW / 2)) / Math.abs(vx)
  if (Math.abs(vy) > s * (imgH / 2)) k = Math.min(k, (s * (imgH / 2)) / Math.abs(vy))
  if (k >= 1) return t

  return { ...t, px: t.px * k, py: t.py * k }
}

export function normalizeRot(deg: number): number {
  let d = deg % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return Math.round(d * 100) / 100
}

/** Four decimals are enough for sub-pixel position and keep the payload small. */
export function quantize(t: CropTransform): CropTransform {
  const r = (n: number) => Math.round(n * 10000) / 10000
  return { rot: normalizeRot(t.rot), zoom: r(t.zoom), px: r(t.px), py: r(t.py) }
}

export function drawCrop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  t: CropTransform,
  frameW: number,
  frameH: number,
  padColor: string
): void {
  const imgW = img.naturalWidth
  const imgH = img.naturalHeight
  if (!imgW || !imgH) return

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = padColor
  ctx.fillRect(0, 0, frameW, frameH)

  const s = baseScale(imgW, imgH, frameW, frameH) * t.zoom
  ctx.translate(frameW / 2 + t.px * frameW, frameH / 2 + t.py * frameH)
  ctx.rotate(t.rot * DEG)
  ctx.scale(s, s)
  ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

export function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Gambar sumber gagal dimuat.'))
    img.src = src
  })
}

export function renderCrop(
  img: HTMLImageElement,
  t: CropTransform,
  frameW: number,
  frameH: number,
  padColor: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(frameW))
  canvas.height = Math.max(1, Math.round(frameH))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Browser gagal menggambar kanvas crop.')
  drawCrop(ctx, img, t, canvas.width, canvas.height, padColor)
  return canvas
}

/** Data URL of the crop at a given frame size - used for the row-5 preview. */
export function cropDataUrl(
  img: HTMLImageElement,
  t: CropTransform,
  frameW: number,
  frameH: number,
  padColor: string,
  quality: number
): string {
  return renderCrop(img, t, frameW, frameH, padColor).toDataURL('image/jpeg', quality)
}
