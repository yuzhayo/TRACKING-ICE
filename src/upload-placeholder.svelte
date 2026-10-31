<script lang="ts">
  import FrameCropper from './frame-cropper.svelte'
  import CropInstructionPopup from './crop-instruction-popup.svelte'
  import { compressImage } from './lib/image'
  import { box, paint } from './lib/layout.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'
  import { t, s } from './lib/text.svelte'
  import { IDENTITY, type CropTransform } from './lib/crop'

  let {
    path = '',
    hidden = false,
    expanded = false,
    photo = '',
    crop = null,
    onPhoto = () => {},
    onCrop = () => {},
    onConfirm = () => {},
    onExpandedChange = () => {}
  }: {
    path?: string
    hidden?: boolean
    expanded?: boolean
    photo?: string
    crop?: CropTransform | null
    onPhoto?: (dataUrl: string, base64: string) => void
    onCrop?: (t: CropTransform | null) => void
    onConfirm?: (label: string) => void
    onExpandedChange?: (expanded: boolean) => void
  } = $props()

  const padColor = '#ffffff'
  const MAX_SIZE = 1600
  const QUALITY = 0.7

  let fileInput = $state<HTMLInputElement>()
  let busy = $state(false)
  let error = $state('')

  const ArtComp = $derived(renderFor(path))
  const artProps = $derived(propsFor(path))
  // The face slot follows the label it sits under: pick before a photo, change after.
  const slotPath = $derived(photo ? `${path}.change` : `${path}.pick`)
  const FaceComp = $derived(renderFor(slotPath))
  const faceProps = $derived(propsFor(slotPath))
  let instrOpen = $state(false)

  // A crop is "not cropped" when it is still the untouched original framing.
  function isIdentity(t: CropTransform): boolean {
    return (
      Math.abs(t.rot - IDENTITY.rot) < 0.5 &&
      Math.abs(t.zoom - IDENTITY.zoom) < 0.01 &&
      Math.abs(t.px - IDENTITY.px) < 0.01 &&
      Math.abs(t.py - IDENTITY.py) < 0.01
    )
  }

  function openPicker() {
    fileInput?.click()
  }

  function triggerClick() {
    if (photo) onExpandedChange(true)
    else openPicker()
  }

  async function onFile(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    busy = true
    error = ''
    try {
      const compressed = await compressImage(file, MAX_SIZE, QUALITY)
      onPhoto(compressed.dataUrl, compressed.base64)
      onExpandedChange(true)
      instrOpen = true
    } catch (err) {
      error = err instanceof Error ? err.message : 'Foto gagal diproses.'
    } finally {
      busy = false
      input.value = ''
    }
  }

  function commitCrop(transform: CropTransform) {
    if (isIdentity(transform)) {
      instrOpen = true
      return
    }
    onCrop(transform)
    onConfirm('Foto siap')
    onExpandedChange(false)
  }

  // Cancelling discards the photo, so the trigger is honestly "PILIH FOTO" again
  // and a tap re-opens the gallery - no re-pick gesture inside the cropper.
  function cancelCrop() {
    onPhoto('', '')
    onCrop(null)
    error = ''
    onExpandedChange(false)
  }
</script>

<section class="upload-placeholder" {hidden} aria-label="Upload placeholder" style={box(path) + paint(path)}>
  {#if ArtComp}
    <div class="art-layer"><ArtComp {...artProps} /></div>
  {/if}
  <input
    bind:this={fileInput}
    class="file-input"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onchange={onFile}
  />

  {#if !crop}
    {#if FaceComp}
      <div class="sub-art" style={box(slotPath)}><FaceComp {...faceProps} /></div>
    {/if}
    <button
      class="upload-trigger"
      type="button"
      aria-label="Pilih foto"
      style={s('upload')}
      disabled={busy}
      onclick={triggerClick}
    >{busy ? t('upload.loading') : (photo ? t('upload.change') : t('upload.pick'))}</button>
  {/if}
</section>

{#if expanded && !hidden}
  <div class="crop-overlay" role="dialog" aria-label="Potong foto">
    {#if photo}
      <FrameCropper path="crop" src={photo} initial={crop} {padColor} onOk={commitCrop} onCancel={cancelCrop} />
    {:else}
      <div class="crop-pick" style={s('crop.pick')}>
        <p>{error || t('crop.pickPrompt')}</p>
        <button type="button" onclick={openPicker}>{t('crop.pickBtn')}</button>
      </div>
    {/if}
  </div>
{/if}

<CropInstructionPopup open={instrOpen} onClose={() => instrOpen = false} />

<style>
  .art-layer {
    position: absolute;
    inset: 0%;
    pointer-events: none;
    z-index: 0;
  }

  .sub-art {
    position: absolute;
    container-type: size;
    pointer-events: none;
    z-index: 0;
  }

  .upload-placeholder {
    position: absolute;
    container-type: size;
  }

  .file-input {
    display: none;
  }

  .upload-trigger {
    /* The art layer is a positioned sibling at z-index 0, so a static face here
       would paint UNDER whatever content.json puts in this box. */
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    border: 0;
    padding: 0% 3%;
    background: var(--fill);
    color: #e2e8f0;
    box-shadow: inset 0 0 0 0.35cqi var(--line);
    font: inherit;
    cursor: pointer;
  }

  .upload-trigger:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .upload-trigger:focus-visible {
    outline: 0.4cqi solid #f8fafc;
    outline-offset: -0.8cqi;
  }

  .crop-overlay {
    position: fixed;
    inset: 0%;
    z-index: 50;
    container-type: size;
    display: grid;
    place-items: center;
    background: rgba(5, 7, 12, 0.9);
  }

  .crop-pick {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5cqh;
    text-align: center;
    color: #cbd5e1;
  }

  .crop-pick p {
    margin: 0;
  }

  .crop-pick button {
    border: 0;
    padding: 2cqh 8cqw;
    background: #243047;
    color: #e2e8f0;
    box-shadow: inset 0 0 0 0.35cqi #fb923c;
    font: inherit;
    font-size: min(5cqi, 5cqb);
    cursor: pointer;
  }
</style>
