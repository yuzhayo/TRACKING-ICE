# TRACKING-ICE - Dead Code Register

Audited 2026-10-31. Scope: `C:\RARA\TRACKING-ICE`. This document is the **pre-cleanup
baseline** written before any removal. Items in sections 1, 2, 3, 4, 6 (excluding 6.1-6.3),
7 and 11, plus the two false "NOT wired" comments in section 9, were subsequently executed
in the cleanup pass that follows it (see `git log`). The report below was not edited to
describe that pass - it records what was found.

How to read a row: if the Reason column says "never read", the symbol is defined and nothing
in the live render path consumes it. If it says "dead component", the file is imported only
by the registry and no `content.json` entry ever selects it.

The app builds clean and the flow is end-to-end tested, so **none of this is breaking
anything**. It is weight, not damage.

---

## 0. Headline

| Group | Count | Weight |
|---|---|---|
| Dead components (whole files) | 4 | 14,708 b |
| Dead assets (PNG never painted) | 11 | 300,775 b = 293.7 KB |
| Dead `text.json` keys | 5 | - |
| Dead `config.json` fields | 7 | - |
| Dead exported setters | 3 | - |
| Dead props / inert state | 15 | - |
| Dead CSS blocks | 3 | - |
| Duplicate / stale documents | 2 | 13,641 b |

Public art totals 28 files / 936.1 KB. **293.7 KB of that (31%) can never appear on screen.**

---

## 1. Dead components - whole files

These four are imported by `src/lib/content.svelte.ts` only, so the bundler keeps them.
No `content.json` entry names their render key, so `renderFor()` can never return them.

The four render keys actually used across all 48 `content.json` entries are:
`btn`, `image`, `pil`, `pad_key`. Nothing else.

| File | Size | Registry line | Render key | Proof |
|---|---|---|---|---|
| `src/component/Popup.svelte` | 6,241 b | `content.svelte.ts:21` import, `:38` key | `popup` | `popup` appears in no `content.json` `render` value. Also the only reader of 6 PNGs (section 3). |
| `src/component/PilJawaban.svelte` | 4,151 b | `content.svelte.ts:20` import, `:37` key | `jawaban` | `jawaban` appears in no `render` value. Reads `text.json` key `jawaban`, which is itself dead. |
| `src/component/PickerBtn.svelte` | 2,332 b | `content.svelte.ts:22` import, `:39` key | `picker_btn` | `picker_btn` appears in no `render` value. |
| `src/component/PickerGlow.svelte` | 1,984 b | `content.svelte.ts:23` import, `:40` key | `picker_glow` | `picker_glow` appears in no `render` value. |

Removing them means: delete the four files, delete the four imports at `content.svelte.ts`
lines 20-23, delete the four registry entries at lines 37-40, and delete the stale comment
at line 30 that explains `picker_btn` / `picker_glow`.

`src/lib/content.svelte.ts:30` - comment "picker_btn and picker_glow are the two pieces
taken out of the old PWA wheel" describes two components nothing renders.

---

## 2. Dead exported setters

Each translator module exposes a setter that writes the reactive state directly. The matching
`load*()` function writes the same variable inline, so the setter is a second door into a room
with one door already open.

| File | Line | Symbol | Reason |
|---|---|---|---|
| `src/lib/content.svelte.ts` | 68 | `setContent` | 0 call sites. `loadContent` assigns `doc = data` at line 78. |
| `src/lib/layout.svelte.ts` | 57 | `setLayout` | 0 call sites. `loadLayout` assigns `tree = data` at line 67. |
| `src/lib/text.svelte.ts` | 44 | `setText` | 0 call sites. `loadText` assigns `tree = data` at line 54. |

Not to be confused with the *exported types* in `src/lib/api.ts` (`AppConfig`, `OptionsData`,
`SubmitSuccess`, ...). Those look unused to a grep because no other file imports them by
name, but they are the return types and parameter types of the `api.ts` functions that
`mainscreen.svelte` does call. **Leave them.** See section 10.

---

## 3. Dead assets - 11 files, 293.7 KB

Two kinds. `DEAD-ONLY` means the only file mentioning the name is a dead component from
section 1. `ORPHAN` means nothing in `src/`, `public/*.json`, `public/*.css` or `index.html`
mentions it at all.

