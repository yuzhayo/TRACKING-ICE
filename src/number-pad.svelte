<script lang="ts">
  let {
    onDigit = () => {},
    onDelete = () => {},
    onClear = () => {},
    onConfirm = () => {}
  }: {
    onDigit?: (digit: string) => void
    onDelete?: () => void
    onClear?: () => void
    onConfirm?: () => void
  } = $props()

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  let holdTimer: ReturnType<typeof setTimeout> | null = null
  let didHold = false

  function startHold() {
    didHold = false
    holdTimer = setTimeout(() => {
      didHold = true
      onClear()
    }, 500)
  }

  function endHold() {
    if (holdTimer) {
      clearTimeout(holdTimer)
      holdTimer = null
    }
    if (!didHold) onDelete()
  }

  function cancelHold() {
    if (holdTimer) {
      clearTimeout(holdTimer)
      holdTimer = null
    }
  }
</script>

<section class="number-pad" aria-label="Papan angka">
  {#each digits as digit (digit)}
    <button type="button" onclick={() => onDigit(digit)}>{digit}</button>
  {/each}

  <button
    type="button"
    class="pad-fn"
    aria-label="Ketuk untuk hapus satu angka, tahan untuk hapus semua"
    onpointerdown={(event) => { event.preventDefault(); startHold() }}
    onpointerup={endHold}
    onpointerleave={cancelHold}
    onpointercancel={cancelHold}
  >C</button>

  <button type="button" onclick={() => onDigit('0')}>0</button>

  <button type="button" class="pad-ok" onclick={onConfirm}>OK</button>
</section>

<style>
  .number-pad {
    container-type: size;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(4, minmax(0, 1fr));
    gap: 3%;
    width: 100%;
    height: 100%;
  }

  button {
    min-width: 0;
    border: 0;
    padding: 0;
    background: #172e29;
    color: #e2e8f0;
    box-shadow: inset 0 0 0 0.25cqi #4c9981;
    font: inherit;
    font-size: min(8cqi, 14cqb);
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  button.pad-fn {
    background: #2a2130;
    box-shadow: inset 0 0 0 0.25cqi #a78bfa;
  }

  button.pad-ok {
    background: #142736;
    box-shadow: inset 0 0 0 0.25cqi #67e8f9;
    font-size: min(6cqi, 12cqb);
  }

  button:active {
    background: #285447;
  }

  button.pad-fn:active {
    background: #3d2f47;
  }

  button.pad-ok:active {
    background: #1d3a4f;
  }

  button:focus-visible {
    outline: 0.4cqi solid #f8fafc;
    outline-offset: -0.4cqi;
  }
</style>
