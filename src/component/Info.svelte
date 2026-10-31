<script>
  import { onMount } from 'svelte';
  import { box } from '../lib/layout.svelte';

  let {
    src = '/utx_ic_information.png',
    circle = '/utx_btn_common_circle_02.png',
    effectSrc = '/utx_btn_common_circle_02_effect.png',
    hidden = false
  } = $props();

  let open = $state(false);
  let deferredPrompt = $state(null);
  let installed = $state(false);
  let canInstall = $state(false);
  let clearing = $state(false);
  let dismissedUntil = $state(0);

  function recompute() {
    if (installed || hidden) {
      canInstall = false;
      return;
    }
    canInstall = !!deferredPrompt && Date.now() >= dismissedUntil;
  }

  onMount(() => {
    dismissedUntil = Number(localStorage.getItem('ice_install_dismissed_until') || '0');
    installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    function syncQ1() {
      recompute();
    }
    if (hidden) syncQ1();

    const onPrompt = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      recompute();
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  });

  $effect(() => {
    if (hidden) open = false;
    recompute();
  });

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      installed = true;
    } else {
      const next = Date.now() + (7 * 24 * 60 * 60 * 1000);
      localStorage.setItem('ice_install_dismissed_until', String(next));
      dismissedUntil = next;
    }
    deferredPrompt = null;
    recompute();
  }

  async function clearCache() {
    if (!confirm('Clear cache and reload?')) return;
    clearing = true;
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch (err) {
    } finally {
      clearing = false;
      location.reload();
    }
  }
</script>

<div class="infoRoot" style={box('info')} class:isHidden={hidden}>
  <button
    class="infoBtn"
    type="button"
    aria-label="Information"
    style={`background-image: url('${src}');`}
    onclick={() => (open = !open)}
  ></button>

  {#if open}
    <button class="infoBackdrop" type="button" aria-label="Close information" onclick={() => (open = false)}></button>
    <div class="infoMenu" style="top: 100%; right: 0;">
      <div class="infoStatusRow"><strong>Installed:</strong> {installed ? 'Yes' : 'No'}</div>
      {#if !installed && canInstall}
        <button
          type="button"
          class="circleBtn"
          aria-label="Install app"
          style={`background-image: url('${circle}');`}
          onclick={install}
        ></button>
      {:else if !installed}
        <div class="infoLine">
          Use Chrome menu: Add to Home screen.
        </div>
      {/if}
      <button
        type="button"
        class="circleBtn"
        aria-label="Clear cache and reload"
        style={`background-image: url('${effectSrc}');`}
        disabled={clearing}
        onclick={clearCache}
      ></button>
      {#if clearing}
        <div class="infoLine">Clearing cache...</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .infoRoot {
    position: absolute;
    container-type: size;
  }
  .infoRoot.isHidden {
    display: none;
  }
  .infoBtn {
    width: 100%;
    height: 100%;
    border: none;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center;
    cursor: pointer;
    padding: 0;
    line-height: 0;
  }
  .infoBackdrop {
    position: fixed;
    inset: 0;
    background: transparent;
    border: none;
    cursor: default;
    z-index: 99998;
  }
  .infoMenu {
    position: absolute;
    z-index: 99999;
    min-width: 180px;
    padding: 10px;
    margin-top: 6px;
    border-radius: 14px;
    background: rgba(10, 12, 18, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.16);
    color: #fff;
    font-size: 14px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
  }
  .infoStatusRow {
    padding: 4px 0 6px;
  }
  .infoLine {
    font-size: 12px;
    color: #9aa1ac;
    padding: 2px 0 6px;
  }
  .circleBtn {
    width: 48%;
    aspect-ratio: 1 / 1;
    border: none;
    margin: 2%;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center;
    cursor: pointer;
  }
  .circleBtn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