| Asset | Size | Referenced only by |
|---|---|---|
| `bg_yuganghuawen.png` | 145,990 b | `Popup.svelte:114` |
| `PentaB.png` | 69,180 b | `Popup.svelte:102` |
| `head_frame_arenadefault.png` | 15,406 b | `Popup.svelte:123` |
| `login_btn_01.png` | 5,537 b | `Popup.svelte:219` |
| `login_deco04.png` | 6,311 b | `Popup.svelte:131` |
| `login_frame_08.png` | 5,538 b | `Popup.svelte:206` |
| `utx_base_footer_menu_active_semicircle_trim.png` | 13,914 b | `PickerGlow.svelte:9, :66` |
| `utx_btn_common_00_l_effect.png` | 4,704 b | `PilJawaban.svelte:122` |
| `utx_btn_common_00_m_effect.png` | 4,602 b | `PickerBtn.svelte:11, :70` |
| `RL_zt_jiao.png` | 14,327 b | ORPHAN - nothing |
| `utx_base_dialog_frame - Copy.png` | 15,266 b | ORPHAN - nothing |

Note the filename with a space in it: `utx_base_dialog_frame - Copy.png`. That space is a
copy-paste artifact of the file name itself, not of this document.

The single biggest win is `bg_yuganghuawen.png` at 146 KB, a login-background image for a
dialog component that never renders.

**Warning about the other 17 PNGs:** they are live. `utx_base_dialog_frame.png` is used by
`content.json` keys `temp.row5.original`, `temp.row5.crop` and `crop.frame`, and
`utx_btn_common_00_l.png` by the four `temp.rowN` keys. Do not pattern-match on filename
prefixes when deleting; delete only the eleven names above.

---

## 4. Dead `text.json` keys

| Key | Line | Reason |
|---|---|---|
| `wheel.confirm` | 15-18 | `confirm-area.svelte` renders `wheel.confirm` but imports neither `t` nor `s`. It draws art and a tap target only. The `fontSize` / `align` here are never read. |
| `temp.rowIndex` | 25-28 | No `t('temp.rowIndex')` or `s('temp.rowIndex')` anywhere. |
| `temp.row5` | 29-32 | The only `temp.row5` string in code is a **comment** at `temp-placeholder.svelte:91` naming the content paths `temp.row5.original` / `temp.row5.crop`. The bare text node is never read. |
| `jawaban` | 135-138 | Read only by dead `PilJawaban.svelte:21`. |
| `popup` | 139-142 | Read only by dead `Popup.svelte:26-27`. |

Also in this file, two values that are **not dead but invalid CSS**:

| Key | Line | Problem |
|---|---|---|
| `action.reset.fontSize` | 117 | `"8qi"` - `qi` is not a CSS unit. The whole declaration is dropped by the browser, so the Reset label falls back to inherited size. |
| `actionPreview.reset.fontSize` | 178 | Same `"8qi"`. |

The confirm labels use `"8cqi"` (lines 122, 183, 201) which is valid. The reset ones look like
a typo that lost its `c`. This is a live-path defect, listed here because it lives in the same
file as the dead keys.

---

## 5. Dead `config.json` fields

`public/config.json` is loaded and passed around, but only five fields are ever read:
`apiUrl`, `token`, `requestTimeoutMs`, `image.cropContract`, `limits.nominalMax`.

| Field | Reason | Where the value actually lives |
|---|---|---|
| `image.maxSize` | never read | hardcoded `MAX_SIZE = 1600` at `upload-placeholder.svelte:33` |
| `image.quality` | never read | hardcoded `QUALITY = 0.7` at `upload-placeholder.svelte:34` |
| `image.cropPadColor` | never read | hardcoded `padColor = '#ffffff'` at `upload-placeholder.svelte:32` |
| `image.cropFrameRatio` | never read, no equivalent anywhere | - |
| `limits.nominalMaxDigits` | never read | `nominal-placeholder.svelte` enforces digits by `max` value, not by length |
| `limits.outletMaxLen` | never read | `outlet-manual-placeholder.svelte` has no length cap |
| `labels.title` | never read | `index.html` `<title>` holds the app name |

These are the most misleading entries in the whole repo: `config.json` presents itself as the
settings file, and four of these fields have a hardcoded twin in `upload-placeholder.svelte`
that silently wins. Editing `config.json` changes nothing.

