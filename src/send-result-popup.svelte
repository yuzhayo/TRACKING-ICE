<script lang="ts">
  import PopupPlaceholder from './popup-placeholder.svelte'
  import { t, s } from './lib/text.svelte'

  let {
    open = false,
    state = 'idle',
    message = '',
    onClose = () => {}
  }: {
    open?: boolean
    state?: string
    message?: string
    onClose?: () => void
  } = $props()
</script>

<PopupPlaceholder path="result" open={open} dismissible={state !== 'sending'} {onClose}>
  <div class="result-body" class:ok={state === 'ok'} class:sending={state === 'sending'}>
    {#if state === 'sending'}
      <p class="result-line" style={s('result.line')}>{t('result.sending')}</p>
    {:else}
      <p class="result-line" style={s('result.line')}>{state === 'ok' ? t('result.ok') : t('result.fail')}</p>
      <p class="result-detail" style={s('result.detail')}>{message}</p>
    {/if}
  </div>
</PopupPlaceholder>

<style>
  .result-body {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4%;
    text-align: center;
    container-type: size;
  }

  .result-line {
    margin: 0;
    font-weight: 800;
    color: #f87171;
  }

  .result-body.ok .result-line {
    color: #4ade80;
  }

  .result-body.sending .result-line {
    color: #fbbf24;
  }

  .result-detail {
    margin: 0;
    color: #cbd5e1;
    word-break: break-word;
  }
</style>
