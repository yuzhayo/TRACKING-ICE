<script>
  import WheelRow from './wheel-row.svelte'
  import OptionListPlaceholder from './option-list-placeholder.svelte'
  import ConfirmArea from './confirm-area.svelte'
  import { box, paint } from './lib/layout.svelte'
  import { s } from './lib/text.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'

  let {
    path = '',
    hidden = false,
    open = false,
    options = [],
    prompt = '',
    selected = '',
    onCenterClick = () => {},
    onConfirm = () => {}
  } = $props()

  let closing = $state(false)
  let prevOpen = $state(false)
  let highlight = $state('')

  const ArtComp = $derived(renderFor(path))
  const artProps = $derived(propsFor(path))

  $effect(() => {
    if (open && !prevOpen) closing = false
    else if (!open && prevOpen) closing = true
    prevOpen = open
  })

  const centerText = $derived(open ? (highlight || selected) : (selected || prompt))

  function handleCenterClick() {
    if (open) onConfirm(highlight || selected)
    else onCenterClick()
  }
</script>

<section
  class="wheel-placeholder"
  class:hidden={hidden}
  aria-label="Wheel placeholder"
  style={box(path) + paint(path)}
>
  {#if ArtComp}
    <div class="art-layer"><ArtComp {...artProps} /></div>
  {/if}
  <WheelRow
    path={`${path}.row1`}
    variant="top"
    label="Wheel row 1"
    open={open}
    closing={closing}
  />

  <OptionListPlaceholder path={`${path}.list`} {open} {options} {selected} onHighlight={(v) => highlight = v} />

  <WheelRow
    path={`${path}.row2`}
    variant="center"
    label="Wheel row 2"
    text={centerText}
    textStyle={s(`${path}.row2`)}
    open={true}
    onClick={handleCenterClick}
  />

  <ConfirmArea path={`${path}.confirm`} onClick={handleCenterClick} />

  <WheelRow
    path={`${path}.row3`}
    variant="bottom"
    label="Wheel row 3"
    open={open}
    closing={closing}
  />
</section>

<style>
  .art-layer {
    position: absolute;
    inset: 0%;
    pointer-events: none;
    z-index: 0;
  }

  .wheel-placeholder {
    position: absolute;
    background-image:
      linear-gradient(var(--line), var(--line)),
      linear-gradient(var(--line), var(--line)),
      linear-gradient(var(--line), var(--line)),
      linear-gradient(var(--line), var(--line));
    background-size: 100% 0.6%, 0.6% 100%, 100% 0.6%, 0.6% 100%;
    background-position: 0% 0%, 100% 0%, 0% 100%, 0% 100%;
    background-repeat: no-repeat;
  }

  .wheel-placeholder.hidden {
    display: none;
  }
</style>