Two ways out, and the operator picks: either wire them (pass `cfg.image.*` into the component)
or delete them so the file stops lying. Do not do both halves.

---

## 6. Dead props and inert state

### 6.1 `src/component/Pil.svelte` - four props, none ever supplied

`content.json` gives its six `pil` boxes - `wheel.row2`, `calendar`, `nominal.trigger`,
`upload.pick`, `upload.change`, `outletManual.input` - the value `{"render": "pil"}` and
**no other keys**. `propsFor()` therefore returns `{}` and every one of these props keeps
its default forever.

| Line | Prop | Consequence |
|---|---|---|
| 18 | `label = ''` | The `{:else}` branch at 39-41 paints an empty `<span class="pil-teks">`. All visible pill text comes from the sibling `.wheel-row-text` in `wheel-row.svelte`, not from here. |
| 20 | `lit = false` | `class:lit` at line 29 never turns on, so the `.pil.lit .pil-light` rule at line 83 never matches. Only `.pil:focus-within` (line 84) still lights it. |
| 21 | `open = false` | `class:open` at line 30 never turns on, so `.pil.open > *` at line 117 never matches. |
| 23 | `children` | `{#if children}` at 37 is always false. Same for `Popup.svelte:29` / `:47`, but that file is dead entirely. |

### 6.2 Other dead props

| File | Line | Prop | Reason |
|---|---|---|---|
| `src/component/Image.svelte` | 15 | `alt` | No `content.json` entry carries an `alt` key, and no caller passes it. Line 26 therefore renders `aria-label=""` on every image layer - the prop exists but is permanently empty. |
| `src/temp-placeholder.svelte` | 8, 28, 86 | `hidden` | `mainscreen.svelte:325-332` instantiates `TempPlaceholder` without `hidden`, so it is always `false`. The `.temp-placeholder.hidden { display: none }` rule at 86 is unreachable. |
| `src/wheel-row.svelte` | 14, 40 | `bumpKey` | See 6.3. |

### 6.3 `bumpKey` - the one finding that is not merely weight

`wheel-row.svelte:40` writes `key={bumpKey}` on the text span. Svelte 5 has no `key`
attribute. The compiler treats it as a plain DOM attribute and emits an attribute setter:

```
ni(t,`key`,l())
```

That was read out of the built bundle (`dist/assets/*.js`, the `wheel-row-text svelte-n32vn9`
template) on 2026-10-31. Setting a `key` attribute on a `<span>` does nothing. The intent was
to force a re-mount when the centre text changes, so the text-swap animation would replay.
That re-mount never happens.

`wheel-placeholder.svelte:66` still passes `bumpKey={centerText}`, so the prop looks wired.
It is not. Either implement the intended re-mount (Svelte 5 way: `{#key centerText}...{/key}`)
or remove the prop and the argument.

### 6.4 `src/outlet-manual-placeholder.svelte` - a whole inert highlight chain

The gold highlight on the scroll-position row was removed on purpose; the comment at lines
159-160 records the ruling. The machinery that drove it was left behind.

| Line | Item | Reason |
|---|---|---|
| 25 | `let active = $state(0)` | Only consumer is `class:active` at line 122, and `.om-row.active` has no CSS rule. The only `.om-row` rule is at line 153. Nothing can observe this value. |
| 38 | `active = 0` | Reset inside the open effect. Same dead chain. |
| 66 | `if (i !== active) active = i` | Same dead chain. |
| 122 | `class:active={i === active}` | Class is set, never styled. |
| 27 | `let programmatic = false` | Never assigned `true` anywhere in the file. |
| 63 | `if (!listEl \|\| programmatic) return` | Because `programmatic` is a constant `false`, this reduces to `if (!listEl) return`. |
| 62-67 + 116 | `handleScroll` + `onscroll` | Its only effect is writing `active`, which nothing reads. |
| 74-79 | `ResizeObserver(() => {})` | Empty callback. Observing and disconnecting a list for a no-op is pure overhead. |

Related, not dead but wrong: `handleScroll` divides `listEl.clientHeight / 7` (line 64) while
`.om-row` is `height: 12%` (line 154), which is 8.33 rows. The divisor and the CSS disagree.
It is invisible today only because the `active` chain is dead. If the highlight is ever
restored, fix the divisor in the same change.

---

