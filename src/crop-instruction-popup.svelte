<script lang="ts">
  import PopupPlaceholder from './popup-placeholder.svelte'

  let {
    open = false,
    onClose = () => {}
  }: {
    open?: boolean
    onClose?: () => void
  } = $props()
</script>

<PopupPlaceholder {open} {onClose}>
  <div class="instr-body">
    <p class="instr-line">crop nota dengan jelas di dalam frame</p>
  </div>
</PopupPlaceholder>

<style>
  .instr-body {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    container-type: size;
  }

  .instr-line {
    margin: 0;
    font-size: min(6cqi, 6cqb);
    font-weight: 800;
    color: #fb923c;
  }
</style>
