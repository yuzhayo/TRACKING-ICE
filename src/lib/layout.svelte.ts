/* Layout translator.
   public/layout.json is the single source of geometry. Every placeholder and
   child box reads its position/size/layer from here, so the operator can move
   anything by editing that file alone - no code change.

   Coordinates are percentages of the DIRECT parent:
     top    -> node's top edge, % down from the parent's top
     left   -> node's left edge, % from the parent's left
     width  -> % of the parent's width
     height -> % of the parent's height
     z      -> stacking layer

   box('wheel') resolves a top-level node; box('wheel.row2') resolves a child.
*/

export interface StyleSpec {
  on: boolean
  color: string
  opacity: number
}

export interface LayoutNode {
  top: number
  left: number
  width: number
  height: number
  z: number
  outline?: StyleSpec
  placeholder?: StyleSpec
  children?: Record<string, LayoutNode>
}

export type LayoutTree = Record<string, LayoutNode>

const LAYOUT_CACHE_KEY = 'layout:v1'

function readCache(): LayoutTree | null {
  try {
    const raw = localStorage.getItem(LAYOUT_CACHE_KEY)
    return raw ? (JSON.parse(raw) as LayoutTree) : null
  } catch {
    return null
  }
}

function writeCache(tree: LayoutTree): void {
  try {
    localStorage.setItem(LAYOUT_CACHE_KEY, JSON.stringify(tree))
  } catch {
    // storage unavailable; the fetched copy still drives this session
  }
}

// Seed from the last-fetched layout so the first paint already has geometry.
let tree = $state<LayoutTree>(readCache() ?? {})

export function setLayout(next: LayoutTree): void {
  tree = next
}

export async function loadLayout(): Promise<LayoutTree> {
  try {
    const res = await fetch('/layout.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as LayoutTree
    writeCache(data)
    tree = data
    return data
  } catch {
    const cached = readCache()
    if (cached) tree = cached
    return tree
  }
}

function resolve(path: string): LayoutNode | null {
  const parts = path.split('.')
  let map: Record<string, LayoutNode> | undefined = tree
  let node: LayoutNode | null = null
  for (const part of parts) {
    if (!map) return null
    node = map[part] ?? null
    if (!node) return null
    map = node.children
  }
  return node
}

// A missing key is a config error: hide the node and say so loudly, never
// fall back to a hardcoded number.
export function box(path: string): string {
  const node = resolve(path)
  if (!node) {
    console.error(`[layout] missing node "${path}" - check public/layout.json`)
    return 'display: none;'
  }
  return (
    `left: ${node.left}%; top: ${node.top}%; ` +
    `width: ${node.width}%; height: ${node.height}%; z-index: ${node.z};`
  )
}

function hexToRgb(hex: string): [number, number, number] | null {
  const h = (hex || '').trim().replace('#', '')
  if (/^[0-9a-f]{3}$/i.test(h)) {
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
  }
  if (/^[0-9a-f]{6}$/i.test(h)) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  return null
}

// on:false OR opacity:0 OR a bad color -> fully transparent (nothing painted).
function layerRgba(spec: StyleSpec | undefined): string {
  if (!spec || !spec.on) return 'transparent'
  const rgb = hexToRgb(spec.color)
  if (!rgb) return 'transparent'
  const a = Math.max(0, Math.min(100, Number(spec.opacity) || 0)) / 100
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`
}

// Two custom properties a placeholder's CSS consumes:
//   --line -> the outline color (border)
//   --fill -> the placeholder color (box background)
// Set them with style={box(path) + paint(path)}.
export function paint(path: string): string {
  const node = resolve(path)
  if (!node) return ''
  return `--line: ${layerRgba(node.outline)}; --fill: ${layerRgba(node.placeholder)};`
}
