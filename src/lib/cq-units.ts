/* Rewrites container-query units (cqw/cqh/cqi/cqb) into calc() over CSS custom
   properties, so they work on browsers without container queries (< Chrome 105).
   The variables are filled in by src/lib/cq-polyfill.ts. Before that runs, the
   fallback is the viewport unit, so the first paint is already close. */

const FALLBACK: Record<string, string> = { cqw: '1vw', cqh: '1vh', cqi: '1vw', cqb: '1vh' }

export function cqToVars(css: string): string {
  return css.replace(/(-?\d*\.?\d+)(cq[wihb])\b/g, (_m, n: string, u: string) => {
    return `calc(var(--${u}, ${FALLBACK[u]}) * ${n})`
  })
}