## 7. Dead CSS

| File | Line | Block | Reason |
|---|---|---|---|
| `src/motion/animations.css` | 171 | section header "used by src/component/PilJawaban.svelte" | Names a dead component. |
| `src/motion/animations.css` | 175 | `@keyframes pil-kilat` | Only `PilJawaban.svelte` uses this animation name. |
| `src/motion/animations.css` | 239 | `.pil-jawaban.kilat .pil-jawaban-kilat` | `.pil-jawaban` only exists inside the dead `PilJawaban.svelte`. |

`src/motion/animations.css` is the single motion file for the project and is imported by many
live placeholders, so delete only these three spans, never the file.

---

## 8. Unreachable `{:else}` fallbacks - not dead, but wrong if reached

Three components carry a "content.json has no component here, so draw an outline" fallback.
All three are unreachable today because `content.json` always supplies a render key. If the
fallback ever ran, it would show the wrong label:

| File | Lines | Problem |
|---|---|---|
| `src/reset-button.svelte` | 19-32 | Hardcodes `t('action.reset')` / `s('action.reset')` at line 31. The same component is also called with path `actionPreview.reset`, where the correct key is `actionPreview.reset`. |
| `src/confirm-button.svelte` | 20-35 | Hardcodes `t('action.confirm')` / `s('action.confirm')` at line 34. Same problem for `actionPreview.confirm`. |
| `src/outlet-manual-placeholder.svelte` | 133-136 | `outletManual.confirm` is `btn` in `content.json:206`, so this branch cannot run. |

The fix, when it is wanted, is one word each: `t(path)` and `s(path)` instead of the literal
key. That is a behaviour change, so it was not made here.

---

## 9. Documents and leftovers

| Item | Size | Reason |
|---|---|---|
| `PATHS.md` | 6,388 b | Duplicate of `PLACEHOLDERS.md`. Both are titled "TRACKING-ICE Path Register". Both are stale: they mention 36 of the 48 real layout paths, and both list `pad`, `pad.key`, `pad.clear`, `pad.ok`, which are **not** layout paths - the real ones are `nominal.pad`, `nominal.pad.key`, `nominal.pad.clear`, `nominal.pad.ok`. Both miss `outletManual` and its 3 children, `calendar.popup`, all 4 `nominal.pad*` paths, and `actionPreview` and its 2 children. |
| `PLACEHOLDERS.md` | 7,253 b | Same document, second copy, same 12 gaps. Two files claiming to be the register is worse than one stale file: a reader cannot tell which is authoritative. |
| `docs/ICE-FORM-WIKI.md` | 27,916 b | Reference wiki for a source project. Not imported, not linked from any file in `src/` or `public/`. |
| `docs/PWA-WIKI.md` | 29,315 b | Same. Both are useful reading, neither is wired. Decide: keep as reference (move to a `reference/` folder) or drop. |
| `.claude/settings.local.json` | 217 b | Tool artifact from a previous agent session, not part of the app. |

Stale in-code comments that now say the opposite of the truth:

| File | Line | Claim | Reality |
|---|---|---|---|
| `src/component/Btn.svelte` | 10 | "NOT wired to any placeholder yet" | `render: "btn"` is used by 7 `content.json` keys: `crop.cancel`, `crop.confirm`, `action.reset`, `action.confirm`, `actionPreview.reset`, `actionPreview.confirm`, `outletManual.confirm`. |
| `src/component/Pil.svelte` | 15 | "NOT wired to any placeholder" | `render: "pil"` is used by 6 keys: `wheel.row2`, `calendar`, `nominal.trigger`, `upload.pick`, `upload.change`, `outletManual.input`. |
| `PilJawaban.svelte:17`, `Popup.svelte:21`, `PickerBtn.svelte:22`, `PickerGlow.svelte:23` | | Same sentence | Technically true, and it is the reason those four files are dead. |

---

## 10. Checked and NOT dead - do not delete

Written down because each of these looks unused to a quick grep and would be destroyed by a
tidy-up pass.

