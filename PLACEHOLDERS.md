# TRACKING-ICE Path Register

One dotted path per box. The same path means the same box in all three JSON planes:
`layout.json` (`box(path)` + `paint(path)`) = geometry + visual;
`text.json` (`t(path)` + `s(path)`) = copy + typography;
`content.json` (`renderFor(path)` + `propsFor(path)`) = what renders.

A path is **real** only if the box's file calls all three translators.
A key no file reads is decoration - you edit it and nothing happens.

**Total: 50 registered layout paths.** 1 canvas + 8 temp + 6 wheel + 6 calendar + 7 nominal/pad +
7 upload/crop + 3 action + 3 actionPreview + 4 outletManual + 5 popup boxes = 50.

---

## L1 - Canvas (1)

| path | parent | purpose |
|---|---|---|
| `mainscreen` | - | whole screen, 0/0/100/100. Background image lands here. |

---

## L2 - Five answer rows (8)

| path | parent | purpose |
|---|---|---|
| `temp` | mainscreen | the 5-row stack (top 76%) |
| `temp.row1` | temp | Q1 BA name |
| `temp.row2` | temp | Q2 outlet |
| `temp.row3` | temp | Q3 date |
| `temp.row4` | temp | Q4 nominal |
| `temp.row5` | temp | Q5 photo + crop preview pair |
| `temp.row5.original` | temp.row5 | original photo, left half, 3:4 |
| `temp.row5.crop` | temp.row5 | crop preview, right half, 3:4 |

---

## L3 - Picker wheel (6)

| path | parent | purpose |
|---|---|---|
| `wheel` | mainscreen | wheel container (row1/row2/row3/list/confirm) |
| `wheel.row1` | wheel | top bounce row |
| `wheel.row2` | wheel | center row (always visible) |
| `wheel.row3` | wheel | bottom bounce row |
| `wheel.list` | wheel | scroll-snap option list, z3 |
| `wheel.confirm` | wheel | tap-to-confirm area over row2, z4 |

---

## L4 - Calendar (6)

| path | parent | purpose |
|---|---|---|
| `calendar` | mainscreen | trigger + popup shell |
| `calendar.popup` | calendar | modal popup shell (the `dialog`) |
| `calendar.grid` | calendar | day grid (title + weekdays + days) |
| `calendar.grid.title` | calendar.grid | month/year title |
| `calendar.grid.weekday` | calendar.grid | Sen..Min header |
| `calendar.grid.day` | calendar.grid | day cell |

---

## L5 - Nominal + pad (7)

| path | parent | purpose |
|---|---|---|
| `nominal` | mainscreen | trigger + display + pad |
| `nominal.trigger` | nominal | collapsed trigger (SELECT NOMINAL) |
| `nominal.display` | nominal | open-state formatted display |
| `nominal.pad` | nominal | the 12-key grid (0-9, C, OK) |
| `nominal.pad.key` | nominal.pad | digit keys 0-9 |
| `nominal.pad.clear` | nominal.pad | C key (hold to clear) |
| `nominal.pad.ok` | nominal.pad | OK key |

---

## L6 - Upload + crop (7)

| path | parent | purpose |
|---|---|---|
| `upload` | mainscreen | photo upload trigger + status |
| `upload.pick` | upload | pick-file trigger |
| `upload.change` | upload | change-crop button |
| `crop` | mainscreen | frame-cropper popup |
| `crop.frame` | crop | 1:1 (or 3:4) crop frame overlay |
| `crop.cancel` | crop | Cancel button |
| `crop.confirm` | crop | Confirm button |

---

## L7 - Action bar (3)

| path | parent | purpose |
|---|---|---|
| `action` | mainscreen | Reset + Confirm row |
| `action.reset` | action | Reset button |
| `action.confirm` | action | Confirm button |

---

## L8 - Action preview (3)

Shown only when a crop exists (`mainscreen.svelte:366` swaps `action` -> `actionPreview`).

| path | parent | purpose |
|---|---|---|
| `actionPreview` | mainscreen | preview-state Reset + Confirm row |
| `actionPreview.reset` | actionPreview | Reset button (preview) |
| `actionPreview.confirm` | actionPreview | Confirm button (preview) |

---

## L9 - Manual outlet entry (4)

| path | parent | purpose |
|---|---|---|
| `outletManual` | mainscreen | manual outlet entry dialog |
| `outletManual.input` | outletManual | text input + pill face |
| `outletManual.list` | outletManual | scroll-snap filtered list |
| `outletManual.confirm` | outletManual | Confirm button |

---

## L10 - Popups (5)

| path | parent | purpose |
|---|---|---|
| `warn` | mainscreen | nominal > 15000 warning |
| `instr` | mainscreen | crop instruction popup |
| `instr.crop` | instr | instruction text above the demonstration |
| `instr.video` | instr | silent 4.5-second crop demonstration; mounted only while open |
| `instr.video.frame` | instr.video | gold frame (`utx_base_dialog_frame.png`) over the demo video: thumb overlay `inset: 0%`, not a layout node |
| `result` | mainscreen | send result (SENDING.../TERKIRIM/GAGAL) |

---

## L11 - Information (1)

| path | parent | purpose |
|---|---|---|

---

## How to use this register

- The register follows `public/layout.json`'s 50 paths. If layout.json gains or loses a
  node, this file follows (edit both in the same change).
- Content entries and relevant text nodes must follow the registered paths. A `.disabled`-style
  dangling key in one file is decoration: edits to it change nothing.
- `layout.json` geometry for several paths still reads `TBD` / node absent -> assume neither
  position nor size exists until measured. Do not invent.

## Dummy and the planes

Every box starts on `/dummy.png` (a transparent image). All three planes are independent:

- `outline.on` / `fill.on` are off by default (a wireframe appears, not art).
- Connect a box by changing its `content.json` value, never its geometry.
- Changing `layout.json` moves the box. Changing `text.json` changes words. These do not
  touch each other.

*Register reconciled 2026-10-31: pad renamed to `nominal.pad`, added `outletManual` (4),
`calendar.popup`, `actionPreview` (3). Total 48 (was claimed 40).*

*Updated 2026-11-06: added `instr.crop` and `instr.video`, and listed the existing
`info` node. Total 51. The video source lives in `content.json`; its box is
`instr.video` in `layout.json`. Popup dismissal unmounts and pauses the player. The
`info` placeholder was removed 2026-11-07 together with `component/Info.svelte`.*


*Updated 2026-11-07: `instr.video.frame` reworked to the thumb concept - frame `inset: 0%` over a
`min()`-sized 474:500 thumb box; no layout node under `instr.video`. `info` removed. Total 50 layout paths.*
