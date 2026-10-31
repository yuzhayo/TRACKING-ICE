/* Text translator.
   public/text.json is the single source of every visible string and its
   typography, so the operator can change any text (and its size/align) by
   editing that file alone - no code change. Mirrors lib/layout.svelte.ts.

   A node may carry:
     text     -> the string shown
     fontSize -> CSS font-size value (e.g. "4cqi", "min(5cqi, 35cqb)")
     fontWeight -> CSS font-weight value (e.g. "400", "700")
     align    -> CSS text-align value (left | center | right)
     ...or a plain string (a leaf label)

   t('wheel.prompt.ba')  -> the string at that path
   s('wheel.row2')       -> "font-size: ...; font-weight: ...; text-align: ...;"

   A missing key fails visibly: t() returns "[[path]]" and logs, so a typo or a
   dropped string shows up on screen instead of silently using old code text.
*/

import { cqToVars } from './cq-units'

type TextNode = string | { text?: string; fontSize?: string; fontWeight?: string; align?: string; [k: string]: unknown }
type TextTree = Record<string, TextNode>

const TEXT_CACHE_KEY = 'text:v1'

function readCache(): TextTree | null {
  try {
    const raw = localStorage.getItem(TEXT_CACHE_KEY)
    return raw ? (JSON.parse(raw) as TextTree) : null
  } catch {
    return null
  }
}

function writeCache(tree: TextTree): void {
  try {
    localStorage.setItem(TEXT_CACHE_KEY, JSON.stringify(tree))
  } catch {
    // storage unavailable; the fetched copy still drives this session
  }
}

let tree = $state<TextTree>(readCache() ?? {})

export async function loadText(): Promise<TextTree> {
  try {
    const res = await fetch('/text.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as TextTree
    writeCache(data)
    tree = data
    return data
  } catch {
    const cached = readCache()
    if (cached) tree = cached
    return tree
  }
}

function resolve(path: string): TextNode | undefined {
  const parts = path.split('.')
  let level: TextTree | undefined = tree
  let node: TextNode | undefined
  for (const part of parts) {
    if (!level) return undefined
    node = level[part]
    if (node === undefined) return undefined
    level = typeof node === 'string' ? undefined : (node as TextTree)
  }
  return node
}

export function t(path: string): string {
  const node = resolve(path)
  if (typeof node === 'string') return node
  if (node && typeof node.text === 'string') return node.text
  console.error(`[text] missing string "${path}" - check public/text.json`)
  return `[[${path}]]`
}

export function s(path: string): string {
  const node = resolve(path)
  if (!node || typeof node === 'string') {
    console.error(`[text] missing style node "${path}" - check public/text.json`)
    return ''
  }
  const parts: string[] = []
  if (node.fontSize) parts.push(`font-size: ${cqToVars(node.fontSize)}`)
  if (node.fontWeight) parts.push(`font-weight: ${node.fontWeight}`)
  if (node.align) parts.push(`text-align: ${node.align}`)
  return parts.join('; ') + ';'
}

// A list of strings (e.g. the weekday headers). Missing key fails visibly.
export function list(path: string): string[] {
  const node = resolve(path) as unknown
  if (Array.isArray(node)) return node as string[]
  console.error(`[text] missing list "${path}" - check public/text.json`)
  return []
}
