<script>
  import TempRow from './temp-row.svelte'
  import { box, paint } from './lib/layout.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'

  let {
    path = '',
    answers = ['', '', '', '', ''],
    cropOriginal = '',
    cropPreview = '',
    hasCrop = false,
    onSelect = () => {}
  } = $props()

  const ArtComp = $derived(renderFor(path))
  const artProps = $derived(propsFor(path))
  const origPath = $derived(`${path}.row5.original`)
  const cropPath = $derived(`${path}.row5.crop`)
  const OrigComp = $derived(renderFor(origPath))
  const origProps = $derived(propsFor(origPath))
  const CropComp = $derived(renderFor(cropPath))
  const cropProps = $derived(propsFor(cropPath))
</script>

<section
  class="temp-placeholder"
  aria-label="Temp placeholder"
  style={box(path) + paint(path)}
>
  {#if ArtComp}
    <div class="art-layer"><ArtComp {...artProps} /></div>
  {/if}
  <TempRow path={`${path}.row1`} label="1" text={answers[0]} revealed={!!answers[0]} onClick={() => onSelect(1)} />
  <TempRow path={`${path}.row2`} label="2" text={answers[1]} revealed={!!answers[1]} onClick={() => onSelect(2)} />
  <TempRow path={`${path}.row3`} label="3" text={answers[2]} revealed={!!answers[2]} onClick={() => onSelect(3)} />
  <TempRow path={`${path}.row4`} label="4" text={answers[3]} revealed={!!answers[3]} onClick={() => onSelect(4)} />

  {#if hasCrop}
    <div class="crop-pair" aria-label="Pratinjau crop" style={box(`${path}.row5`)}>
      <div class="crop-section" style={box(origPath)}>
        <div class="crop-child" style={paint(origPath)}>
          <img src={cropOriginal} alt="Foto asli" />
          {#if OrigComp}
            <div class="crop-frame-art"><OrigComp {...origProps} /></div>
          {/if}
        </div>
      </div>
      <div class="crop-section" style={box(cropPath)}>
        <button type="button" class="crop-child crop-edit" style={paint(cropPath)} aria-label="Ubah crop" onclick={() => onSelect(5)}>
          <img src={cropPreview} alt="Hasil crop" />
          {#if CropComp}
            <div class="crop-frame-art"><CropComp {...cropProps} /></div>
          {/if}
        </button>
      </div>
    </div>
  {:else}
    <TempRow path={`${path}.row5`} label="5" text="" revealed={false} onClick={() => onSelect(5)} />
  {/if}
</section>

<style>
  .art-layer {
    position: absolute;
    inset: 0%;
    pointer-events: none;
    z-index: 0;
  }

  .temp-placeholder {
    position: absolute;
    box-sizing: border-box;
    pointer-events: none;
    background-image:
      linear-gradient(var(--line), var(--line)),
      linear-gradient(var(--line), var(--line)),
      linear-gradient(var(--line), var(--line)),
      linear-gradient(var(--line), var(--line));
    background-size: 100% 0.6%, 0.6% 100%, 100% 0.6%, 0.6% 100%;
    background-position: 0% 0%, 100% 0%, 0% 100%, 0% 0%;
    background-repeat: no-repeat;
  }

  /* Row 5: two 3:4 children, each placed by its own node in layout.json -
     temp.row5.original and temp.row5.crop - so the gap between them is a plane
     number (crop.left minus original.width), not a CSS literal. */
  .crop-pair {
    position: absolute;
    box-sizing: border-box;
  }

  .crop-section {
    position: absolute;
    box-sizing: border-box;
    container-type: size;
    display: grid;
    place-items: center;
  }

  .crop-child {
    position: relative;
    width: min(100cqw, 75cqh);
    aspect-ratio: 3 / 4;
    overflow: hidden;
    background: #0f172a;
    outline: 0.5cqi solid var(--line);
    outline-offset: -0.5cqi;
  }

  /* The gold frame is the outline of the thumbnail, so it must never eat the
     tap that reopens the crop on the right half. */
  .crop-frame-art {
    position: absolute;
    inset: 0%;
    z-index: 2;
    pointer-events: none;
  }

  .crop-child img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* The cropped thumb is a button: tap it to reopen the crop selection. */
  .crop-edit {
    pointer-events: auto;
    border: 0;
    padding: 0;
    margin: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
</style>
