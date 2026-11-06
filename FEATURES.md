# FEATURES.md - planned work

Feature notes. Not plans to implement - the details and the go-ahead belong to
the operator.

---

## Check hasil input - planned 2026-11-07

New standalone screen for "Check hasil input".

Hard rule from the operator:

- **New files entirely. Do not mix with the current working app.**
- **Do not touch the existing main app's behaviour** (Reset/Confirm row, 5-question
  flow, etc.) by wiring this screen into it inline beyond the trigger button.
- **Screen is its own layer/module**, not a popup or patch inside `mainscreen.svelte`.
  The 5-answer flow can stay exactly as it is; this screen is opened on demand
  and closed on X.

### Trigger button (the only contact point with the current app)

New button: **"Check hasil input"**

- placed below Reset and Confirm in the Reset/Confirm placeholder
- visible only when no question has been answered yet
- once Q1 is answered it is hidden and stays hidden until the report is sent
  (this is the only known visibility rule; details not defined)

### Screen: standalone module, not part of current app markup

New screen lives in **new files**, separate from the current `mainscreen.svelte`
markup. The only contact with the existing app is the trigger button. Data,
layout, components, state for the screen are self-contained.

Screen layout (top to bottom):

- **Header**, pinned at top, never scrolls
  - month dropdown; default current month
  - X closes the screen
- **Body** fits its own height; page does not overflow viewport
  - collapsed: one row per BA, column 1 BA name, column 2 total amount (selected month)
  - tap a BA -> move it to just under the header, expand its child rows,
    BA name + total stay visible
  - child table columns: **date | outlet | amount**
  - one row per calendar day of the selected month; empty dates kept as empty rows
  - expanded group's child rows are the only scrollable area
  - child column labels stay visible with the sticky BA header

Not yet defined:

- "Check hasil input" label casing, exact copy, styling, which sub-box of
  `action` vs `actionPreview` it sits under
- Whether it shows again after reset/new form, and after a sent report
- Geometry in `layout.json`, wiring in `content.json`, behaviour in component
- Data source details: exact backend action, response shape, which sheet/range,
  aggregation rule, currency formatting, timezone
- Whether multiple BA rows can be expanded at once, and expand/collapse toggle
- Screen entry/exit animation, back behaviour, and where the screen sits in
  `layout.json` / `content.json`
- Exact styling, typography, column labels (Indonesian?), empty-cell rendering
- Interaction with the "hidden until Q1 answered / until report sent" rule -
  entry point is the Reset/Confirm row, but the screen itself is full-screen
