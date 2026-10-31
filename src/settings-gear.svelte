<script>
  import { onMount } from 'svelte';

  let open = $state(false);
  let deferredPrompt = $state(null);
  let installed = $state(false);
  let canInstall = $state(false);
  let clearing = $state(false);
  let dismissedUntil = $state(0);

  function recompute() {
    if (installed) {
      canInstall = false;
      return;
    }
    canInstall = !!deferredPrompt && Date.now() >= dismissedUntil;
  }

  onMount(() => {
    dismissedUntil = Number(localStorage.getItem('ice_install_dismissed_until') || '0');
    installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    const onPrompt = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      recompute();
    };

    window.addEventListener('beforeinstallprompt', onPrompt);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
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

<div class="gearTop">
  <button class="gearBtn" type="button" aria-label="Settings" onclick={() => (open = !open)}>⚙</button>
  {#if open}
    <div class="gearMenu">
      <div class="gearRow"><strong>Installed:</strong> {installed ? 'Yes' : 'No'}</div>
      {#if !installed && canInstall}
        <button type="button" class="gearAction" onclick={install}>Install app</button>
      {:else if !installed}
        <div class="gearLine">Use Chrome: Menu → Add to Home screen.</div>
      {/if}
      <button type="button" class="gearAction danger" disabled={clearing} onclick={clearCache}>
        {clearing ? 'Clearing...' : 'Clear cache & reload'}
      </button>
    </div>
  {/if}
</div>

<style>
  .gearTop {
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
  .gearBtn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(5, 7, 12, 0.75);
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    backdrop-filter: blur(2px);
    line-height: 1;
  }
  .gearMenu {
    margin-top: 6px;
    min-width: 220px;
    padding: 10px;
    border-radius: 12px;
    background: rgba(10, 12, 18, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #fff;
    font-size: 14px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }
  .gearRow {
    padding: 4px 0 8px;
  }
  .gearLine {
    font-size: 12px;
    color: #9aa1ac;
    padding: 4px 0 8px;
  }
  .gearAction {
    width: 100%;
    margin-top: 6px;
    padding: 8px 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    cursor: pointer;
    font-size: 14px;
  }
  .gearAction:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .gearAction.danger {
    border-color: rgba(255, 120, 120, 0.35);
  }
</style>
