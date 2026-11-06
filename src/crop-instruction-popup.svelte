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
        <div class="instr-video-thumb">
          <VideoComp {...videoProps} label={t('instr.video')} />
          {#if FrameComp}
            <div class="instr-videoframe" aria-hidden="true"><FrameComp {...frameProps} /></div>
          {/if}
        </div>
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
    box-sizing: border-box;
    container-type: size;
    display: grid;
    place-items: center;
    background: var(--fill);
  }

  .instr-video-thumb {
    position: relative;
    width: min(100cqw, 94.8cqh);
    /* Explicit height, not aspect-ratio (Safari 15+, Chrome 88+). 474 wide : 500 tall. */
    height: calc(min(100cqw, 94.8cqh) * 1.05485);
    overflow: hidden;
    background: #0f172a;
  }

  .instr-videoframe {
    position: absolute;
    inset: 0%;
    z-index: 2;
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
