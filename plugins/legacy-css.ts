import type { Plugin } from 'vite'
import { cqToVars } from '../src/lib/cq-units'

/* Source-level CSS compatibility for old Android browsers. Runs on .svelte
   and .css files before Svelte/Vite process them. */
export function legacyCss(): Plugin {
  return {
    name: 'legacy-css',
    enforce: 'pre',
    transform(code, id) {
      const file = id.split('?')[0]
      if (!file.endsWith('.svelte') && !file.endsWith('.css')) return null
      if (file.includes('node_modules')) return null
      let out = code

      // container query units -> calc(var(--cqX) * n)
      out = cqToVars(out)
      // mark container elements so the runtime polyfill can find them
      out = out.replace(/container-type\s*:\s*size\s*;/g, 'container-type: size; --cq-box: 1;')

      // inset: V  (Chrome 87+)  -> four longhands
      out = out.replace(/(^|[\s;{])inset\s*:\s*([^\s;}]+)\s*;/g,
        (_m, pre: string, v: string) => `${pre}top: ${v}; right: ${v}; bottom: ${v}; left: ${v};`)
      // padding-inline / padding-block with one value (Chrome 87+)
      out = out.replace(/(^|[\s;{])padding-inline\s*:\s*([^\s;}]+)\s*;/g,
        (_m, pre: string, v: string) => `${pre}padding-left: ${v}; padding-right: ${v};`)
      out = out.replace(/(^|[\s;{])padding-block\s*:\s*((?:[^;}(]|\([^)]*\))+?)\s*;/g,
        (_m, pre: string, v: string) => `${pre}padding-top: ${v}; padding-bottom: ${v};`)
      // dvh/dvw: add a vh fallback line; neutralise the 0dvh/0dvw env() fallbacks
      out = out.replace(/0dv[hw]/g, '0px')
      out = out.replace(/(^|[\s;{])min-height\s*:\s*100dvh\s*;/g,
        (_m, pre: string) => `${pre}min-height: 100vh; min-height: 100dvh;`)
      return { code: out, map: null }
    }
  }
}
