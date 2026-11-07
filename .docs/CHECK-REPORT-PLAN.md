# CHECK-REPORT-PLAN.md - "Check hasil input" end to end

Single source of truth for the feature. If the code and this file disagree, the
code is wrong. Any change to scope goes through an edit of this file FIRST.

---

## 1. GOAL

A standalone full-screen "Check hasil input" reachable from the main form, showing
each BA's reported total for a month, expandable to a day-by-day detail.

Operator hard rule: **new files only. Do not mix this into the current app.**
The 5-question flow, Reset/Confirm row, wheels and pads are untouched except for
the one trigger button.

## 2. OUT OF SCOPE (do not invent)

- No live sync, websockets, polling while the screen is open. One fetch per open +
  refresh after a successful `submitAnswer`.
- No sorting modes, search, filters, or export. None were asked for.
- No change to the Apps Script `options` action or the `opsi` tab.
- No deploy, push or commit without an explicit operator instruction.
- No normalizing of outlet/BA casing in display. Fetch is displayed as-is.
- No pixel perfection of the framed style; layout geometry is a placeholder and
  will be tuned on-device.

## 3. BACKEND (one change, operator pastes it)

The Apps Script web app gains one action. Code to paste into the existing script:

```javascript
function doGet(e) {
  const token = (e.parameter.token || '');
  if (token !== 'anti-spam-bukan-rahasia') return json({ ok: false, error: 'token' });
  const action = e.parameter.action || '';
  if (action === 'reports') {
    const sh = SpreadsheetApp.openById('<JATIM-RARA-SPREADSHEET-ID>').getSheetByName('jawaban');
    const rows = sh.getRange('D4:G' + sh.getLastRow()).getValues();
    const out = [];
    for (const r of rows) {
      if (!r[0]) continue;
      out.push({ namaBA: String(r[0]).trim(), outlet: String(r[1]).trim(),
                 tanggal: String(r[2]), nominal: Number(r[3]) || 0 });
    }
    return json({ ok: true, data: out });
  }
  return json({ ok: false, error: 'unknown action' });
}
```

- `jawaban!D3:G` - headers on D3:G3 (Nama BA | Outlet | Tanggal | Nominal), data D4+.
  Row number of the header must be confirmed against the sheet before paste.
  The BA/outlet strings in `jawaban` are exactly what the client received from
  `options` and wrote back - identical by construction, no casing/spacing drift.
- Redeploy the existing web app deployment (same URL, same token, same version),
  no new copy.
- Spreadsheet ID stays out of this doc; operator supplies it in the script editor
  or from the dashboard URL.

## 4. CLIENT FILES (new, self-contained)

```
src/check-report.svelte              base placeholder + screen state + fetch cache
src/check-report-header.svelte       placeholder: month dropdown + X close button
src/check-report-table.svelte        placeholder: BA rows (name | total), expand toggle
src/check-report-table-detail.svelte placeholder: expanded day rows (date|outlet|amount)
src/lib/reports.ts                   fetch + localStorage cache + aggregation helpers
public/{layout,content,text}.json    new nodes (section 6)
```

Naming note: files use kebab-case to match the repo (`wheel-placeholder.svelte`),
arbeitnames in this doc match the operator's description:

| component                  | job                                                    |
|----------------------------|--------------------------------------------------------|
| `check-report.svelte`      | screen shell; owns month state + open/close + data     |
| `check-report-header.svelte`    | month `<select>` + X; emits month + onClose            |
| `check-report-table.svelte`     | one row per BA (name, total for selected month); tap toggles expand; emits expand id |
| `check-report-table-detail.svelte` | 30/31 rows for the selected month: date, outlet, amount |

All four placeholders are ordinary `.svelte` components styled via the same
`box(path) + paint(path)` pattern as the rest of the app. No new global CSS.

## 5. DATA FLOW & CACHE

- `src/lib/reports.ts`
  - `loadReports(cfg): Promise<Row[]>`
    - paints from `localStorage['jawaban:v1']` first (same pattern as `opsi:v1`,
      key `jawaban:v1` = `{ t: number, rows: Row[] }`)
    - fetches `{apiUrl}?action=reports&token=...` in background; on success
      overwrites cache
    - on failure returns cached copy; throws only if no cache and fetch fails
  - `refreshReports(cfg)`: same as above, always network, updates cache.
    Called after a successful `submitAnswer`.
  - `aggregate(rows, monthKey)`: filter rows whose `tanggal` falls in the month,
    parse `M/D/YYYY` (second field = day), parse `nominal` as Number, group by
    exact `namaBA` string, return `{ ba, total, rows }[]`, sorted alphabetically
  - `daysInMonth(monthKey)`: returns `[{ date: 'YYYY-MM-DD', label: '\d MMM' }, ...]`
    for every calendar day of the selected month
  - `matchDay(rows, dayKey)`: returns the rows (0..n) for that date

