# PWA Wiki

Generated on 2026-10-27 from the files, configuration, and executable output that
are present in [C:\RARA\PWA](file:///C:/RARA/PWA). This page describes the observed
code paths and runtime configuration.

## Table of Contents

1. [Runnable Application](#1-runnable-application)
2. [Folder Contents](#2-folder-contents)
3. [Current Build Condition](#3-current-build-condition)
4. [Startup And Data Loading](#4-startup-and-data-loading)
5. [Form Workflow](#5-form-workflow)
6. [Persistence And Recovery](#6-persistence-and-recovery)
7. [Live Component Graph](#7-live-component-graph)
8. [Layout Mechanics](#8-layout-mechanics)
9. [Client Contracts](#9-client-contracts)
10. [Image And Crop Pipeline](#10-image-and-crop-pipeline)
11. [Backend Source](#11-backend-source)
12. [Development Mock Server](#12-development-mock-server)
13. [Cutter](#13-cutter)
14. [PWA And Offline Condition](#14-pwa-and-offline-condition)
15. [Commands And Launchers](#15-commands-and-launchers)
16. [Agent Inspection Tooling](#16-agent-inspection-tooling)
17. [Relationship With ICE-FORM](#17-relationship-with-ice-form)

## 1. Runnable Application

[PWA](file:///C:/RARA/PWA) is a Vite React TypeScript mobile form. It has no
router or multi-page navigation. The live runtime path is:

```text
[index.html](file:///C:/RARA/PWA/index.html#L11-L14)
  -> [main.tsx](file:///C:/RARA/PWA/src/main.tsx#L1-L8)
  -> [App.tsx](file:///C:/RARA/PWA/src/App.tsx#L30-L142)
  -> [FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L242-L834)
```

The package uses React 19, React DOM 19, Ant Design 6, Day.js, Vite 8, TypeScript
5.9, and `vite-plugin-pwa` 2 ([package.json](file:///C:/RARA/PWA/package.json#L6-L26)).

The application collects:

```text
nama BA, outlet, tanggal, nominal, foto, crop
```

It sends them as JSON to `cfg.apiUrl`. On success, it replaces the form with the
canonical server outlet, status, date, nominal, and original plus cropped previews
([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L505-L541)).

## 2. Folder Contents

```text
PWA\
  index.html                 Browser entry
  package.json               Scripts and dependencies
  vite.config.ts             React, mock plugin, PWA manifest/service worker
  tsconfig.json              Strict TypeScript settings
  netlify.toml               Static Netlify build settings
  run-app.bat                Interactive and automation launcher

  src\
    main.tsx                 Service-worker registration and touch ripple
    App.tsx                  Configuration, locale, screen shell, bottom bar
    FormPage.tsx             Ant Design form, step state, submission, success
    api.ts                   Runtime data loading, caching, POST, error translation
    types.ts                 Shared application contracts
    dummy.ts                 Built-in fallback options
    PickerField.tsx          Closed pill socket and wheel open state
    PickerWheel.tsx          Three-row scroll wheel and commit behavior
    Pil.tsx                  Reusable pill art, focus illumination, control seat
    PilJawaban.tsx           Fixed answer dock and entrance animation
    BtnFrame.tsx             Art button and fixed bottom bar
    Popup.tsx                Shared dialog art assembly and text slots
    PhotoCropper.tsx         Canvas crop editor and pointer gestures
    SlotTanggal.tsx          Date control inside the shared pill
    SlotNominal.tsx          Numeric control inside the shared pill
    Placeholder.tsx          Transparent centering box
    lib\
      crop.ts                Crop model, math, canvas renderer
      image.ts               Image compression
      pickerRow.ts           Width-derived picker row height
    styles\container.css     Global tokens, background, page/card, screen banners

  public\
    config.json              Runtime endpoint, token, limits, image settings
    popups.json              Popup strings
    Icons and UI sprites

  apps-script\               Google Apps Script source and manifest
  mock\                      Development receiver, options, received output
  cutter\                    Python batch re-cutter and alpha inspector
  agent-script\              Chrome DevTools inspection script and screenshots
  dist\                      Current generated build output
```

`agent-script` is CDP tooling. `apps-script` is the Google backend. They are
separate code trees.

## 3. Current Build Condition

On 2026-10-27:

```text
npm run typecheck   exit 0
npm run build       exit 0
```

The build transformed 1508 modules, produced 71 precache entries totaling 3145.23
KiB, generated `dist/sw.js` and `dist/manifest.webmanifest`, and emitted a main
JavaScript bundle of 797.03 kB raw and 258.09 kB gzipped. It also emitted the
standard large-chunk warning
([build output](file:///C:/Users/YUZHA/AppData/Local/Temp/qoder-cli/C--RARA/a973f33b-4d48-4a21-b341-ec17f8144e69/tasks/b31qpke3e.output#L6-L32)).

There are no automated test files and no test command in `package.json`. The
declared commands are `dev`, `build`, `preview`, and `typecheck`
([package.json](file:///C:/RARA/PWA/package.json#L6-L11)).

## 4. Startup And Data Loading

`App.tsx` calls `loadConfig()`, then attempts `loadPopups()` and `loadOptions()`
inside their own `try` blocks
([App.tsx](file:///C:/RARA/PWA/src/App.tsx#L40-L75)).

Failure behavior:

| Resource | Current Behavior |
|---|---|
| `config.json` | Network failure uses the last `config:v1` localStorage entry; failure with no cache stops initialization and shows a reload banner ([api.ts](file:///C:/RARA/PWA/src/api.ts#L42-L65), [App.tsx](file:///C:/RARA/PWA/src/App.tsx#L112-L119)) |
| `popups.json` | Network failure uses `popups:v1`; failure with no cache sets an empty popup map ([api.ts](file:///C:/RARA/PWA/src/api.ts#L71-L87), [App.tsx](file:///C:/RARA/PWA/src/App.tsx#L50-L54)) |
| Options | Network failure uses `opsi:v1` and reports stale; failure with no cache sets `DUMMY_OPTIONS`. `App.tsx` discards the stale flag and uses the dummy list ([api.ts](file:///C:/RARA/PWA/src/api.ts#L93-L132), [App.tsx](file:///C:/RARA/PWA/src/App.tsx#L56-L61), [dummy.ts](file:///C:/RARA/PWA/src/dummy.ts#L1-L57)) |

`loadOptions()` uses a five-second abort timer against `apiUrl?action=options&...`
([api.ts](file:///C:/RARA/PWA/src/api.ts#L93-L131)).

The current `public/config.json` has `apiUrl` set to `/mock-submit`. The mock
endpoint is supplied by the Vite development middleware, so the built static files
do not receive a request handler at that path unless the endpoint is replaced at
runtime configuration ([config.json](file:///C:/RARA/PWA/public/config.json#L1-L4),
[receiver.mjs](file:///C:/RARA/PWA/mock/receiver.mjs#L418-L432)).

## 5. Form Workflow

`FormPage` keeps the visible question in `pertanyaanAktif`:

```text
nama -> outlet -> tanggal -> nominal -> foto -> kirim
```

It first derives the initial step from loaded draft values
([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L178-L262)).

| Step | Control | Commit |
|---|---|---|
| `nama` | `PickerField` | Center-row tap records the BA, clears outlet fields and photo, moves to outlet ([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L363-L399)) |
| `outlet` | `PickerField`, including `__OTHER__` | Registered outlet advances immediately. `__OTHER__` leaves an input visible below the slot ([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L401-L413)) |
| `outlet baru` | Ant Design `Input` | Enter or blur advances when trimmed text is at least 2 characters and does not begin `= + - @` ([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L415-L421), [FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L645-L670)) |
| `tanggal` | Ant Design `DatePicker` inside `Pil` | Selecting a day records it and moves to nominal ([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L672-L685), [SlotTanggal.tsx](file:///C:/RARA/PWA/src/SlotTanggal.tsx#L118-L140)) |
| `nominal` | Ant Design `Input` inside `Pil` | Enter or blur commits. The value is digits only; display uses id-ID separators. A value above the cap opens `nominal_lebih` and does not advance ([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L299-L310), [FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L451-L463), [SlotNominal.tsx](file:///C:/RARA/PWA/src/SlotNominal.tsx#L17-L40)) |
| `foto` | Ant Design `Upload`, compression, crop popup | Upload accepts JPEG, PNG, and WebP, compresses, clears the prior crop, and opens the editor. Crop OK sets the transform and advances to `kirim` if photo is the active step ([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L423-L449), [FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L711-L761), [FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L796-L811)) |
| `kirim` | Primary submit button | Opens `kirim_report`; OK calls `form.submit()` ([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L766-L777), [FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L813-L821)) |

There are two related value stores:

1. The Ant Design `Form` store contains current field values.
2. `jawaban` records committed values after each gesture. The dock is built from
   this second store rather than from `Form.useWatch`
   ([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L265-L274),
   [FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L543-L590)).

Tapping a dock answer returns that question to the active slot and sets
`bukaLangsung`. The code does not reset `bukaLangsung` to false after a picker
mounts, so subsequent picker components receive the stored true value until the
whole form remounts ([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L263-L263),
[FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L381-L386),
[PickerField.tsx](file:///C:/RARA/PWA/src/PickerField.tsx#L66-L68)).

`onFinish` refuses to submit without `foto`, `crop`, `nama`, `tanggal`, and
`nominal`. On failure it preserves the form and photo and shows the scroll-focused
error banner. On success it clears the draft and opens the success screen
([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L465-L503),
[FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L335-L341)).

The success screen currently gives `BARU` status a badge; `ADA_DI_BA_LAIN` is
included in the type contract but the live success markup only checks `BARU`
([types.ts](file:///C:/RARA/PWA/src/types.ts#L61-L68),
[FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L513-L521)).

## 6. Persistence And Recovery

Live storage keys:

```text
draft:v1
lastNama:v1
config:v1
popups:v1
opsi:v1
```

`saveDraft()` serializes BA, outlet, conditional new-outlet text, ISO date, and
nominal. It writes `lastNama:v1` whenever the draft includes `nama`
([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L216-L232)).

`loadInitialValues()` validates the saved BA and outlet against the options passed
into `FormPage`, rejects invalid dates, and reconstructs a Dayjs date. It can fall
back to `lastNama:v1` when a BA name is not already selected
([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L178-L214)).

A successful submission removes only `draft:v1`, leaving `lastNama:v1` for the next
form instance. The bottom Reset control removes both keys and changes the App-level
form key. The success screen uses the same App reset callback
([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L234-L240),
[App.tsx](file:///C:/RARA/PWA/src/App.tsx#L91-L99),
[FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L536-L538)).

The photo base64, data URL, and crop transform live in React state. They survive
the failed-submission state but do not survive page reload.

## 7. Live Component Graph

```text
main.tsx
  App.tsx
    BtnFrame.tsx                   Bottom Reset/Refresh buttons
    FormPage.tsx
      api.ts                       loadConfig, loadPopups, loadOptions, submitAnswer
      lib/image.ts                 compressImage
      lib/crop.ts                  cropDataUrl, loadImg, CropTransform
      PickerField.tsx
        Pil.tsx
        PickerWheel.tsx
      PilJawaban.tsx
      SlotTanggal.tsx
        Pil.tsx
      SlotNominal.tsx
        Pil.tsx
      PhotoCropper.tsx
        Popup.tsx
          BtnFrame.tsx
          Placeholder.tsx
        lib/crop.ts
      Popup.tsx
      styles/container.css imported at main.tsx
```

`Pil.tsx` is imported by picker fields, the date slot, and the nominal slot, so
those controls use the same artwork and row-height route
([Pil.tsx](file:///C:/RARA/PWA/src/Pil.tsx#L4-L13),
[PickerField.tsx](file:///C:/RARA/PWA/src/PickerField.tsx#L102-L121),
[SlotTanggal.tsx](file:///C:/RARA/PWA/src/SlotTanggal.tsx#L118-L139),
[SlotNominal.tsx](file:///C:/RARA/PWA/src/SlotNominal.tsx#L24-L41)).

`Placeholder` only centers content inside a box supplied by the caller. Popup owns
the assembly and text boxes, while `PhotoCropper` supplies the crop canvas inside
its body slot ([Placeholder.tsx](file:///C:/RARA/PWA/src/Placeholder.tsx#L3-L38),
[Popup.tsx](file:///C:/RARA/PWA/src/Popup.tsx#L229-L306),
[PhotoCropper.tsx](file:///C:/RARA/PWA/src/PhotoCropper.tsx#L237-L261)).

## 8. Layout Mechanics

### Picker Row

`.picker-sarang` declares `--frame-ratio: 4.533`
([PickerField.tsx](file:///C:/RARA/PWA/src/PickerField.tsx#L9-L18)).
`usePickerRow()` reads the ratio from computed CSS and sets `--picker-row` to
`width / ratio`, with a 30-pixel floor, using `ResizeObserver`
([pickerRow.ts](file:///C:/RARA/PWA/src/lib/pickerRow.ts#L8-L26)).

Pills and wheel rows use the resulting CSS variable. When a picker opens, the
three-row wheel is positioned one row above the pill socket so its center row
replaces the closed pill without moving surrounding content
([PickerField.tsx](file:///C:/RARA/PWA/src/PickerField.tsx#L23-L29),
[PickerWheel.tsx](file:///C:/RARA/PWA/src/PickerWheel.tsx#L130-L157)).

Scrolling changes only the highlighted option. The center row must be tapped to
commit. A click arriving within 220 ms of the last scroll is ignored
([PickerWheel.tsx](file:///C:/RARA/PWA/src/PickerWheel.tsx#L200-L271)).

### Art And Placeholders

Art is addressed through CSS `url('/...')` literals owned by the components:

| Component | Art Role |
|---|---|
| `Pil.tsx` | Normal base, focus light, gold band |
| `PickerWheel.tsx` | Half-frame layers, glow arcs, halo, center band |
| `PilJawaban.tsx` | Answer base and tap flash |
| `BtnFrame.tsx` | Button base, tap flash, bottom-bar placement |
| `Popup.tsx` | Sky, dialog frame, title banner, aura, ring, close disc, close mark, separators |
| `container.css` | Background image and SVG fallback |

The popup assembly is a square `--pop` box. Its nine visual layers use fixed
percentages recorded in [Popup.tsx](file:///C:/RARA/PWA/src/Popup.tsx#L21-L227).
The crop popup overrides the box to `min(92vw, 470px)`
([PhotoCropper.tsx](file:///C:/RARA/PWA/src/PhotoCropper.tsx#L237-L245)).

### Screen Positioning

`.page` uses `100dvh`, safe-area padding, and flex-end alignment for thumb reach.
Android keyboard viewport shrinkage is handled by the `max-height: 600px` query;
iOS keyboard detection is handled by a `visualViewport` height difference over 150
pixels, which adds `.keyboard-open`
([container.css](file:///C:/RARA/PWA/src/styles/container.css#L50-L72),
[App.tsx](file:///C:/RARA/PWA/src/App.tsx#L77-L89)).

The answer dock is fixed at `bottom: 62vh` and renders each committed answer as
its own pill. The bottom bar slides out whenever a wheel is open
([PilJawaban.tsx](file:///C:/RARA/PWA/src/PilJawaban.tsx#L17-L32),
[BtnFrame.tsx](file:///C:/RARA/PWA/src/BtnFrame.tsx#L19-L40),
[App.tsx](file:///C:/RARA/PWA/src/App.tsx#L37-L39)).

### Calendar

The date popup uses:

```text
--kal: min(100vw - 44px, (100dvh - 190px) * 1.05)
```

It places the card in the thumb zone, forces Ant Design dropdown and panel widths
to the card width, releases the inline dropdown `min-width`, and makes date cells
square with proportional font sizes
([SlotTanggal.tsx](file:///C:/RARA/PWA/src/SlotTanggal.tsx#L9-L101)).

## 9. Client Contracts

`AppConfig` fields and current runtime values are defined in
[public/config.json](file:///C:/RARA/PWA/public/config.json#L1-L21):

```text
apiUrl              /mock-submit
requestTimeoutMs    45000
image.maxSize       1600
image.quality       0.7
image.cropFrameRatio 0.75
image.cropPadColor  #ffffff
image.cropContract  1
limits.nominalMaxDigits 12
limits.nominalMax      15000
limits.outletMaxLen    80
```

The shared token field is present in the same public file. Its value is not copied
into this wiki.

`SubmitPayload` is:

```text
nama
outlet
outletBaru
tanggal       YYYY-MM-DD
nominal       digits only
fotoBase64    bare JPEG base64
crop          contract, rot, zoom, px, py
```

A registered outlet sends `outlet` and an empty `outletBaru`. The `__OTHER__`
choice reverses them ([types.ts](file:///C:/RARA/PWA/src/types.ts#L42-L59),
[FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L475-L485)).

The POST content type is `text/plain;charset=utf-8` with a JSON string body. This
is the route used to avoid the Apps Script CORS preflight
([api.ts](file:///C:/RARA/PWA/src/api.ts#L148-L157)).

Success:

```text
{ ok: true, fileName, outlet, statusOutlet }
```

Failure:

```text
{ ok: false, error }
```

`submitAnswer()` distinguishes timeout, network failure, non-JSON server output,
and a server validation rejection. The client reports that submissions have not
been confirmed in those cases ([api.ts](file:///C:/RARA/PWA/src/api.ts#L138-L189)).

The backend also compares new outlet names globally. Exact case-insensitive matches
resolve to canonical spelling; another BA gets `ADA_DI_BA_LAIN`; no exact match gets
`BARU` and may receive a Levenshtein-2 similar outlet
([Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L260-L301),
[Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L517-L552)).

## 10. Image And Crop Pipeline

`compressImage()` creates an object URL, scales the longest side down to the
configured limit without upscaling, paints a white background, and encodes JPEG at
the configured quality. It returns a data URL for preview and bare base64 for
submission; the object URL is revoked in the success, failure, and cleanup paths
([image.ts](file:///C:/RARA/PWA/src/lib/image.ts#L3-L74)).

`PhotoCropper` draws the live preview on a canvas whose size is measured from the
rendered element. A single pointer changes pan; two pointers change rotation,
scale, and pan. `clampPan()` keeps the frame center inside the source image, while
`normalizeRot()` constrains rotation to `-180..180` and rounds to two decimals.
`quantize()` rounds zoom and pan to four decimals
([PhotoCropper.tsx](file:///C:/RARA/PWA/src/PhotoCropper.tsx#L106-L230),
[crop.ts](file:///C:/RARA/PWA/src/lib/crop.ts#L14-L64)).

`drawCrop()` uses center-plus-rotation-plus-pan geometry. It fills the frame with
the pad color before drawing the transformed image
([crop.ts](file:///C:/RARA/PWA/src/lib/crop.ts#L66-L98)).

The phone sends the full compressed image and only four crop numbers. A
`cropPreview` is rendered locally for feedback, while the server stores the crop as
JSON and the PC cutter later performs the pixel cut
([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L315-L333),
[FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L475-L485),
[Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L225-L253)).

## 11. Backend Source

[apps-script/Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs) is the single-file
backend. It requires three script properties:

```text
SPREADSHEET_ID
ROOT_FOLDER_ID
TOKEN
```

The manifest selects V8, `Asia/Jakarta`, Stackdriver logging, deploy-user execution,
and anonymous web-app access
([appsscript.json](file:///C:/RARA/PWA/apps-script/appsscript.json#L1-L11)).

`doGet` checks the token and reads `Opsi` headers `NAMA_BA` and `OUTLET`, then
returns canonical BA names and their unique outlet lists
([Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L65-L183)).

`doPost` checks the token, opens the spreadsheet, validates the input, waits up to
20 seconds for a script lock, stores the file, and appends sheet rows
([Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L89-L135)).

Backend validation:

- BA must exist.
- Date must be a real ISO date and may be through H+1 in `Asia/Jakarta`.
- Nominal must match `^[1-9]\d{0,11}$`.
- Registered outlets must belong to the selected BA.
- New outlets are checked for length, formula-start characters, exact global
  matches, and similarity.
- JPEG must decode to 1.5 MB or less and start with `FF D8`.
- Crop values must be finite, with `0 < zoom <= 50` and absolute pan values no
  greater than three ([Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L185-L329)).

The current Apps Script source validates nominal digit count but does not apply the
`nominalMax` amount cap. The browser blocks advancement above the configured cap,
while direct requests can bypass that browser-side value
([FormPage.tsx](file:///C:/RARA/PWA/src/FormPage.tsx#L457-L463),
[Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L206-L212)).

The main table has nine columns:

```text
Timestamp, Nama BA, Outlet, Status Outlet, Tanggal, Nominal,
Foto (URL), Nama File, Crop (JSON)
```

New outlets separately produce a five-column `OutletBaru` row:

```text
Timestamp, Nama BA, Outlet, Mirip Dengan, Status Tinjau
```

The review-table write has its own `try` block and does not roll back the main
save ([Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L347-L378)).

Drive images land in:

```text
ROOT_FOLDER_ID/YYYY-MM/NamaBA_tanggal_Outlet.jpg
```

Duplicate base names receive `_2`, `_3`, and later suffixes
([Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L380-L408)).

`setupSheets()` creates or populates headers for both tables, sets the date column
format, and probes the Drive folder
([Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L416-L457)).

The manifest's anonymous deployment setting is source configuration only. It does
not prove that a web app is currently deployed. The frontend runtime config points
to the development mock.

## 12. Development Mock Server

`mock/receiver.mjs` registers itself through Vite's `configureServer` middleware.
Its endpoint is `/mock-submit`, matching the current frontend `apiUrl`
([receiver.mjs](file:///C:/RARA/PWA/mock/receiver.mjs#L24-L432)).

The mock:

- Reads the expected token from `public/config.json`.
- Serves options from `mock/options.json`.
- Limits HTTP bodies to 12 MB.
- Requires JPEG and a decoded image size of 1.5 MB or less.
- Validates BA, date, nominal shape, outlet status, and crop numbers.
- Creates a monthly image directory.
- Appends `mock/received/jawaban.json`.
- Appends `mock/received/outlet-baru.json` when the outlet status is `BARU`.

Its filename sanitizer removes all dots from components, while the Apps Script
sanitizer does not ([receiver.mjs](file:///C:/RARA/PWA/mock/receiver.mjs#L48-L61),
[Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L479-L485)).

The H+1 date boundary in the mock is calculated with `toISOString()`, while the
Apps Script boundary is formatted in `Asia/Jakarta`
([receiver.mjs](file:///C:/RARA/PWA/mock/receiver.mjs#L226-L236),
[Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L195-L204)).

The mock does not enforce `nominalMax`; its limits block only contains
`maxNominalDigits` and `maxOutletLen`, and validation does not compare the parsed
amount against the frontend cap
([receiver.mjs](file:///C:/RARA/PWA/mock/receiver.mjs#L26-L31),
[receiver.mjs](file:///C:/RARA/PWA/mock/receiver.mjs#L237-L244)).

`mock/options.json` currently holds 11 BA entries and their outlet arrays
([options.json](file:///C:/RARA/PWA/mock/options.json#L1-L55)).

## 13. Cutter

[cutter/cropper.py](file:///C:/RARA/PWA/cutter/cropper.py#L36-L217) implements the
same frame-relative affine math as the browser crop module. It contains both an
axis-aligned rectangle route and a rotated `cv2.warpAffine` route. It maps a
`hex` pad color to BGR and handles Unicode Windows paths through encoded buffers
([cropper.py](file:///C:/RARA/PWA/cutter/cropper.py#L89-L183)).

`Cropper` reads the phone's `cropFrameRatio` and `cropPadColor` from
`public/config.json`. The `parse()` route only accepts configured contracts and
the four coordinate fields ([cropper.py](file:///C:/RARA/PWA/cutter/cropper.py#L185-L217)).

[cutter/cut.py](file:///C:/RARA/PWA/cutter/cut.py#L27-L103) reads a JSON record
list, resolves photo paths relative to that list, and writes files beside the
source image using the configured suffix. It supports:

```text
--config
--dry-run
--force
```

It forces UTF-8 on stdout and stderr before printing names that contain non-ASCII
characters ([cut.py](file:///C:/RARA/PWA/cutter/cut.py#L11-L103)).
The current `cut.config.json` points at `C:/RARA/PWA/public/config.json` and
`C:/RARA/PWA/mock/received/jawaban.json`, with output width 1200, quality 0.95,
JPEG format, suffix `_NOTA`, and accepted contract `[1]`
([cut.config.json](file:///C:/RARA/PWA/cutter/cut.config.json#L1-L9)).

`RUN-CUT.bat` invokes `python -B cut.py --config cut.config.json` and forwards
`--dry-run` or `--force`
([RUN-CUT.bat](file:///C:/RARA/PWA/cutter/RUN-CUT.bat#L1-L17)).

`inspect_alpha.py` measures alpha geometry in UI assets and can emit JSON measurements
([inspect_alpha.py](file:///C:/RARA/PWA/cutter/inspect_alpha.py#L1-L9),
[inspect_alpha.py](file:///C:/RARA/PWA/cutter/inspect_alpha.py#L82-L110)).

There is no Python dependency manifest in the source tree. Running the cutter
requires `cv2` and `numpy` to already be available to `python`
([cropper.py](file:///C:/RARA/PWA/cutter/cropper.py#L24-L28)).

## 14. PWA And Offline Condition

VitePWA uses `registerType: prompt`, and `main.tsx` registers the service worker
with `{ immediate: true }`. The code supplies no update prompt or offline-ready
callback ([vite.config.ts](file:///C:/RARA/PWA/vite.config.ts#L10-L16),
[main.tsx](file:///C:/RARA/PWA/src/main.tsx#L1-L8)).

Precaching covers built JavaScript, CSS, HTML, SVG, PNG, ICO, JPG, and JPEG files.
JSON files are excluded so `/config.json` and `/popups.json` remain runtime-fetched
([vite.config.ts](file:///C:/RARA/PWA/vite.config.ts#L12-L16)).

Offline state available to the application comes from localStorage:

```text
config:v1
popups:v1
opsi:v1
draft:v1
lastNama:v1
```

There is no runtime HTTP cache and no offline outbox. Submission requires a live
network request; failed values remain in memory for a retry but a reload loses the
photo and crop.

The manifest uses standalone portrait display, a root start URL, the name
"Tracking Ice Cube + Mixer", and normal plus maskable icons
([vite.config.ts](file:///C:/RARA/PWA/vite.config.ts#L17-L45)).

## 15. Commands And Launchers

Package commands ([package.json](file:///C:/RARA/PWA/package.json#L6-L11)):

```text
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

`run-app.bat`:

- Checks for `node` and `npm`.
- Installs dependencies when `node_modules` is absent.
- Offers default browser or automation browser when started without arguments.
- Accepts `automation` directly.
- Supports `--port`.
- Defaults to port 5173 and Vite's own port selection.
- In automation mode, verifies Chrome and the existing
  `C:\RARA\BROWSER-AUTOMATION` profile, then launches a hidden PowerShell poller
  that opens the local URL on port 9333 after the server responds
  ([run-app.bat](file:///C:/RARA/PWA/run-app.bat#L26-L151)).

Netlify builds through `npm run build`, publishes `dist`, and applies no-store
headers to `/config.json`
([netlify.toml](file:///C:/RARA/PWA/netlify.toml#L1-L8)).

## 16. Agent Inspection Tooling

`agent-script/pwa-look2.mjs` talks to Chrome DevTools on port 9333 using a
browser-level WebSocket. It enumerates page targets, selects a local development
server tab rather than `pages[0]`, attaches using flattened target sessions,
captures a PNG, and prints URL, title, viewport, and up to 700 body characters
([pwa-look2.mjs](file:///C:/RARA/PWA/agent-script/pwa-look2.mjs#L20-L120)).

The default screenshot route is `agent-script/shots/pwa-now.png`, and a supplied
output path overrides it ([pwa-look2.mjs](file:///C:/RARA/PWA/agent-script/pwa-look2.mjs#L25-L28)).

The script does not write a spreadsheet, navigate a page, or close a tab. It does
overwrite the screenshot file it writes.

## 17. Relationship With ICE-FORM

PWA source files contain no live import from ICE-FORM and no reference to an
ICE-FORM Apps Script backend. The two folders run independently.

ICE-FORM uses the same client crop contract and copies several sprite assets. Its
development receiver and backend source mirror and diverge from this folder's
server behavior:

| Area | PWA Source | ICE-FORM Source |
|---|---|---|
| Options BA header | `NAMA_BA` | `NAMA_BA` |
| Main result table | 9-column `Jawaban` | 11-column `Jawaban` |
| New-outlet review | Separate `OutletBaru` table | Merged review columns |
| Server `nominalMax` | Not enforced | Enforced |
| Current frontend endpoint | `/mock-submit` | External `/exec` URL |

These comparisons are based on the files currently present in each folder
([PWA Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L17-L23),
[PWA Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L347-L378),
[ICE-FORM Code.gs](file:///C:/RARA/ICE-FORM/apps-script/Code.gs#L17-L25),
[ICE-FORM Code.gs](file:///C:/RARA/ICE-FORM/apps-script/Code.gs#L352-L375)).
