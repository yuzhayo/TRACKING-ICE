/* Content translator (the "what renders" plane).
   public/content.json decides, per placeholder, what is rendered inside it -
   the same idea as layout.json (geometry) and text.json (copy). The placeholder
   asks renderFor(path); if content.json names a component for that path, it gets
   the component, otherwise null (so it can keep its outline placeholder).

   content.json is flat: each key is a placeholder path, each value { render }.
     "action.reset": { "render": "btn" }

   The key -> component map (the registry) is code, because a component has to be
   imported somewhere. The DECISION of which placeholder renders which component
   stays in content.json - the operator edits that, not this file, to rewire.
   Adding a new cooked component = import it here + add it to the registry +
   point a content.json key at it. Nothing else changes.
*/

import Btn from '../component/Btn.svelte'
import Image from '../component/Image.svelte'
import Pil from '../component/Pil.svelte'
import PilJawaban from '../component/PilJawaban.svelte'
import Popup from '../component/Popup.svelte'
import PickerBtn from '../component/PickerBtn.svelte'
import PickerGlow from '../component/PickerGlow.svelte'

/* The registry only makes a component REACHABLE by key. Which placeholder
   renders which key is public/content.json's decision, and nothing is pointed
   at these yet - the operator dictates that mapping.

   picker_btn and picker_glow are the two pieces taken out of the old PWA wheel.
   Each is a stack of sprites and draws ONE instance, so a placeholder above the
   wheel and one below it are two placeholders, not one mirrored component. */
const registry: Record<string, unknown> = {
  btn: Btn,
  image: Image,
  pil: Pil,
  jawaban: PilJawaban,
  popup: Popup,
  picker_btn: PickerBtn,
  picker_glow: PickerGlow
}

type ContentNode = { render?: string; [prop: string]: unknown }
type ContentDoc = Record<string, ContentNode>

const CONTENT_CACHE_KEY = 'content:v1'

function readCache(): ContentDoc | null {
  try {
    const raw = localStorage.getItem(CONTENT_CACHE_KEY)
    return raw ? (JSON.parse(raw) as ContentDoc) : null
  } catch {
    return null
  }
}

function writeCache(doc: ContentDoc): void {
  try {
    localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(doc))
  } catch {
    // storage unavailable; the fetched copy still drives this session
  }
}

let doc = $state<ContentDoc>(readCache() ?? {})

export function setContent(next: ContentDoc): void {
  doc = next
}

export async function loadContent(): Promise<ContentDoc> {
  try {
    const res = await fetch('/content.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as ContentDoc
    writeCache(data)
    doc = data
    return data
  } catch {
    const cached = readCache()
    if (cached) doc = cached
    return doc
  }
}

// The component registered for a placeholder path, or null to keep the outline.
// Typed any: the registry lookup is dynamic; the caller renders it as <Comp>.
export function renderFor(path: string): any {
  const node = doc[path]
  if (!node || !node.render) return null
  const Comp = registry[node.render]
  if (!Comp) {
    console.error(`[content] no component registered for render key "${node.render}" (path "${path}")`)
    return null
  }
  return Comp
}

// The inputs a content.json entry carries for its component, minus "render".
// e.g. { "render": "image", "src": "/bg.jpg" } -> { src: "/bg.jpg" }
export function propsFor(path: string): Record<string, unknown> {
  const node = doc[path]
  if (!node) return {}
  const { render, ...props } = node
  return props
}
