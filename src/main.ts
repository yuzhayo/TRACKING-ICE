import { mount } from 'svelte'
import './app.css'
import App from './app.svelte'
import { installCqPolyfill } from './lib/cq-polyfill'

const target = document.getElementById('app')

if (!target) {
  throw new Error('Missing app mount target')
}

mount(App, { target })
installCqPolyfill()
