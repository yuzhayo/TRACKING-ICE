<script>
  import { box, paint } from './lib/layout.svelte'

  let {
    path = '',
    onClick = () => {}
  } = $props()
</script>

<button
  class="confirm-area"
  type="button"
  aria-label="Konfirmasi pilihan"
  style={box(path) + paint(path)}
  onclick={onClick}
></button>

<style>
  .confirm-area {
    position: absolute;
    container-type: size;
    margin: 0;
    padding: 0;
    border: 0;
    background: var(--fill);
    outline: 0.5cqi solid var(--line);
    outline-offset: -0.5cqi;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
</style>
