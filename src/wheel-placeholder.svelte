<script>
  import WheelRow from './wheel-row.svelte'
  import OptionListPlaceholder from './option-list-placeholder.svelte'
  import { box } from './lib/layout.svelte'

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
  style={box(path)}
>
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
    bumpKey={centerText}
    open={true}
    onClick={handleCenterClick}
  />

  <WheelRow
    path={`${path}.row3`}
    variant="bottom"
    label="Wheel row 3"
    open={open}
    closing={closing}
  />
</section>

<style>
  .wheel-placeholder {
    position: absolute;
    background-image:
      linear-gradient(rgba(244, 114, 182, 0.55), rgba(244, 114, 182, 0.55)),
      linear-gradient(rgba(244, 114, 182, 0.55), rgba(244, 114, 182, 0.55)),
      linear-gradient(rgba(244, 114, 182, 0.55), rgba(244, 114, 182, 0.55)),
      linear-gradient(rgba(244, 114, 182, 0.55), rgba(244, 114, 182, 0.55));
    background-size: 100% 0.6%, 0.6% 100%, 100% 0.6%, 0.6% 100%;
    background-position: 0% 0%, 100% 0%, 0% 100%, 0% 100%;
    background-repeat: no-repeat;
  }

  .wheel-placeholder.hidden {
    display: none;
  }
</style>
