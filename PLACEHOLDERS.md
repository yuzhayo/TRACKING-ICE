# TRACKING-ICE Path Register

Every box on the screen, identified by ONE dotted path that means the same thing in all three JSON planes.

**The rule:** a path is only real if the box's file calls all three translators (`box(path)`, `s(path)`/`t(path)`, `renderFor(path)`). A key that no file reads is decoration.

**Target state:** 40 boxes, 3 keys each = 120 keys total.

---

## L1 - The canvas (1 box)

| path | parent | purpose | layout.json | text.json | content.json |
|---|---|---|---|---|---|
| `mainscreen` | - | the whole screen, 0/0/100/100 | top/left/width/height/z, outline off, fill off | - | renders the background image |

---

## L2/L3 - Five answer collection rows (8 boxes)

| path | parent | purpose | layout | text | content |
|---|---|---|---|---|---|
| `temp` | mainscreen | the 5-row stack, top 76% | box, outline on, fill off | - | - |
| `temp.row1` | temp | Q1 BA name | box, outline/fill on | row copy, index | the answer pill |
| `temp.row2` | temp | Q2 outlet | box, outline/fill on | row copy, index | the answer pill |
| `temp.row3` | temp | Q3 date | box, outline/fill on | row copy, index | the answer pill |
| `temp.row4` | temp | Q4 nominal | box, outline/fill on | row copy, index | the answer pill |
| `temp.row5` | temp | Q5 photo + crop preview pair | box, outline/fill on | row copy, index | - |
| `temp.row5.original` | temp.row5 | original photo left half 3:4 | box | - | the uploaded image |
| `temp.row5.crop` | temp.row5 | crop preview right half 3:4 | box | - | the cropped image |

---

## L2/L3 - The expand/collapse wheel (6 boxes)

| path | parent | purpose | layout | text | content |
|---|---|---|---|---|---|
| `wheel` | mainscreen | the wheel nest (row1+row2+row3+list+confirm) | box, outline on, fill off | - | - |
| `wheel.row1` | wheel | top bounce row (slides in from above) | box, outline/fill on | - | glow or band art |
| `wheel.row2` | wheel | center row, always visible | box, outline/fill on | the selected name | the picker button face |
| `wheel.row3` | wheel | bottom bounce row (slides in from below) | box, outline/fill on | - | glow or band art |
| `wheel.list` | wheel | the scroll-snap option list, z3 | box, outline on, fill off | list item fontSize/align | - |
| `wheel.confirm` | wheel | tap-to-confirm area, z4 over row2 | box, outline/fill on | - | - |

---

## L2/L3 - Calendar (5 boxes)

| path | parent | purpose | layout | text | content |
|---|---|---|---|---|---|
| `calendar` | mainscreen | the date picker trigger + popup shell | box, outline/fill on | prompt, fontSize/align | - |
| `calendar.grid` | calendar | the popup date grid (title + weekdays + days) | box | grid.title/weekday/day typography | the grid background art |
| `calendar.grid.title` | calendar.grid | month title row typography | - | fontSize/align | - |
| `calendar.grid.weekday` | calendar.grid | weekday row typography | - | fontSize/align, ["Sen","Sel"...] | - |
| `calendar.grid.day` | calendar.grid | day cell typography | - | fontSize/align | - |

---

## L2/L3 - Nominal + keypad (7 boxes)

| path | parent | purpose | layout | text | content |
|---|---|---|---|---|---|
| `nominal` | mainscreen | the nominal trigger + display + pad | box, outline/fill on | - | - |
| `nominal.trigger` | nominal | the closed state display | box | prompt, fontSize/align | the display frame art |
| `nominal.display` | nominal | the open state formatted display | box | prompt, fontSize/align | the display frame art |
| `pad` | nominal | the 12-key grid (0-9, C, OK) | box | - | the pad background art |
| `pad.key` | pad | digit key typography (0-9 share this) | - | fontSize/align | - |
| `pad.clear` | pad | C key | box + typography | text "C", fontSize/align | the key face art |
| `pad.ok` | pad | OK key | box + typography | text "OK", fontSize/align | the key face art |

---

## L2/L3 - Upload + crop (7 boxes)

| path | parent | purpose | layout | text | content |
|---|---|---|---|---|---|
| `upload` | mainscreen | the photo upload trigger + status | box, outline/fill on | pick/change/loading copy, fontSize/align | - |
| `upload.pick` | upload | the trigger button (pick foto) | box | - | the button art |
| `upload.change` | upload | the change-crop button (ubah crop) | box | - | the button art |
| `crop` | mainscreen | the frame-cropper popup (1:1 square) | box | - | - |
| `crop.frame` | crop | the crop frame overlay (the 1:1 box) | box | - | the frame art |
| `crop.cancel` | crop | Cancel button | box | text "Cancel", fontSize/align | the button art |
| `crop.confirm` | crop | Confirm button | box | text "Confirm", fontSize/align | the button art |

---

## L2/L3 - Action (3 boxes)

| path | parent | purpose | layout | text | content |
|---|---|---|---|---|---|
| `action` | mainscreen | the Reset + Confirm button row | box, outline/fill on | - | - |
| `action.reset` | action | Reset button | box | text "RESET", fontSize/align | renders Btn (already wired) |
| `action.confirm` | action | Confirm button | box | text "CONFIRM", fontSize/align | renders Btn (already wired) |

---

## L2 - Three popups (3 boxes)

| path | parent | purpose | layout | text | content |
|---|---|---|---|---|---|
| `warn` | mainscreen | nominal >15000 warning popup | box | warn.nominal message, fontSize/align | the popup shell art |
| `instr` | mainscreen | crop instruction popup | box | instr.crop message, fontSize/align | the popup shell art |
| `result` | mainscreen | send-result popup (SENDING.../TERKIRIM/GAGAL) | box | result.sending/ok/fail, fontSize/align | the popup shell art |

---

## Summary

| group | count | notes |
|---|---|---|
| L1 canvas | 1 | mainscreen |
| temp rows | 8 | 5 rows + row5 split into original/crop |
| wheel | 6 | nest + 3 rows + list + confirm |
| calendar | 5 | trigger + grid + 3 typography rows |
| nominal + pad | 7 | trigger, display, pad + 3 key types |
| upload + crop | 7 | upload trigger + change + crop frame + 2 buttons |
| action | 3 | container + reset + confirm |
| popups | 3 | warn, instr, result |
| **TOTAL** | **40** | every path exists in layout, text, and content |

---

## What changes when a box is connected

**Before:** the box shows its outline/fill (the colored wireframe from `layout.json`).

**After:** the box calls `renderFor(path)` and paints the component inside its own box. The outline/fill stays exactly whatever `layout.json` says (the planes are independent), so connecting a box never hides its wireframe unless you turn `outline.on: false`. The component is an ART LAYER - every sprite layer keeps `pointer-events: none`, so the placeholder keeps the behavior (scroll, tap-confirm, keypad hold-clear, cropper pan/pinch).

---

## The dummy

Every box starts with the same dummy key in `content.json`:
```json
"wheel.row2": { "render": "image", "src": "/dummy.png", "fit": "stretch", "scale": 100 }
```

`/dummy.png` is a fully transparent PNG (1x1 or small square). The `image` component already exists and renders any src with fit/scale, so the dummy is not a new component - it is the existing component pointed at a transparent file. You change the value in JSON - swap `/dummy.png` for a real sprite, or change `"render"` to `"pil"`, `"picker_btn"`, `"picker_glow"`, `"btn"`, `"popup"` - and never open code.
