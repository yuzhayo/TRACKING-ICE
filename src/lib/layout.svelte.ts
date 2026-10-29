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

export interface LayoutNode {
  top: number
  left: number
  width: number
  height: number
  z: number
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
