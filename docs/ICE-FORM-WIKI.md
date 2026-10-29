# ICE-FORM Wiki

Generated on 2026-10-27 from the files, configuration, and executable output that
are present in [C:\RARA\ICE-FORM](file:///C:/RARA/ICE-FORM). This page describes
the observed code paths and runtime configuration.

## Table of Contents

1. [Runnable Application](#1-runnable-application)
2. [Folder Contents](#2-folder-contents)
3. [Current Build And Test Condition](#3-current-build-and-test-condition)
4. [Startup And Data Loading](#4-startup-and-data-loading)
5. [Form Flow](#5-form-flow)
6. [Live Component Graph](#6-live-component-graph)
7. [Unconnected Source Modules](#7-unconnected-source-modules)
8. [Layout Data And Renderer](#8-layout-data-and-renderer)
9. [State Containers](#9-state-containers)
10. [Client Contracts](#10-client-contracts)
11. [Image And Crop Pipeline](#11-image-and-crop-pipeline)
12. [Backend Source](#12-backend-source)
13. [Development Mock Server](#13-development-mock-server)
14. [PWA And Offline Condition](#14-pwa-and-offline-condition)
15. [Commands And Launchers](#15-commands-and-launchers)
16. [Tooling](#16-tooling)
17. [Relationship With PWA](#17-relationship-with-pwa)

## 1. Runnable Application

[ICE-FORM](file:///C:/RARA/ICE-FORM) is a Vite React TypeScript PWA. It has no
router and no secondary screen. The live page sequence is:

```text
[index.html](file:///C:/RARA/ICE-FORM/index.html#L11-L14)
  -> [main.tsx](file:///C:/RARA/ICE-FORM/src/main.tsx#L1-L8)
  -> [App.tsx](file:///C:/RARA/ICE-FORM/src/App.tsx#L24-L97)
  -> [FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L29-L208)
```

The direct runtime dependencies are React 19, React DOM 19, Ant Design 6, Day.js,
Vite 8, TypeScript 5.9, and `vite-plugin-pwa` 2. The package declares Node 24 or
newer ([package.json](file:///C:/RARA/ICE-FORM/package.json#L6-L30)).

The application targets a nota report with these values:

```text
nama, outlet, tanggal, nominal, fotoBase64, crop
```

A successful response returns `fileName`, canonical `outlet`, and
`statusOutlet` ([types.ts](file:///C:/RARA/ICE-FORM/src/logic/types.ts#L40-L75)).

## 2. Folder Contents

```text
ICE-FORM\
  index.html                 Browser entry
  package.json               Scripts and dependencies
  vite.config.ts             React, mock plugin, PWA plugin
  tsconfig.json              Strict TypeScript, erasable syntax settings
  netlify.toml               Static Netlify build settings
  run-dev.bat                Fixed-port dev launcher
  run-opencode.bat           Opens OpenCode in this directory
  PLAN.md                    Historical build record

  src\
    main.tsx                 Service-worker registration and touch ripple
    App.tsx                  Configuration loading and screen shell
    FormPage.tsx             Active step rendering and submission composition
    index.css                Global reset, tokens, page/card placement
    screens\                 Step sequence data
    layouts\                 Partial layout descriptors
    logic\                   API, interview, crop, image, and hook code
    behavior\                Components; some are live, others are isolated
    render\                  Unused LayerStack route

  public\
    config.json              Runtime endpoint, token, limits, image settings
    popups.json              Popup strings
    Icons and UI sprites

  assets\                    63 sprite entries and ImageRegistry.json
  apps-script\               Apps Script source and manifest
  mock\                      In-memory development receiver
  tools\                     Registry, agreement, golden-crop, and pixel tools
  tests\                     Node test files
  dist\                      Current generated build output
```

The folder contains its own `.git` directory. It is a separate local repository
inside `C:\RARA`.

## 3. Current Build And Test Condition

On 2026-10-27:

```text
npm run verify     exit 0
  tsc --noEmit     pass
  node --test      71 tests, 71 pass, 0 fail
  npm run build    pass

node tools/check-agreement.mjs
  exit 0
```

The production build produced 68 precached entries, `dist/sw.js`, and
`dist/manifest.webmanifest`. Its main JavaScript chunk was 696.53 kB raw and
224.06 kB gzipped, and Vite emitted the standard large-chunk warning
([build output](file:///C:/Users/YUZHA/AppData/Local/Temp/qoder-cli/C--RARA/a973f33b-4d48-4a21-b341-ec17f8144e69/tasks/b7960ipl2.output#L85-L112)).

The 71 tests cover crop arithmetic, crop golden comparisons, interview
transitions, screen data references, layout grammar, nominal parsing, and outlet
name functions. They do not render React components or submit payloads.

## 4. Startup And Data Loading

`App.tsx` runs initialization through `initApp()`
([App.tsx](file:///C:/RARA/ICE-FORM/src/App.tsx#L34-L56)):

1. Fetch `/config.json` without browser caching.
2. Apply `labels.title` to `document.title`.
3. Fetch `/popups.json`.
4. Fetch BA and outlet options from `cfg.apiUrl`.
5. Render `FormPage` when configuration and options both exist.

Failure behavior:

| Resource | Failure Path |
|---|---|
| `config.json` | Network failure uses the last `config:v1` localStorage entry; no cached value blocks initialization ([api.ts](file:///C:/RARA/ICE-FORM/src/logic/api.ts#L17-L32)) |
| `popups.json` | Network failure uses `popups:v1`; failure with no cache sets an empty popup map ([App.tsx](file:///C:/RARA/ICE-FORM/src/App.tsx#L41), [api.ts](file:///C:/RARA/ICE-FORM/src/logic/api.ts#L34-L46)) |
| Options | Network failure uses `opsi:v1` and reports `stale`; `App.tsx` logs it to the console and discards the flag. Failure with no cache produces `{ ba: [], outlets: {} }` ([App.tsx](file:///C:/RARA/ICE-FORM/src/App.tsx#L42-L48), [api.ts](file:///C:/RARA/ICE-FORM/src/logic/api.ts#L48-L67)) |

Options requests have a five-second `AbortController` timeout
([api.ts](file:///C:/RARA/ICE-FORM/src/logic/api.ts#L48-L66)). Submit requests use
`cfg.requestTimeoutMs` and fall back to 45 seconds in code
([api.ts](file:///C:/RARA/ICE-FORM/src/logic/api.ts#L69-L96)).

## 5. Form Flow

`FormPage.tsx` imports `screens/laporan.json` and derives `currentStep` through
`useInterview()` ([FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L29-L30),
[useInterview.ts](file:///C:/RARA/ICE-FORM/src/logic/useInterview.ts#L10-L39)).

The declared sequence is:

```text
nama -> outlet -> tanggal -> nominal -> foto -> kirim
```

Each question has one live control:

| Step | Live Control | Advance |
|---|---|---|
| `nama` | `PickerField` over `options.ba` | Center-row tap commits, records the answer, clears the outlet selection, and calls `goToStep('outlet')` ([FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L65-L70)) |
| `outlet` | `PickerField` over outlets attached to the chosen BA | Center-row tap advances to `tanggal` ([FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L72-L76)) |
| `tanggal` | Ant Design `DatePicker` inside `Pil` | Date selection advances to `nominal` ([FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L131-L133), [TanggalSlot.tsx](file:///C:/RARA/ICE-FORM/src/behavior/TanggalSlot.tsx#L73-L96)) |
| `nominal` | Ant Design numeric input inside `Pil` | Enter or blur commits. A value above `cfg.limits.nominalMax` opens the warning and remains on the step; otherwise it advances to `foto` ([FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L134-L147)) |
| `foto` | Hidden file input inside `Pil`, followed by crop editor | Compressing a file opens `PhotoCropper`; OK stores contract `1` and four numbers, then advances to `kirim` ([FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L148-L188)) |
| `kirim` | `KirimSlot` button | Opens `kirim_report`; OK sends the payload ([FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L169-L199)) |

The current outlet options do not contain an "other outlet" entry, and the submit
handler always sends `outletBaru: ''`
([FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L54-L55),
[FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L78-L89)). In the live
route, only registered outlets can be submitted.

The dock is constructed from individual React values, not from the interview
answer map. It shows committed text answers and excludes the active step
([FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L58-L63)). Tapping a
dock item calls `goToStep(stepId)`.

Submission success replaces the form with `SuccessView`
([FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L102-L117)). Failure
leaves the form mounted and shows the error banner. An error state renders two
`ErrorBanner` instances: one connected to the scroll/focus ref and one without a
ref ([FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L122-L123)).

## 6. Live Component Graph

The route that Vite reaches during submission uses these files:

```text
main.tsx
  App.tsx
    logic/api.ts
    behavior/BtnFrame.tsx          Bottom Reset/Refresh controls
    FormPage.tsx
      logic/interview.ts           Step transition functions
      logic/useInterview.ts        Step state
      logic/useSubmission.ts       Submission state
      logic/api.ts                 submitAnswer
      logic/image.ts               compressImage
      behavior/PickerField.tsx
        behavior/Pil.tsx
        behavior/PickerWheel.tsx
      behavior/TanggalSlot.tsx
        behavior/Pil.tsx
      behavior/NominalSlot.tsx
        behavior/Pil.tsx
      behavior/FotoSlot.tsx
        behavior/Pil.tsx
      behavior/KirimSlot.tsx
        behavior/Pil.tsx
      behavior/AnswerDock.tsx
      behavior/ErrorBanner.tsx
      behavior/PhotoCropper.tsx
        behavior/Popup.tsx
        logic/cropModel.ts
        logic/cropMath.ts
        logic/cropRender.ts
      behavior/SuccessView.tsx
        logic/cropRender.ts
      behavior/Popup.tsx
        behavior/BtnFrame.tsx
        behavior/Placeholder.tsx
```

`App.tsx` also defines the Ant Design dark locale and the global touch ripple
lives in `main.tsx`.

The live controls obtain art from hardcoded CSS URLs:

| Component | URL Source |
|---|---|
| `Pil` | [Pil.tsx](file:///C:/RARA/ICE-FORM/src/behavior/Pil.tsx#L4-L18) |
| `PickerWheel` | [PickerWheel.tsx](file:///C:/RARA/ICE-FORM/src/behavior/PickerWheel.tsx#L5-L39) |
| `Popup` | [Popup.tsx](file:///C:/RARA/ICE-FORM/src/behavior/Popup.tsx#L15-L172) |
| `AnswerDock` | [AnswerDock.tsx](file:///C:/RARA/ICE-FORM/src/behavior/AnswerDock.tsx#L7-L15) |
| `BtnFrame` | [BtnFrame.tsx](file:///C:/RARA/ICE-FORM/src/behavior/BtnFrame.tsx#L7-L17) |

The live picker socket defines `--frame-ratio: 4.533` in CSS, while
`logic/pickerRow.ts` also defines `FRAME_RATIO = 4.533` and uses that constant to
write `--picker-row`
([PickerField.tsx](file:///C:/RARA/ICE-FORM/src/behavior/PickerField.tsx#L8-L20),
[pickerRow.ts](file:///C:/RARA/ICE-FORM/src/logic/pickerRow.ts#L3-L19)).

## 7. Unconnected Source Modules

These source files compile and can be imported, but no live submission route
imports them:

| Module | Current Condition |
|---|---|
| [render/LayerStack.tsx](file:///C:/RARA/ICE-FORM/src/render/LayerStack.tsx) | Imported only by `PopupFull.tsx` |
| [render/useLayout.ts](file:///C:/RARA/ICE-FORM/src/render/useLayout.ts) | Imported only by `LayerStack.tsx` |
| [render/slots.tsx](file:///C:/RARA/ICE-FORM/src/render/slots.tsx) | No importer in the observed `src` tree |
| [behavior/PopupFull.tsx](file:///C:/RARA/ICE-FORM/src/behavior/PopupFull.tsx) | No importer |
| [behavior/PopupCrop.tsx](file:///C:/RARA/ICE-FORM/src/behavior/PopupCrop.tsx) | No importer; `FormPage` uses `PhotoCropper` directly |
| [behavior/NamaSlot.tsx](file:///C:/RARA/ICE-FORM/src/behavior/NamaSlot.tsx) | No importer |
| [behavior/OutletSlot.tsx](file:///C:/RARA/ICE-FORM/src/behavior/OutletSlot.tsx) | No importer |
| [behavior/UploadButton.tsx](file:///C:/RARA/ICE-FORM/src/behavior/UploadButton.tsx) | No importer |
| [logic/draftStore.ts](file:///C:/RARA/ICE-FORM/src/logic/draftStore.ts) | No importer; `App.tsx` removes the same key strings directly |
| [logic/nominal.ts](file:///C:/RARA/ICE-FORM/src/logic/nominal.ts) | Used by its own tests, not by live form components |
| [logic/outletName.ts](file:///C:/RARA/ICE-FORM/src/logic/outletName.ts) | Used by its own tests, not by live form components |

`FormPage.tsx` destructures `currentStep`, `answer`, and `goToStep` from
`useInterview()`. The hook also exposes `advanceStep` and `resetFromStep`, and the
underlying state contains an answer map and history array, but the form screen
does not use those values or functions
([FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L30),
[useInterview.ts](file:///C:/RARA/ICE-FORM/src/logic/useInterview.ts#L31-L39)).

`NominalSlot` keeps digit state local and emits formatted display values. The
pure nominal functions are not used by the live component. Current code also
writes diagnostic arrays onto `window.__onChangeLog` and
`window.__sefailLog` during input and commit
([FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L134-L146),
[NominalSlot.tsx](file:///C:/RARA/ICE-FORM/src/behavior/NominalSlot.tsx#L18-L41)).

## 8. Layout Data And Renderer

The layout type is a descriptor with `id`, `base`, optional `tokens`, layers, and
slots ([types.ts](file:///C:/RARA/ICE-FORM/src/logic/types.ts#L88-L109)). Eight
descriptors are registered:

```text
pil, wheel, popup, crop-stage, screen, picker-nest, calendar, btn-frame
```

`useLayout()` imports them statically and returns a layout through state
([useLayout.ts](file:///C:/RARA/ICE-FORM/src/render/useLayout.ts#L4-L34)).
`LayerStack()` resolves the layout and maps it to absolute `<img>` layers and slot
`<div>`s ([LayerStack.tsx](file:///C:/RARA/ICE-FORM/src/render/LayerStack.tsx#L16-L55)).
Its slot implementation currently places all children into the first control slot
and renders text slots as empty spans.

`ImageRegistry.json` contains 63 entries mapping sprite identifiers to paths under
`assets/` ([ImageRegistry.json](file:///C:/RARA/ICE-FORM/assets/ImageRegistry.json#L1-L30)).
Live components bypass this registry and reference `/sprite.png` URLs directly.

`PopupFull.tsx` is the only LayerStack consumer, and no screen imports
`PopupFull.tsx`. The layout JSON therefore is present and schema-tested, but does
not drive the live form art.

`tests/layout-schema.test.ts` validates the layout grammar and rejects raw
transitions, unknown states, and bare pixels inside layer/slot boxes
([layout-schema.test.ts](file:///C:/RARA/ICE-FORM/tests/layout-schema.test.ts#L9-L73)).

## 9. State Containers

### Interview State

`initState()` starts at `laporan.json.steps[0]`. `advance()` follows the step's
`next` value; `goTo()` validates the destination and replaces `currentStep`;
`resetFrom()` deletes the chosen answer and answers later in the chain
([interview.ts](file:///C:/RARA/ICE-FORM/src/logic/interview.ts#L11-L63)).
`recordAnswer()` adds an answer by step identifier
([interview.ts](file:///C:/RARA/ICE-FORM/src/logic/interview.ts#L66-L71)).

The hook keeps this state in a React `useState` value
([useInterview.ts](file:///C:/RARA/ICE-FORM/src/logic/useInterview.ts#L10-L40)).

### Form Values

`FormPage` separately stores:

```text
namaTerpilih, outletTerpilih, tanggal, nominal, foto, crop
```

These values govern the visible dock, submit guards, and success screen
([FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L33-L43)). There is no
draft writer and no initial draft reader in the live component.

### Submission State

`useSubmission()` exposes `idle`, `sending`, `error`, and `success` state, plus a
server-result object. Its `serverResult` is not consumed by the UI; `FormPage`
maintains a separate `terkirim` state for the success screen
([useSubmission.ts](file:///C:/RARA/ICE-FORM/src/logic/useSubmission.ts#L3-L34),
[FormPage.tsx](file:///C:/RARA/ICE-FORM/src/FormPage.tsx#L43-L92)).

### Layout-Related Runtime Values

`pickerRow.ts` measures a container with `ResizeObserver`, derives a row height
with a 30-pixel floor, and exposes `bacaRowTinggi()` for wheel scrolling
([pickerRow.ts](file:///C:/RARA/ICE-FORM/src/logic/pickerRow.ts#L6-L26)).
`PhotoCropper` separately measures its canvas and keeps `frame.w` and `frame.h`
state for gesture normalization ([PhotoCropper.tsx](file:///C:/RARA/ICE-FORM/src/behavior/PhotoCropper.tsx#L93-L135)).

## 10. Client Contracts

`AppConfig` requires `apiUrl`, `token`, `requestTimeoutMs`, an image block, and a
limits block. The current values are:

```text
maxSize          1600
quality          0.7
cropFrameRatio   0.75
cropPadColor     #ffffff
cropContract     1
nominalMaxDigits 12
nominalMax       15000
outletMaxLen     80
requestTimeoutMs 45000
```

The source is [public/config.json](file:///C:/RARA/ICE-FORM/public/config.json#L1-L24).

Runtime configuration:

- `apiUrl` is an HTTPS Google Apps Script `/exec` URL.
- A second field retains a placeholder URL.
- The shared token field exists in the same public runtime file.

The values are not reproduced in this wiki because the configuration file is the
source.

`loadOptions()` sends:

```text
GET <apiUrl>?action=options&token=<token>
```

and expects `{ ok: true, data: { ba: string[], outlets: Record<string, string[]> } }`
([api.ts](file:///C:/RARA/ICE-FORM/src/logic/api.ts#L48-L67)).

`submitAnswer()` posts:

```text
Content-Type: text/plain;charset=utf-8
body: JSON with token, nama, outlet, outletBaru, tanggal, nominal,
      fotoBase64, crop
```

The text content type avoids a CORS preflight. The client parses any non-JSON
response into a deployment/access failure message
([api.ts](file:///C:/RARA/ICE-FORM/src/logic/api.ts#L69-L97)).

`crop` contains:

```text
contract: number
rot: number
zoom: number
px: number
py: number
```

`rot` is clockwise degrees. `zoom` is relative to the contain scale. `px` and `py`
are measured in frame widths and frame heights
([cropModel.ts](file:///C:/RARA/ICE-FORM/src/logic/cropModel.ts#L3-L21)).

## 11. Image And Crop Pipeline

### Compression

`compressImage()` creates an object URL, decodes the file, scales the longest side
down to `cfg.image.maxSize`, never scales it up, paints a white background, draws
the image into a canvas, and emits a JPEG data URL plus base64. It revokes the
object URL in the success and error paths
([image.ts](file:///C:/RARA/ICE-FORM/src/logic/image.ts#L3-L59)).

### Crop Editor

`PhotoCropper` keeps the frame stationary and manipulates the image. One pointer
changes `px` and `py`; two pointers change distance-derived rotation, zoom, and
center movement. `clampPan()` restricts the frame center from moving beyond the
source image; `normalizeRot()` returns to `-180..180` with two-decimal rounding;
`quantize()` stores four decimal places for zoom and pan
([PhotoCropper.tsx](file:///C:/RARA/ICE-FORM/src/behavior/PhotoCropper.tsx#L137-L228),
[cropMath.ts](file:///C:/RARA/ICE-FORM/src/logic/cropMath.ts#L6-L47)).

`drawCrop()` places the image at the transformed center, rotates, scales, and
draws it centered on the supplied pad color
([cropRender.ts](file:///C:/RARA/ICE-FORM/src/logic/cropRender.ts#L5-L29)).
The editor produces four numbers; it never sends a cropped image file.

### Golden Fixtures

`crop-golden.test.ts` compares `baseScale`, `effectiveScale`, `frameSize`, and
`outputSize` against six JSON fixtures
([crop-golden.test.ts](file:///C:/RARA/ICE-FORM/tests/crop-golden.test.ts#L7-L34)).
The fixtures were generated by the frozen Python cutter copy
([generate-golden.py](file:///C:/RARA/ICE-FORM/tools/crop-golden/generate-golden.py#L13-L69)).
The fixture file also contains affine matrix values, but the current TypeScript
test does not compare the matrix.

There is currently no top-level `ICE-FORM\cutter\` directory. The Python cutter
files are under `tools/crop-golden` as `pwa_cropper.py` and `pwa_cut.py`
([tools directory](file:///C:/RARA/ICE-FORM/tools/crop-golden/pwa_cropper.py#L36-L217),
[pwa_cut.py](file:///C:/RARA/ICE-FORM/tools/crop-golden/pwa_cut.py#L27-L103)).

## 12. Backend Source

[Code.gs](file:///C:/RARA/ICE-FORM/apps-script/Code.gs) is a single-file Google
Apps Script source. It requires three script properties by name:

```text
SPREADSHEET_ID
ROOT_FOLDER_ID
TOKEN
```

It uses `Asia/Jakarta`, V8, Stackdriver logging, executes as the deploying user,
and is configured for anonymous web-app access
([appsscript.json](file:///C:/RARA/ICE-FORM/apps-script/appsscript.json#L1-L10)).

`doGet` checks the token and reads tab `Opsi`. Its source expects headers
`NAMA_BA` and `OUTLET`; it builds a canonical BA list and case-insensitive,
duplicate-suppressed outlet arrays
([Code.gs](file:///C:/RARA/ICE-FORM/apps-script/Code.gs#L65-L185)).

`doPost` validates before acquiring the script lock, then stores the photo and
appends a sheet row inside the lock
([Code.gs](file:///C:/RARA/ICE-FORM/apps-script/Code.gs#L89-L137)).

Live validation in this source:

- BA exists in `Opsi`.
- Date is a real ISO date and no later than H+1 in `Asia/Jakarta`.
- Nominal matches `^[1-9]\d{0,11}$`.
- Nominal is at most 15000.
- Registered outlets must match the selected BA.
- New-outlet values reject a leading `= + - @`, enforce 2-80 characters, resolve
  case-insensitive existing outlets, and detect another BA's outlet.
- Image base64 must decode to 1.5 MB or less and carry JPEG magic bytes `FF D8`.
- Crop requires finite `rot`, `zoom`, `px`, and `py`; zoom must be greater than
  zero and at most 50; pan values may not exceed absolute three.

The backend records a numeric crop contract, using zero when an invalid contract
is supplied ([Code.gs](file:///C:/RARA/ICE-FORM/apps-script/Code.gs#L239-L258)).
The client sends contract 1.

Storage writes one 11-column `Jawaban` row:

```text
Timestamp
Nama BA
Outlet
Status Outlet
Tanggal
Nominal
Foto (URL)
Nama File
Crop (JSON)
Mirip Dengan
Status Tinjau
```

Review columns receive values when status is `BARU`. Photos go to
`ROOT_FOLDER_ID/YYYY-MM/NamaBA_tanggal_Outlet.jpg`; name collisions receive `_2`,
`_3`, and so on
([Code.gs](file:///C:/RARA/ICE-FORM/apps-script/Code.gs#L352-L405)).

`setupSheets()` creates and formats `Jawaban`, then probes the Drive root
([Code.gs](file:///C:/RARA/ICE-FORM/apps-script/Code.gs#L413-L449)). The folder
contains a separate `properties.txt` deployment-properties file; its identifiers
are not copied into this wiki.

## 13. Development Mock Server

`mock/receiver.mjs` exports a Vite plugin registered before `VitePWA`
([vite.config.ts](file:///C:/RARA/ICE-FORM/vite.config.ts#L7-L11)). The plugin
attaches middleware only in `configureServer`, so `/mock-submit` exists while
`npm run dev` is running
([receiver.mjs](file:///C:/RARA/ICE-FORM/mock/receiver.mjs#L417-L430)).

The receiver:

- Reads its expected token from `public/config.json`.
- Serves options from `mock/options.json`.
- Enforces 12 MB of request body and 1.5 MB of decoded image.
- Rejects non-JPEG data.
- Applies the same BA, date, nominal, outlet, and crop checks.
- Applies `nominalMax` 15000.
- Stores images under `mock/received/<YYYY-MM>/`.
- Appends answers to `mock/received/jawaban.json`.
- Stores review fields inside each `jawaban.json` record instead of writing a
  separate review file.

Its H+1 boundary is derived from `toISOString()` in UTC, whereas the Apps Script
source uses `Asia/Jakarta`
([receiver.mjs](file:///C:/RARA/ICE-FORM/mock/receiver.mjs#L220-L250),
[Code.gs](file:///C:/RARA/ICE-FORM/apps-script/Code.gs#L197-L204)).
Its filename sanitizer removes dots from name components; the Apps Script sanitizer
does not ([receiver.mjs](file:///C:/RARA/ICE-FORM/mock/receiver.mjs#L49-L61),
[Code.gs](file:///C:/RARA/ICE-FORM/apps-script/Code.gs#L471-L477)).

The current runtime config selects the external Apps Script endpoint rather than
this development route.

## 14. PWA And Offline Condition

VitePWA is registered with `registerType: prompt`, and `main.tsx` calls
`registerSW({ immediate: true })`. There is no visible update or offline-ready UI
([vite.config.ts](file:///C:/RARA/ICE-FORM/vite.config.ts#L10-L12),
[main.tsx](file:///C:/RARA/ICE-FORM/src/main.tsx#L1-L8)).

Precaching includes JavaScript, CSS, HTML, SVG, PNG, ICO, JPG, and JPEG assets but
not JSON. `/config.json` and `/popups.json` have a Workbox NetworkFirst route with
a five-second network timeout, a seven-day expiration, and a maximum of four cache
entries ([vite.config.ts](file:///C:/RARA/ICE-FORM/vite.config.ts#L12-L25)).

The application also has localStorage copies of configuration, popup text, and
options. It does not have an offline submission queue. A photo remains in React
state until reload, and the current live form writes no text draft to storage.

The manifest uses the name ICE-FORM, standalone portrait display, root start URL,
dark colors, and normal plus maskable icons
([vite.config.ts](file:///C:/RARA/ICE-FORM/vite.config.ts#L26-L52)).

## 15. Commands And Launchers

Package commands ([package.json](file:///C:/RARA/ICE-FORM/package.json#L6-L13)):

```text
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
npm run verify
npm run sync:image
node tools/check-agreement.mjs
```

`run-dev.bat` changes into the project directory, confirms Node is present, finds
the process listening on port 5301, terminates that process tree when the port is
occupied, and starts Vite on 5301 with host `0.0.0.0`
([run-dev.bat](file:///C:/RARA/ICE-FORM/run-dev.bat#L13-L42)).

`run-opencode.bat` checks for `opencode` in `PATH`, runs it from the project
directory, and does not start a Vite server or browser
([run-opencode.bat](file:///C:/RARA/ICE-FORM/run-opencode.bat#L13-L23)).

Netlify configuration builds through `npm run build`, publishes `dist`, and applies
no-store headers to `/config.json`
([netlify.toml](file:///C:/RARA/ICE-FORM/netlify.toml#L1-L8)).

## 16. Tooling

`tools/sync-image.mjs` scans `assets/`, assigns identifiers by removing image
extensions, writes `assets/ImageRegistry.json`, and prints the count. It defines
an unused `pwaPublic` path and does not copy files from PWA during the current run
([sync-image.mjs](file:///C:/RARA/ICE-FORM/tools/sync-image.mjs#L5-L21)).

`tools/check-agreement.mjs` extracts numeric limits from `public/config.json`,
`apps-script/Code.gs`, and `mock/receiver.mjs`, then compares
`maxNominalDigits`, `maxNominal`, and `maxOutletLen`
([check-agreement.mjs](file:///C:/RARA/ICE-FORM/tools/check-agreement.mjs#L9-L67)).

`tools/pixel-diff.mjs` connects to Chrome DevTools on port 9333, creates a blank
target, loads two base64 PNG inputs into browser canvases, and prints the
percentage of differing RGB pixels
([pixel-diff.mjs](file:///C:/RARA/ICE-FORM/tools/pixel-diff.mjs#L8-L83)).

`tools/crop-golden` contains the frozen PWA cutter, a generator, the resulting
fixture JSON, a Python config that points at PWA data paths, and a Python bytecode
cache. The live tests use the fixture JSON rather than invoking Python
([fixtures](file:///C:/RARA/ICE-FORM/tools/crop-golden/golden_fixtures.json#L1-L35),
[fixture config](file:///C:/RARA/ICE-FORM/tools/crop-golden/pwa_cut.config.json#L1-L9)).

## 17. Relationship With PWA

ICE-FORM contains local copies of the game UI sprites in `public/` and `assets/`,
and its crop math mirrors the PWA crop contract. Its development mock also mirrors
the backend validation route.

There is no live application import from PWA. No component or logic file resolves
into `C:\RARA\PWA\src`. The external PWA references are:

- An unused path constant in `tools/sync-image.mjs`.
- Absolute input paths in `tools/crop-golden/pwa_cut.config.json`.
- Historical documentation text.

The backend schema differs from the PWA Apps Script source: ICE-FORM combines
review fields into an 11-column `Jawaban` row and names its options column
`NAMA_BA`, while PWA keeps separate `Jawaban` and `OutletBaru` tables
([ICE-FORM Code.gs](file:///C:/RARA/ICE-FORM/apps-script/Code.gs#L17-L25),
[PWA Code.gs](file:///C:/RARA/PWA/apps-script/Code.gs#L17-L23)).
