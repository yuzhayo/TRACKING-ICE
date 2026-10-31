<script>
  import { onMount } from 'svelte';

  let open = $state(false);
  let deferredPrompt = $state(null);
  let installed = $state(false);
  let canInstall = $state(false);
  let clearing = $state(false);
  let dismissedUntil = $state(0);
  let q1Answered = $state(false);

  function recompute() {
    if (installed || q1Answered) {
      canInstall = false;
      return;
    }
    canInstall = !!deferredPrompt && Date.now() >= dismissedUntil;
  }

  onMount(() => {
    dismissedUntil = Number(localStorage.getItem('ice_install_dismissed_until') || '0');
    installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    function syncQ1() {
      q1Answered = document.body.dataset.q1Answered === '1';
      recompute();
    }
    syncQ1();
    const q1Observer = new MutationObserver(syncQ1);
    q1Observer.observe(document.body, { attributes: true, attributeFilter: ['data-q1-answered'] });

    const onPrompt = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      syncQ1();
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => {
      q1Observer.disconnect();
      window.removeEventListener('beforeinstallprompt', onPrompt);
    };
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
      // no action; reload anyway
    } finally {
      clearing = false;
      location.reload();
    }
  }
</script>

<div class="infoRoot" class:isHidden={q1Answered}>
  <button
    class="infoBtn"
    type="button"
    aria-label="Information"
    onclick={() => (open = !open)}
  >
    <span class="infoIcon" aria-hidden="true"></span>
  </button>

  {#if open}
    <button class="infoBackdrop" type="button" aria-label="Close information" onclick={() => (open = false)}></button>

    <div class="infoMenu" >
      <div class="infoStatusRow"><strong>Installed:</strong> {installed ? 'Yes' : 'No'}</div>

      {#if !installed && canInstall}
        <button type="button" class="circleBtn" aria-label="Install app" onclick={install}></button>
      {:else if !installed}
        <div class="infoLine">
          Use Chrome: menu → Add to Home screen.
        </div>
      {/if}

      <button
        type="button"
        class="circleBtn effectBtn"
        aria-label="Clear cache and reload"
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
    position: fixed;
    top: env(safe-area-inset-top, 0dvh);
    right: env(safe-area-inset-right, 0dvw);
    z-index: 99999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: 4px;
    font-family: system-ui, sans-serif;
  }
  .infoRoot.isHidden {
    display: none;
  }
  .infoBtn {
    width: 64px;
    height: 64px;
    border: none;
    background: url('/utx_ic_information.png') center/100% 100% no-repeat;
    cursor: pointer;
    padding: 0;
    line-height: 0;
  }
  .infoBtn .infoIcon {
    display: none;
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
    position: relative;
    z-index: 99999;
    min-width: 190px;
    padding: 10px;
    margin-top: 8px;
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
    width: 96px;
    height: 96px;
    border: none;
    margin: 4px;
    background: url('/utx_btn_common_circle_02.png') center/100% 100% no-repeat;
    cursor: pointer;
    transition: transform 0.08s ease;
  }
  .circleBtn:hover,
  .circleBtn:active {
    background-image: url('/utx_btn_common_circle_02_effect.png');
    transform: scale(1.02);
  }
  .circleBtn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .effectBtn {
    opacity: 0.95;
  }
</style>
