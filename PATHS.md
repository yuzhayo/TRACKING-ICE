# TRACKING-ICE Path Register

Every box on the screen, one path in all three JSON files.

A path is only real if the box's file asks all three translators:
- `layout.json` -> `box(path)` + `paint(path)` = top/left/width/height/z + outline/fill
- `text.json` -> `t(path)` + `s(path)` = wording + fontSize/align
- `content.json` -> `renderFor(path)` + `propsFor(path)` = WHAT renders inside the box

A key that no file reads is decoration - you edit it and nothing happens.

---

## The 40 boxes

| path | parent | what it is | layout | text | content |
|---|---|---|---|---|---|
| `mainscreen` | root | the whole screen canvas | 0,0,100x100 z0 | none (the screen has no text) | bg image or any L1 component |
| `temp` | mainscreen | the 5 answer rows | 0,0,100x76 z0 | none (the box is a container) | frame art or grid background |
| `temp.row1` | temp | Q1 answer row (BA name) | 2,3,94x11 z1 | copy (BA name) + font/align | row face or per-Q art |
| `temp.row2` | temp | Q2 answer row (outlet) | 15,3,94x11 z1 | copy (outlet) + font/align | row face or per-Q art |
| `temp.row3` | temp | Q3 answer row (date) | 28,3,94x11 z1 | copy (date) + font/align | row face or per-Q art |
| `temp.row4` | temp | Q4 answer row (nominal) | 41,3,94x11 z1 | copy (amount) + font/align | row face or per-Q art |
| `temp.row5` | temp | Q5 answer row (photo pair) | 54,3,94x42 z1 | none (it is the pair container) | row face or a composite frame |
| `temp.row5.original` | temp.row5 | the left half - original photo | TBD | none | the original thumbnail |
| `temp.row5.crop` | temp.row5 | the right half - crop preview | TBD | none | the crop result thumbnail |
| `wheel` | mainscreen | the picker carousel container | 38,0,100x40 z1 | none (the box is a container) | frame art or the full wheel stack |
| `wheel.row1` | wheel | top row (slide-in-up-bounce) | 0,0,100x40 z1 | none (the row is a colored band) | glow top or row art |
| `wheel.row2` | wheel | center row (always visible) | 0,0,100x40 z1 | the selected option or prompt | picker btn or row art |
| `wheel.row3` | wheel | bottom row (slide-in-down-bounce) | 0,0,100x40 z1 | none (the row is a colored band) | glow bottom or row art |
| `wheel.list` | wheel | the scroll-snap option list | 0,0,100x40 z3 | per-option copy + font/align | list art or a mask overlay |
| `wheel.confirm` | wheel | tap-to-confirm area (over center row) | 30,40,40x20 z4 | none (it is a transparent tap target) | confirm icon or overlay art |
| `calendar` | mainscreen | the date picker popup | 54,0,100x8 z2 | trigger label ("PILIH TANGGAL") | popup shell or calendar frame |
| `calendar.grid` | calendar | the grid of days (title + weekdays + day cells) | TBD | none (the grid is a container) | grid background or frame |
| `calendar.grid.title` | calendar.grid | the title row (month/year) | TBD (row) | month/year string + font/align | title bar art or a glow |
| `calendar.grid.weekday` | calendar.grid | the weekday header row (Sen..Min) | TBD (row) | weekday abbrevs + font/align | header row art |
| `calendar.grid.day` | calendar.grid | each day cell (repeats 42x) | TBD (cell) | day number + font/align | day cell art (state: empty/past/today/selected) |
| `nominal` | mainscreen | the nominal input placeholder | TBD z2 | none (the box is a container) | placeholder frame or input shell |
| `nominal.trigger` | nominal | the collapsed trigger (before expand) | TBD | prompt ("SELECT NOMINAL") | trigger face or a button |
| `nominal.display` | nominal | the display of the entered amount | TBD | the formatted number + font/align | display face or a readout panel |
| `pad` | nominal | the numeric keypad (0-9 C OK) | TBD | none (the pad is a container) | keypad frame or grid background |
| `pad.key` | pad | the 10 digit keys (0-9) | TBD (grid cells) | digit glyphs + font/align | key face art (per digit or shared) |
| `pad.clear` | pad | the C key (hold to clear) | TBD (grid cell) | "C" + font/align | key face art |
| `pad.ok` | pad | the OK key (confirm entry) | TBD (grid cell) | "OK" + font/align | key face art |
| `upload` | mainscreen | the photo upload + crop placeholder | TBD z2 | trigger ("PILIH FOTO") | placeholder frame or upload shell |
| `upload.pick` | upload | the pick-file trigger button | TBD | button label + font/align | button face art |
| `upload.change` | upload | the change-crop button (after pick) | TBD | button label ("UBAH CROP") | button face art |
| `crop` | upload | the frame cropper (pan/pinch/frame) | TBD | none (the cropper is a canvas) | cropper frame art or guides |
| `crop.frame` | crop | the movable 1:1 or 3:4 frame overlay | TBD | none (the frame is a visual guide) | frame border art or corner handles |
| `crop.cancel` | crop | the cancel button | TBD | "Cancel" + font/align | button face art |
| `crop.confirm` | crop | the confirm button | TBD | "Confirm" + font/align | button face art |
| `action` | mainscreen | the bottom action bar (Reset / Confirm) | 85,0,100x13 z2 | none (the bar is a container) | action bar frame or divider |
| `action.reset` | action | the Reset button | exists | "RESET" + font/align | Btn component (already wired) |
| `action.confirm` | action | the Confirm button | exists | "CONFIRM" + font/align | Btn component (already wired) |
| `warn` | mainscreen | nominal >15000 warning popup | TBD (modal overlay) | warning text + font/align | Popup shell + warn art |
| `instr` | mainscreen | crop instruction popup | TBD (modal overlay) | instruction text + font/align | Popup shell + instr art |
| `result` | mainscreen | send-result popup (SENDING.../TERKIRIM/GAGAL) | TBD (modal overlay) | result messages + font/align | Popup shell + result art |

---

## Build order (tasks 45-52)

1. `public/dummy.png` (transparent) - the no-op default every key starts at
2. `layout.json`: add the 20 TBD nodes, measured from today's CSS render
3. Wire `box()`+`paint()` into the 8 pathless files (one at a time, screenshot before/after)
4. `text.json`: fill the holes (wheel.list, pad.*, crop.*, warn/instr/result copy)
5. `content.json`: seed 40 keys, all pointing at the dummy
6. Every placeholder calls `renderFor(path)` and renders the result as an art layer (pointer-events none)
7. Prove all three planes live: edit one key per plane, screenshot the effect, revert

The screen does not move until `layout.json` says so. A key that changes nothing is treated as a failure.
