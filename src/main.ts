import { mount } from 'svelte'
import './app.css'
import App from './app.svelte'

const target = document.getElementById('app')

if (!target) {
  throw new Error('Missing app mount target')
}

mount(App, { target })
