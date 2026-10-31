<script>
  /* Image layer component - a cooked component that fills whatever placeholder
     it enters. Everything about the picture is config (content.json props):
       src   -> the image
       fit   -> fill | contain | stretch | center   (how it is laid into the box)
       scale -> 0-100, the image size as % of the placeholder box
                (only "center" uses scale; fill/contain/stretch fill the box)

     Example: "mainscreen": { "render": "image", "src": "/bg.jpg", "fit": "fill", "scale": 100 } */

  let {
    src = '',
    fit = 'fill',
    scale = 100
  } = $props()

  const size = $derived(
    fit === 'contain' ? 'contain'
      : fit === 'stretch' ? '100% 100%'
        : fit === 'center' ? `${Math.max(0, Math.min(100, Number(scale) || 0))}%`
          : 'cover' // fill
  )
</script>

<div class="image-fill" style={`background-image: url('${src}'); background-size: ${size};`} role="img"></div>

<style>
  .image-fill {
    position: absolute;
    inset: 0%;
    z-index: 0;
    background-repeat: no-repeat;
    background-position: center;
    pointer-events: none;
  }
</style>
