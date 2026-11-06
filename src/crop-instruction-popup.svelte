<script lang="ts">
  import PopupPlaceholder from './popup-placeholder.svelte'
  import { box, paint } from './lib/layout.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'
  import { t, s } from './lib/text.svelte'

  let {
    open = false,
    onClose = () => {}
  }: {
    open?: boolean
    onClose?: () => void
  } = $props()

  const CopyComp = $derived(renderFor('instr.crop'))
  const copyProps = $derived(propsFor('instr.crop'))
  const VideoComp = $derived(renderFor('instr.video'))
  const videoProps = $derived(propsFor('instr.video'))
  const FrameComp = $derived(renderFor('instr.video.frame'))
  const frameProps = $derived(propsFor('instr.video.frame'))
</script>

<PopupPlaceholder path="instr" {open} {onClose}>
  <div class="instr-body">
    <div class="instr-copy" style={box('instr.crop') + paint('instr.crop')}>
      {#if CopyComp}
        <div class="art-layer"><CopyComp {...copyProps} /></div>
      {/if}
      <p class="instr-line" style={s('instr.crop')}>{t('instr.crop')}</p>
    </div>
    {#if open && VideoComp}
      <div class="instr-video" style={box('instr.video') + paint('instr.video')}>
        <VideoComp {...videoProps} label={t('instr.video')} />
        {#if FrameComp}
          <div class="instr-videoframe" style={box('instr.video.frame')} aria-hidden="true"><FrameComp {...frameProps} /></div>
        {/if}
      </div>
    {/if}
  </div>
</PopupPlaceholder>

<style>
  .instr-body {
    position: relative;
    height: 100%;
    text-align: center;
    container-type: size;
  }

  .instr-copy {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--fill);
  }

  .instr-video {
    position: absolute;
    background: var(--fill);
  }

  .instr-videoframe {
    position: absolute;
    pointer-events: none;
  }

  .art-layer {
    position: absolute;
    inset: 0%;
    pointer-events: none;
    z-index: 0;
  }

  .instr-line {
    position: relative;
    z-index: 1;
    margin: 0;
    font-weight: 800;
    color: #fb923c;
  }
</style>