| Symbol | Why it survives |
|---|---|
| `api.ts` interfaces (`AppConfig`, `OptionsData`, `CropPayload`, `SubmitPayload`, `SubmitSuccess`, `ApiErrorResponse`) | No other file imports them by name, but they are the parameter and return types of the `api.ts` functions `mainscreen.svelte` calls. Deleting them breaks the type contract, not the bundle. |
| `crop.ts` `baseScale` | Exported, but used inside `crop.ts` by `clampPan` and `drawCrop`. |
| `crop.ts` `renderCrop` / `drawCrop` chain | Used internally by `cropDataUrl`. |
| `temp-row.svelte` `class:revealed` | Styled in `animations.css:137` and `:143`, and again at `:228`. Live. |
| `date-grid.svelte:18` `path` prop | Never overridden - `calendar-placeholder.svelte:48` passes no path - but the component reads it throughout (`gridPath`, `titlePath`, `weekdayPath`, `dayPath`). It is used, just never configured. |
| `Image.svelte` `scale` / `fit` | Passed by every `content.json` image entry. |
| `Btn.svelte` `kilat` | Driven by `onpointerdown`, styled in `animations.css`. Live. |
| `wheel.confirm` in **`content.json:83`** | This is the *content* key and it is live - `ConfirmArea` renders it. Only the same-named **text** key (section 4) is dead. Two files, one name, opposite verdicts. |
| `STAGING` / `dummy.png` / `bg_12.png` | `dummy.png` is the intentional empty art layer for 17 content keys. `bg_12.png` is the calendar and crop background. |

---

## 11. Cosmetic - lowest priority

| File | Line | Item |
|---|---|---|
| `src/mainscreen.svelte` | 8 | `import OutletManualPlaceholder ...` sits at column 1 while every other import is indented two spaces. |
| `src/calendar-placeholder.svelte` | 62-63 | `position: absolute;` written twice in `.calendar-placeholder`. Harmless, but it makes a reader stop and look for a difference that is not there. |
| `src/lib/image.ts` | 51 | `CompressedPhoto.name` is populated with `file.name` and never read by any caller. |
| `src/lib/api.ts` | 49-50 | `SubmitSuccess.outlet` and `.statusOutlet` are declared but never read after the response arrives. |

---

## 12. Suggested order of removal

Safest first. Each step is independent and each one can stop there.

1. **Assets (293.7 KB, zero code touched).** Delete the 11 PNGs in section 3. Nothing imports
   them once the four dead components are gone, and nothing imports them now.
2. **Dead components + registry.** Delete the four files, then lines 20-23 and 37-40 of
   `content.svelte.ts`, then the comment at line 30. Build must still pass.
3. **Dead text keys.** The 5 keys in section 4.
4. **Dead setters.** The 3 functions in section 2.
5. **Dead CSS.** The 3 spans in section 7.
6. **Dead state in outlet-manual.** Section 6.4. This one is a code edit, so it needs a
   re-test of the manual-outlet flow even though nothing visible should change.
7. **Stale comments.** Section 9 - the two false "NOT wired" claims are actively misleading.
8. **Documents.** Merge `PATHS.md` and `PLACEHOLDERS.md` into one correct register, or delete
   one. Do not leave two.
9. **`config.json`.** Wire or delete the 7 fields in section 5 - and decide, do not do both.
10. **`bumpKey`.** Section 6.3. This one changes behaviour, so it is a feature decision, not
    cleanup.

Steps 1-5 are pure subtraction: nothing that runs today can notice them. Step 6 onward needs a
manual pass of the flow.

---

## 13. How this was measured

Reproducible, no browser involved:

- Every `import` / `export` line in `src/` enumerated, then every exported name counted inside
  and outside its own file.
- Every `render` value in `public/content.json` collected and compared against the registry in
  `content.svelte.ts`.
- Every `t('...')` / `s('...')` literal argument collected, then every `text.json` key checked
  against that set.
- Every `cfg.*` access collected and compared against the keys of `public/config.json`.
- Every PNG in `public/` searched for its filename across `src/`, `public/*.json`,
  `public/*.css` and `index.html`; a hit inside a dead component was reclassified as
  DEAD-ONLY.
- `public/layout.json` flattened to 48 paths and compared against both `content.json` and
  `text.json` keys, and against the two register documents.
- `npm run build` run to confirm the tree compiles with zero Svelte warnings before and after
  the audit - so no finding here is a build artifact.
- The `bumpKey` finding was confirmed against the built bundle, not assumed: the compiled
  output contains an attribute setter, not a re-mount.

Nothing in this document was inferred from a screenshot or from memory.
