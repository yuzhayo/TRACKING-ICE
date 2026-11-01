/* On-screen debug panel for phones where no dev tools are available (iPhone).
   Open the site with ?debug at the end of the address, e.g. https://site.netlify.app/?debug
   It lists JS errors, the options-fetch result and the size of the answer list. */

let box: HTMLDivElement | null = null
const lines: string[] = []

const enabled = typeof location !== 'undefined' && /[?&]debug\b/.test(location.search)

function render(): void {
  if (!enabled) return
  if (!box) {
    box = document.createElement('div')
    box.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;max-height:45%;overflow:auto;z-index:99999;' +
      'background:rgba(0,0,0,.88);color:#7CFC90;font:11px/1.35 monospace;padding:6px;' +
      'white-space:pre-wrap;word-break:break-all;pointer-events:auto'
    document.body.appendChild(box)
  }
  box.textContent = lines.join('\n')
}

export function dbg(msg: string): void {
  if (!enabled) return
  lines.push(msg)
  render()
}

export function installDebug(): void {
  if (!enabled) return
  dbg('UA: ' + navigator.userAgent)
  dbg('viewport: ' + window.innerWidth + 'x' + window.innerHeight)
  window.addEventListener('error', (e) => dbg('ERROR: ' + e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno))
  window.addEventListener('unhandledrejection', (e) => dbg('REJECTION: ' + String((e.reason && e.reason.message) || e.reason)))
  window.setTimeout(() => {
    const list = document.querySelector('.option-list') as HTMLElement | null
    const items = document.querySelectorAll('.option-item').length
    dbg('option-list: ' + (list ? list.clientWidth + 'x' + list.clientHeight : 'missing') + ', items: ' + items)
  }, 4000)
}
