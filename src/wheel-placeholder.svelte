<script>
  import WheelRow from './wheel-row.svelte'
  import OptionListPlaceholder from './option-list-placeholder.svelte'

  let {
    left = '0%',
    top = '0%',
    width = '100%',
    height = '100%',
    hidden = false,
    open = false,
    row2Top,
    row2Height,
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
  style="left: {left}; top: {top}; width: {width}; height: {height};"
>
  <WheelRow
    variant="top"
    label="Wheel row 1"
    left="0%"
    top="0%"
    width="100%"
    height="40%"
    open={open}
    closing={closing}
  />

  <OptionListPlaceholder {open} {options} {selected} onHighlight={(v) => highlight = v} />

  <WheelRow
    variant="center"
    label="Wheel row 2"
    text={centerText}
    bumpKey={centerText}
    left="0%"
    top={`${row2Top}%`}
    width="100%"
    height={`${row2Height}%`}
    open={true}
    onClick={handleCenterClick}
  />

  <WheelRow
    variant="bottom"
    label="Wheel row 3"
    left="0%"
    top="60%"
    width="100%"
    height="40%"
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