- `check-report.svelte`
  - on mount: `loadReports(cfg)`; stores rows; `expandedBA = null`
  - on month change: no fetch; re-aggregate in place
  - after `submitAnswer` succeeds in `mainscreen.svelte`: call `refreshReports(cfg)`
    once (single line added to `mainscreen.svelte`, no other change)
  - X button: closes screen; `mainscreen.svelte` shows trigger button again
    (state resets on submit anyway)

## 6. JSON PLANE NODES (public/{layout,content,text}.json)

`layout.json` (all z >= 10; new top-level branch):

```
checkReport            whole screen, full bleed, z 30
checkReport.header     pinned top bar (dropdown + X), z 1
checkReport.header.month  dropdown, z 1
checkReport.header.close  X button, z 1
checkReport.table      scrollable BA row list (or full-height flex child), z 1
checkReport.detail     expanded child table for selected BA, z 1
checkReport.detail.hdr column labels row (sticky with the BA header)
```

`content.json`:

```
checkReport            { render: 'checkReport' }        (or image/dummy per house convention)
checkReport.header     { render: 'checkReportHeader' }
checkReport.header.month { render: 'select' }?          -- only if a cooked select exists, else inline
checkReport.header.close { render: 'btn' }              -- reuse Btn.svelte
checkReport.table      { render: 'checkReportTable' }
checkReport.detail     { render: 'checkReportDetail' }
```

`text.json`:

```
checkReport.header.month   month label
checkReport.header.close   X aria-label "Tutup"
checkReport.detail.cols    { date, outlet, amount }       (Indonesian: Tanggal | Outlet | Nominal)
```

Register all in PLACEHOLDERS.md with the new total.

Open question to resolve at implementation, not now: whether `select` is a new
cooked component or an inline `<select>` in `check-report-header.svelte` styled
inline; default = **inline styled `<select>`** (no new cooked component).

## 7. SCREEN BEHAVIOUR (exact)

- Trigger button "Check hasil input" under Reset and Confirm
  - visible only when no question answered (`currentQuestion === 1 && answers[0] === ''`)
  - `mainscreen.svelte` renders the screen when it is opened; screen is an
    absolutely positioned layer, `inset: 0`, z 30, `background: var(--fill)`
  - trigger hides on any answer; re-appears after `submitAnswer` succeeds
    (answers are reset there)
- Header: month dropdown (default = current month; options = current month plus
  every month present in the fetched data plus the two previous months); X closes
- Collapsed BA row: `Nama BA` | `Rp <total>`
  - tap row -> it moves to just under the header (stays pinned) and expands
  - tap again or tap another BA -> previous collapses; only one expanded at a time
- Expanded state
  - BA row with total stays sticky under header
  - child column labels sticky with it
  - one row per calendar day of the selected month (30 rows for Nov 2026)
    - days with rows: `tanggal | outlet | nominal`
    - days with no row: empty date + two blank cells, **row still shown**
  - child rows are the only scrollable region; the BA list above remains
    visible but inert while a BA is expanded
- Page never scrolls; viewport fixed
- Amount format: `Rp 10.000` (dot thousands)
- BA order: alphabetical by exact name
- Closing the screen (X or outside action) leaves the form untouched

## 8. ORDER OF WORK

1. Operator pastes the Apps Script snippet, redeploys, confirms `?action=reports&token=...`
   returns rows in a browser.
2. `src/lib/reports.ts` + unit-look-through in the dev console.
3. `public/{layout,content,text}.json` nodes; PLACEHOLDERS.md register.
4. `check-report-header.svelte`, `check-report-table-detail.svelte`,
   `check-report-table.svelte`, `check-report.svelte` (in that order).
5. Trigger button in `action-` / `mainscreen.svelte` (single visible button;
   only wiring to the current app).
6. `npm run build` + `npm run check` must be clean; no commit, push or deploy
   unless the operator asks.
7. Operator reviews on device; tweaks are edits to the JSON planes, not the code.
8. When operator says deploy: `deploy.bat "<str>"`.

## 9. RISKS / ASSUMPTIONS

- Header row index in `jawaban!D:G` is assumed `D3`; if it is different, edit the
  range in the paste, the app never sees the difference.
- `tanggal` M/D/YYYY assumption comes from the form data; verified rows from the
  screenshot match `11/4/2026`, `11/5/2026`, `11/6/2026`.
- Names with mixed case and odd spacing (`LAVITA SEPTIANINGRUM`,
  `23 Krembangan`) are displayed verbatim; do not trim/normalize in display
  beyond the `.trim()` in the snippet.
- `nominal` is stored as a plain number in `jawaban` (screenshot shows `10000`).
- The token stays the existing public anti-spam token; nothing is added.
