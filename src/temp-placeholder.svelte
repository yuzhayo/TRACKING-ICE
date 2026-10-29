<script>
  import TempRow from './temp-row.svelte'

  let {
    left = '0%',
    top = '0%',
    width = '100%',
    height = '100%',
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
  style="left: {left}; top: {top}; width: {width}; height: {height};"
>
  <TempRow label="1" text={answers[0]} revealed={!!answers[0]} onClick={() => onSelect(1)} />
  <TempRow label="2" text={answers[1]} revealed={!!answers[1]} onClick={() => onSelect(2)} />
  <TempRow label="3" text={answers[2]} revealed={!!answers[2]} onClick={() => onSelect(3)} />
  <TempRow label="4" text={answers[3]} revealed={!!answers[3]} onClick={() => onSelect(4)} />

  {#if hasCrop}
    <div class="crop-pair" aria-label="Pratinjau crop">
      <div class="crop-section">
        <div class="crop-child"><img src={cropOriginal} alt="Foto asli" /></div>
      </div>
      <div class="crop-section">
        <div class="crop-child"><img src={cropPreview} alt="Hasil crop" /></div>
      </div>
    </div>
  {:else}
    <TempRow label="5" text="" revealed={false} onClick={() => onSelect(5)} />
  {/if}
</section>

<style>
  .temp-placeholder {
    --temp-edge-color: rgba(248, 113, 133, 0.55);
    position: absolute;
    z-index: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 2%;
    padding: 0 3%;
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
    flex: 1 1 auto;
    min-height: 0;
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
</style>
