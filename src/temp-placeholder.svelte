<script>
  import TempRow from './temp-row.svelte'
  import { box } from './lib/layout.svelte'

  let {
    path = '',
    hidden = false,
    answers = ['', '', '', '', ''],
    cropOriginal = '',
    cropPreview = '',
    hasCrop = false,
    onSelect = () => {}
  } = $props()
</script>

<section
  class="temp-placeholder"
  class:hidden={hidden}
  aria-label="Temp placeholder"
  style={box(path)}
>
  <TempRow path={`${path}.row1`} label="1" text={answers[0]} revealed={!!answers[0]} onClick={() => onSelect(1)} />
  <TempRow path={`${path}.row2`} label="2" text={answers[1]} revealed={!!answers[1]} onClick={() => onSelect(2)} />
  <TempRow path={`${path}.row3`} label="3" text={answers[2]} revealed={!!answers[2]} onClick={() => onSelect(3)} />
  <TempRow path={`${path}.row4`} label="4" text={answers[3]} revealed={!!answers[3]} onClick={() => onSelect(4)} />

  {#if hasCrop}
    <div class="crop-pair" aria-label="Pratinjau crop" style={box(`${path}.row5`)}>
      <div class="crop-section">
        <div class="crop-child"><img src={cropOriginal} alt="Foto asli" /></div>
      </div>
      <div class="crop-section">
        <button type="button" class="crop-child crop-edit" aria-label="Ubah crop" onclick={() => onSelect(5)}>
          <img src={cropPreview} alt="Hasil crop" />
        </button>
      </div>
    </div>
  {:else}
    <TempRow path={`${path}.row5`} label="5" text="" revealed={false} onClick={() => onSelect(5)} />
  {/if}
</section>

<style>
  .temp-placeholder {
    --temp-edge-color: rgba(248, 113, 133, 0.55);
    position: absolute;
    box-sizing: border-box;
    pointer-events: none;
    background-image:
      linear-gradient(var(--temp-edge-color), var(--temp-edge-color)),
      linear-gradient(var(--temp-edge-color), var(--temp-edge-color)),
      linear-gradient(var(--temp-edge-color), var(--temp-edge-color)),
      linear-gradient(var(--temp-edge-color), var(--temp-edge-color));
    background-size: 100% 0.6%, 0.6% 100%, 100% 0.6%, 0.6% 100%;
    background-position: 0% 0%, 100% 0%, 0% 100%, 0% 0%;
    background-repeat: no-repeat;
  }

  .temp-placeholder.hidden {
    display: none;
  }

  /* Row 5: two equal sections, each holding a 3:4 child placeholder. */
  .crop-pair {
    position: absolute;
    box-sizing: border-box;
    display: flex;
    gap: 3%;
  }

  .crop-section {
    flex: 1;
    min-width: 0;
    min-height: 0;
    container-type: size;
    display: grid;
    place-items: center;
  }

  .crop-child {
    width: min(100cqw, 75cqh);
    aspect-ratio: 3 / 4;
    overflow: hidden;
    background: #0f172a;
    outline: 0.5cqi solid #fb923c;
    outline-offset: -0.5cqi;
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
