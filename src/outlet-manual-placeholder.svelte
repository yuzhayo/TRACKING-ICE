<script>
  import { box, paint } from './lib/layout.svelte'
  import { t, s } from './lib/text.svelte'
  import { renderFor, propsFor } from './lib/content.svelte'
  import './motion/animations.css'

  let {
    path = 'outletManual',
    hidden = false,
    open = false,
    options = [],
    onConfirm = () => {},
    onCancel = () => {}
  } = $props()

  const ArtComp = $derived(renderFor(path))
  const artProps = $derived(propsFor(path))
  const InputComp = $derived(renderFor(`${path}.input`))
  const inputProps = $derived(propsFor(`${path}.input`))
  const ConfirmComp = $derived(renderFor(`${path}.confirm`))

  let draft = $state('')

  const filtered = $derived(
    draft.trim() === ''
      ? options
      : options.filter((o) => o.toLowerCase().includes(draft.trim().toLowerCase()))
  )

  $effect(() => {
    if (open) {
      draft = ''
      window.setTimeout(() => {
        const el = document.querySelector('.outlet-manual-input')
        if (el) el.focus()
      }, 60)
    }
  })

  function commit() {
    const v = draft.trim().toUpperCase()
    if (!v) return
    onConfirm(v)
  }

  function handleKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    }
  }

  function pick(i) {
    const v = filtered[i]
    if (v !== undefined) draft = v
  }

</script>

<section
  class="outlet-manual"
  class:hidden={hidden}
  aria-label="Outlet manual"
  style={box(path) + paint(path)}
>
  {#if ArtComp}
    <div class="art-layer"><ArtComp {...artProps} /></div>
  {/if}

  <div class="om-input" style={box(`${path}.input`)}>
    {#if InputComp}
      <!-- label stays empty: the <input> below already draws the same string as its
           placeholder, and two copies of it in one box overlap each other. -->
      <div class="pil-wrap"><InputComp {...inputProps} label="" textStyle={s(`${path}.input`)} /></div>
    {/if}
    <input
      class="outlet-manual-input"
      type="search"
      inputmode="text"
      enterkeyhint="done"
      autocomplete="off"
      autocapitalize="characters"
      spellcheck="false"
      placeholder={t(`${path}.input`)}
      bind:value={draft}
      onkeydown={handleKeydown}
    />
  </div>

  <div
    class="om-list"
    style={box(`${path}.list`) + paint(`${path}.list`)}
  >
    {#each filtered as item, i}
      <button
        type="button"
        class="om-row"
        style={s(`${path}.list`)}
        onclick={() => pick(i)}
      >{item}</button>
    {/each}
  </div>

  {#if ConfirmComp}
    <div class="btn-slot" style={box(`${path}.confirm`)}>
      <ConfirmComp label={t(`${path}.confirm`)} textStyle={s(`${path}.confirm`)} onClick={commit} />
    </div>
  {:else}
    <button type="button" style={box(`${path}.confirm`) + paint(`${path}.confirm`)} onclick={commit}>
      {t(`${path}.confirm`)}
    </button>
  {/if}
</section>

<style>
  .art-layer { position: absolute; inset: 0%; pointer-events: none; z-index: 0; }
  .outlet-manual { position: absolute; box-sizing: border-box; background: var(--fill); }
  .outlet-manual.hidden { display: none; }
  .om-input { position: absolute; }
  .pil-wrap { position: absolute; inset: 0%; z-index: 0; }
  .outlet-manual-input {
    position: absolute; inset: 0%; z-index: 1;
    background: transparent; border: 0; outline: 0;
    font: inherit; color: #e2e8f0; text-align: center; font-weight: 600;
    padding-inline: 5.5%;
  }
  .om-list { position: absolute; overflow-y: auto; display: flex; flex-direction: column; }
  .om-row {
    flex: 0 0 auto; height: 12%; border: 0; background: transparent;
    color: #ffffff; font: inherit; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  /* The row at the scroll position is the same white as every other row: the
     operator ruled the list reads uniform, so no gold highlight. */
  .btn-slot { position: absolute; }
  /* The shared Btn paints its label dark navy for the light action bar. On this
     teal dialog button the label is white and bold. */
  .btn-slot :global(.btn-teks) { color: #ffffff; font-weight: 700; }
</style>
