<script>
  import { onMount } from 'svelte';
  import Mainscreen from './mainscreen.svelte';
  import SettingsGear from './settings-gear.svelte';

  let pullY = $state(0);
  let refreshing = $state(false);

  onMount(() => {
    let startY = 0;
    let tracking = false;

    function reset() {
      pullY = 0;
      tracking = false;
    }

    function start(e) {
      if (window.scrollY === 0 && e.touches && e.touches.length === 1) {
        startY = e.touches[0].clientY;
        tracking = true;
      } else {
        tracking = false;
      }
    }

    function move(e) {
      if (!tracking || !e.touches || e.touches.length !== 1) return;
      const dy = e.touches[0].clientY - startY;
      if (dy < 0) {
        reset();
        return;
      }
      if (e.cancelable) e.preventDefault();
      pullY = Math.min(150, Math.max(0, dy * 0.65));
    }

    async function end() {
      if (!tracking) {
        reset();
        return;
      }
      const shouldRefresh = pullY >= 88;
      if (!shouldRefresh) {
        reset();
        return;
      }

      refreshing = true;
      tracking = false;
      pullY = 44;

      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        if (navigator.serviceWorker) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
      } catch {
        // no action; reload anyway
      } finally {
        refreshing = false;
        location.reload();
      }
    }

    window.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end, { passive: true });
    window.addEventListener('touchcancel', reset, { passive: true });

    return () => {
      window.removeEventListener('touchstart', start);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', reset);
    };
  });
</script>

{#if pullY > 0 || refreshing}
  <div class="pullStatus" style={`transform: translateY(${Math.min(44, pullY * 0.4)}px)`}>
    {refreshing ? 'Reloading...' : (pullY >= 88 ? 'Release to refresh' : 'Pull to refresh')}
  </div>
{/if}

<main class="app">
  <Mainscreen />
  <SettingsGear />
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
    overscroll-behavior-y: contain;
  }
  .pullStatus {
    position: fixed;
    left: 50%;
    top: 0;
    transform: translate(-50%, -100%);
    z-index: 100000;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 12px;
    color: #fff;
    background: rgba(10, 12, 18, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.16);
    pointer-events: none;
    font-family: system-ui, sans-serif;
  }
</style>
