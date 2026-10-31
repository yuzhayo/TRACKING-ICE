import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { legacyCss } from './plugins/legacy-css'

export default defineConfig({
  plugins: [legacyCss(), svelte()],
  build: {
    // Vite 8 default is chrome111+/safari16.4+, which leaves ?? and ?. untouched
    // and breaks older Android browsers. Lower it so esbuild transpiles them.
    target: ['es2017', 'chrome61', 'safari11'],
    cssTarget: 'chrome61'
  }
})
