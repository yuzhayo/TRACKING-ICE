<script lang="ts">
  import PopupPlaceholder from './popup-placeholder.svelte'
  import { t, s } from './lib/text.svelte'

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
    <p class="instr-line" style={s('instr.crop')}>{t('instr.crop')}</p>
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
    font-weight: 800;
    color: #fb923c;
  }
</style>
