<script lang="ts">
  import PopupPlaceholder from './popup-placeholder.svelte'
  import { t, s } from './lib/text.svelte'

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
  const label = $derived(t('warn.nominal').replaceAll('{max}', fmt.format(max)))
</script>

<PopupPlaceholder path="warn" {open} {onClose}>
  <div class="warn-body">
    <p class="warn-line" style={s('warn.nominal')}>{label}</p>
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
    font-weight: 800;
    color: #fbbf24;
  }
</style>
