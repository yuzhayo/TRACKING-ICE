# Tracking Ice

Daily report app for Jatim field ops. A BA or TL opens the app on their phone, answers
five things (who, where, when, how much, photo), and the report goes out over the wire.

- Target: old Android phones in the field, portrait, installed as a PWA
- Language: Indonesian UI
- Talks to: a Google Apps Script web app that writes into the JATIM RARA workbook
  (Google Sheets) as backend. This repo holds the frontend only.

## Stack

- Svelte 5 (runes), Vite 8, TypeScript, no UI framework
- PWA: manifest + service worker (network-first), pull-to-refresh
- Deliberate legacy-Android support: targets `es2017 / chrome61 / safari11`,
  CSS `chrome61 / safari12`, plus a build-time CSS downgrade plugin and a
  runtime container-query polyfill. Do not "modernize" these without a device check.

## Requirements

- Node.js >= 24 (enforced in `package.json` `engines`)

## Run it locally

Double-click `run-app.bat`. It checks Node/npm, runs `npm install` if needed, and
serves on port `5300`. From the menu:

1. Open in the default browser
2. Open in the automation Chrome (port 9333)

Or by hand:

```
npm install
npm run dev            # vite, add -- --host 0.0.0.0 --port 5300 to expose on LAN
```

## Build and verify

```
npm run build          # vite build -> dist/
npm run check          # svelte-check, expected: 0 errors, 0 warnings
npm run preview        # serve the built dist/ locally
```

`dist/` is generated and git-ignored. Never edit it by hand; never treat it as source.

## How the app is put together

Single screen. `src/mainscreen.svelte` holds the state and the question flow;
`src/app.svelte` adds pull-to-refresh. Boxes are positioned, written and wired
from three JSON planes in `public/`, not from component code:

| Plane | File | Read by | Answers |
|---|---|---|---|
| geometry + paint | `public/layout.json` | `src/lib/layout.svelte.ts` (`box(path)`, `paint(path)`) | where the box is, how it looks |
| copy + typography | `public/text.json` | `src/lib/text.svelte.ts` (`t(path)`, `s(path)`) | the words, the type |
| what renders | `public/content.json` | `src/lib/content.svelte.ts` (`renderFor(path)`, `propsFor(path)`) | which component fills the box |

`PLACEHOLDERS.md` is the path register (51 registered paths). A path is real only if
the component calls all three translators; a key nothing reads is decoration.
To move, restyle, reword or re-wire a box: edit the JSON, not the components.

```
src/main.ts                 mount + polyfill bootstrap
src/app.svelte              pull-to-refresh shell
src/mainscreen.svelte       the screen: 5 answers, wheels, pads, popups
src/component/              shared atoms: Btn, Image, Info, PadKey, Pil, Video
src/*-placeholder.svelte    the feature boxes (wheel, calendar, nominal, upload, crop...)
src/lib/api.ts              the Apps Script contract (the only network code)
src/lib/crop.ts             canvas crop + preview
src/lib/{layout,text,content}.svelte.ts   JSON plane loaders
src/lib/cq-*.ts             container-query polyfill (old engines)
plugins/legacy-css.ts       vite pre-plugin, downgrades modern CSS at build time
```

## Backend contract

Everything sheet-side sits behind one Apps Script web app. Endpoint and the public
anti-spam token live in `public/config.json` - committed on purpose, the token is
not a secret and the app treats it that way. Do not "secure" it by hiding it;
it gates nothing but bots.

On open:

1. `loadConfig()` fetches `/config.json` (cache-first, mirrored to localStorage `config:v1`)
2. `fetchOptions()` GETs `{apiUrl}?action=options&token=...` (30 s budget; Apps Script
   cold start is slow). BA and outlet lists are painted instantly from localStorage
   `opsi:v1`, then swapped for the fresh copy. Everything is shown UPPERCASE.

On confirm:

```
POST {apiUrl}
content-type: text/plain;charset=utf-8
{ "token": "...", "nama", "outlet", "outletBaru", "tanggal",
  "nominal", "fotoBase64", "crop": { "contract", "rot", "zoom", "px", "py" } }
```

45 s budget. Any failure leaves the report NOT sent, with the Indonesian error text
the operator sees in the app; the app never claims a delivery that did not happen.
Response: `{ ok: true, fileName, outlet, statusOutlet }`.

Local persistence: localStorage only (`config:v1`, `opsi:v1`, install-dismiss
timestamp). No user accounts, no cookies, no telemetry.

## PWA details

- `public/manifest.webmanifest`: standalone, portrait, `ice.png` icons
- `public/sw.js`: network-first fetch passthrough ("installability gate, no stale UI").
  As of 2026-11 the codebase never calls `serviceWorker.register` - the register call
  was lost in the data-driven refactor of the info menu; the gear menu only
  *unregisters*. Install therefore rides on Chrome's "Add to Home screen".
- `public/_headers`: HTML and JSON always revalidate; `/assets/*` (content-hashed)
  immutable for 1 year; PNG 1 day
- `public/_redirects`: `/* -> /index.html 200` (SPA fallback)
- Pull-to-refresh and the gear menu both wipe caches and unregister service workers

## Deploy

Hosted on **Cloudflare Pages**, project `report-ice-cube`.

- Live: https://report-ice-cube.pages.dev/ (HTTP 200, `<title>Tracking Ice</title>`, verified 2026-11-06)
- **No git repository is connected to the Pages project** (dashboard, Settings,
  "Git repository: Connect"). Pushing to GitHub does NOT deploy anything.
- Deploys are direct uploads from a local machine with `wrangler` (the dashboard
  shows no build section, and this repo has no deploy script - the flow below is
  inferred and should be confirmed by whoever deploys):

  ```
  npm run build
  npx wrangler pages deploy dist --project-name=report-ice-cube
  ```

  with the Cloudflare API token from `cloudflare-key.txt` (local, git-ignored,
  never committed) supplied as `CLOUDFLARE_API_TOKEN` or through npx.
- Latest Production deploy at verification time: 2026-11-01, commit `bf72bae`
  ("fix: improve compatibility for older browsers and devices"), status success.
  HEAD (`51ab9b4`, gitignore-only) came after and is not part of that upload.
  Any deploy is a snapshot of whatever `dist/` looked like on the deploying machine.
- `public/_headers` and `public/_redirects` ship with `dist/` and are honored by
  Cloudflare Pages.
- Netlify is stale (its site 404s; its config and token are pending separate
  cleanup). Do not re-add `netlify.toml`.

## Repo hygiene

This repository is **public**. Never commit credentials. `.gitignore` already blocks
`cloudflare-key.txt`, `*.key`, `*-key.txt`, `.env*`, `NETLIFY_PERSONAL_ACCESS_TOKEN.txt`,
`.netlify/`, `node_modules/`, `dist/`. `package-lock.json` is intentionally not
committed (currently git-ignored).

No secrets of any kind belong in `public/` - everything there ships to every visitor.

## More

`PLACEHOLDERS.md` - the 51-path register for the three JSON planes. Read it before
adding a box; update it (and the JSON) in the same change as any new path.
