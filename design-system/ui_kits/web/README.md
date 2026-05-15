# Lizy Web — UI Kit

A pixel-recreation of the Lizy web app, built from the three product screenshots. The kit reproduces the **dashboard / 새 에셋 요청** working surface, the **스타일 샷 revision modal**, and the **에셋 생성 완료** review surface as one interactive click-through.

## Files

| File | Component | Notes |
|---|---|---|
| `index.html` | Mount + Babel + entry | Open this. |
| `app.jsx` | `<App>` — state, screen routing | Tabs: Dashboard / Generate / Review |
| `Header.jsx` | Top nav with wordmark + sections | |
| `Sidebar.jsx` | Workspace sidebar (Review screen only) | |
| `Dashboard.jsx` | Two-column "새 에셋 요청" surface | Left: input panel · Right: live brand-guide |
| `BrandGuide.jsx` | Right-rail brand-guide panel | Master logo, palette, type, mood |
| `ReviewBoard.jsx` | Three-up asset review (packaging / styled / video) | |
| `RevisionModal.jsx` | "스타일 샷 #2" revision modal | |
| `controls.jsx` | Buttons, pills, inputs, dropzone, status | Shared atoms |
| `icons.jsx` | Inline Lucide-equivalent SVG icons | One source of truth |

## Interactive flow

1. Land on **Dashboard** (`새 에셋 요청`). Fill brand message → click **에셋 생성하기**.
2. Routes to **Generate** (loading-style state, ~1.5s) → routes to **Review**.
3. On Review, click **수정 요청** on any asset card to open **RevisionModal**.
4. Submit modal → returns to Review with that asset's status updated.
5. Click **승인** to mark asset approved (mint check overlay).

State is in-memory only — refresh resets the demo.

## What this kit covers

✓ Top navigation, brand wordmark, header icons, avatar
✓ All button variants (primary mint, secondary outlined, tertiary text)
✓ Pill chips (filled, outlined-selected, unselected)
✓ Text inputs, dropdown, textarea, dropzone
✓ Status pills with mint dot
✓ Asset cards with thumbnail grid + actions
✓ Modal with backdrop scrim, side-by-side compare panes
✓ FAB
✓ Sidebar nav with active rail

## What this kit does **not** cover

✗ Real upload (dropzone is decorative)
✗ Real generation (timer is fake)
✗ Settings / notifications panes (top-right icons are hit-targets only)
✗ History / 히스토리 surface — never shown in source
✗ 워크플로우 surface — never shown in source

These were never visible in the source screenshots, so they're left out rather than invented. See `README.md` Caveats.
