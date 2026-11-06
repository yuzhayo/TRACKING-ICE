<script lang="ts">
  // A silent looping video that fills its parent's box. The source comes from
  // content.json; the owning popup controls when this is mounted.
  let {
    src = '',
    fit = 'contain',
    label = ''
  }: {
    src?: string
    fit?: 'contain' | 'fill' | 'stretch'
    label?: string
  } = $props()

  let video = $state<HTMLVideoElement>()
  const objectFit = $derived(fit === 'fill' ? 'cover' : fit === 'stretch' ? 'fill' : 'contain')

  $effect(() => {
    const element = video
    if (!element) return
    return () => element.pause()
  })
</script>

<video
  bind:this={video}
  {src}
  aria-label={label}
  style={`object-fit: ${objectFit};`}
  autoplay
  loop
  muted
  playsinline
  preload="auto"
></video>

<style>
  video {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
