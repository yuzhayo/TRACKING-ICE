<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    open = false,
    children,
    onClose = () => {},
    dismissible = true
  }: {
    open?: boolean
    children?: Snippet
    onClose?: () => void
    dismissible?: boolean
  } = $props()

  let dialog = $state<HTMLDialogElement>()

  $effect(() => {
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  })

  // Tap anywhere closes the popup, except on an interactive control (a button),
  // so the date grid's nav and cells keep working.
  function handleClick(event: MouseEvent) {
    if (!dismissible) return
    const target = event.target as HTMLElement | null
    if (target && target.closest('button')) return
    onClose()
  }
</script>

<dialog bind:this={dialog} class="popup-placeholder" aria-label="Popup" onclick={handleClick} onclose={onClose}>
  <section class="popup-panel">
    <div class="popup-content">
      {#if children}{@render children()}{/if}
    </div>
  </section>
</dialog>

<style>
  .popup-placeholder {
    position: fixed;
    inset: 0%;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: #e2e8f0;
    overflow: auto;
  }

  .popup-placeholder[open] {
    display: grid;
    place-items: center;
  }

  .popup-placeholder::backdrop {
    background: rgba(5, 7, 12, 0.8);
  }

  .popup-panel {
    container-type: size;
    box-sizing: border-box;
    width: min(92%, 110dvh);
    height: min(82%, 125dvw);
    background: #0d1420;
    outline: 0.3dvi solid #c084fc;
    outline-offset: 0;
  }

  .popup-content {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 3%;
  }
</style>
