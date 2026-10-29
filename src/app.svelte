<script>
  import Mainscreen from './mainscreen.svelte'
</script>

<main class="app">
  <Mainscreen />
</main>

<style>
  .app {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100dvh;
    padding-top: env(safe-area-inset-top, 0dvh);
    padding-right: env(safe-area-inset-right, 0dvw);
    padding-bottom: env(safe-area-inset-bottom, 0dvh);
    padding-left: env(safe-area-inset-left, 0dvw);
  }
</style>
