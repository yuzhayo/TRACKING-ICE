/* Runtime half of the container-unit rewrite (see cq-units.ts).
   Every element marked with `--cq-box` is a "container". Its content size is
   written into per-container variables, and a generated rule hands them to its
   direct children as --cqw/--cqh/--cqi/--cqb. Custom properties inherit, so any
   deeper element sees the variables of its NEAREST container, which is exactly
   how real container query units resolve. The container itself keeps its
   parent's values, as the real units do. */

const STYLE_ID = 'cq-polyfill-rules'

let selectors: string[] = []
let ro: ResizeObserver | null = null
let scheduled = false
const observed = new WeakSet<Element>()

function collectSelectors(): string[] {
  const found: string[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    walk(rules, found)
  }
  return found
}

function walk(rules: CSSRuleList, out: string[]): void {
  for (const rule of Array.from(rules)) {
    const r = rule as CSSStyleRule & { cssRules?: CSSRuleList }
    if (r.style && r.selectorText && r.style.getPropertyValue('--cq-box')) {
      for (const sel of r.selectorText.split(',')) out.push(sel.trim())
    } else if (r.cssRules && !r.style) {
      walk(r.cssRules, out)
    }
  }
}

function writeRules(): void {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = selectors
    .map((sel, i) =>
      `${sel} > * { --cqw: var(--cq-w-${i}); --cqh: var(--cq-h-${i}); --cqi: var(--cq-w-${i}); --cqb: var(--cq-h-${i}); }`
    )
    .join('\n')
}

function measure(el: HTMLElement, i: number): void {
  const cs = getComputedStyle(el)
  const w = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0)
  const h = el.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0)
  el.style.setProperty(`--cq-w-${i}`, `${Math.max(0, w) / 100}px`)
  el.style.setProperty(`--cq-h-${i}`, `${Math.max(0, h) / 100}px`)
}

function refresh(): void {
  scheduled = false
  selectors.forEach((sel, i) => {
    let nodes: NodeListOf<HTMLElement>
    try {
      nodes = document.querySelectorAll<HTMLElement>(sel)
    } catch {
      return
    }
    nodes.forEach((el) => {
      measure(el, i)
      if (ro && !observed.has(el)) {
        observed.add(el)
        ro.observe(el)
      }
    })
  })
}

function schedule(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(refresh)
}

function setup(): void {
  const next = collectSelectors()
  if (next.join('|') !== selectors.join('|')) {
    selectors = next
    writeRules()
  }
  schedule()
}

export function installCqPolyfill(): void {
  if (typeof document === 'undefined') return
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement
        selectors.forEach((sel, i) => {
          if (el.matches(sel)) measure(el, i)
        })
      }
    })
  }
  setup()
  // Stylesheets may still be loading on first run; scan again once they are.
  window.addEventListener('load', setup)
  window.addEventListener('resize', schedule)
  window.addEventListener('orientationchange', schedule)
  // Popups and panels mount later: pick up new containers as they appear.
  new MutationObserver(schedule).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  })
}
