<script lang="ts">
  import PopupPlaceholder from './popup-placeholder.svelte'

  let {
    open = false,
    max = 15000,
    onClose = () => {}
  }: {
    open?: boolean
    max?: number
    onClose?: () => void
  } = $props()

  const fmt = new Intl.NumberFormat('id-ID')
</script>

<PopupPlaceholder {open} {onClose}>
  <div class="warn-body">
    <p class="warn-line">NOMINAL TIDAK BOLEH LEBIH DARI {fmt.format(max)}</p>
  </div>
</PopupPlaceholder>

<style>
  .warn-body {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    container-type: size;
  }

  .warn-line {
    margin: 0;
    font-size: min(6cqi, 6cqb);
    font-weight: 800;
    color: #fbbf24;
  }
</style>
