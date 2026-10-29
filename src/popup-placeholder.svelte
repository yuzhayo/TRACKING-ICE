<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    open = false,
    title,
    children,
    onClose,
    showClose = true
  }: {
    open?: boolean
    title: string
    children: Snippet
    onClose: () => void
    showClose?: boolean
  } = $props()

  let dialog = $state<HTMLDialogElement>()

  $effect(() => {
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  })
</script>

<dialog bind:this={dialog} class="popup-placeholder" aria-label={title} onclose={onClose}>
  <section class="popup-panel">
    <header>
      <h2>{title}</h2>
      {#if showClose}
        <button type="button" aria-label="Tutup popup" onclick={() => dialog?.close()}>Tutup</button>
      {/if}
    </header>
    <div class="popup-content">
      {@render children()}
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
    display: grid;
    grid-template-rows: 14% 86%;
    width: min(92%, 110dvh);
    height: min(82%, 125dvw);
    background: #0d1420;
    outline: 0.3dvi solid #c084fc;
    outline-offset: 0;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-inline: 4%;
  }

  h2 {
    margin: 0;
    font-size: min(5cqi, 5cqb);
    font-weight: 600;
  }

  button {
    border: 0;
    padding: 2% 3%;
    background: #243047;
    color: inherit;
    font: inherit;
    font-size: min(4cqi, 4cqb);
    cursor: pointer;
  }

  button:focus-visible {
    outline: 0.4cqi solid #f8fafc;
  }

  .popup-content {
    min-height: 0;
    padding: 0% 3% 3%;
  }
</style>
