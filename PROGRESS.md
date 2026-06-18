# Annotation Studio — Progress & Handoff

> **Last updated:** 2026-06-17
> Living status doc so we (or a fresh session) can resume exactly where we left off.
> Read this first, then `README.md` and `design-reference/DESIGN_SYSTEM.md`.

---

## 1. What this project is & why

**Annotation Studio** — an image-annotation platform for building computer-vision
datasets (same product category as Labelbox / Roboflow / CVAT). Users upload
images, draw **bounding boxes** and **polygons**, label them, and export to
**COCO / YOLO / JSON**.

**Goal:** turn this into a flagship portfolio project strong enough to pass a
**senior (4+ yrs) big-tech resume screen**. Bar = system design, correctness,
tests, architecture, and polish — *not* feature count.

**Stack:** Next.js 15 (App Router) · React 18 · TypeScript (strict) · Fabric.js 6
(canvas) · Zustand (state) · TanStack Query (async) · Tailwind CSS · Geist fonts.

---

## 2. Status at a glance

| Area | Status |
|---|---|
| Layer 1 — De-prototype & correctness | ✅ Done |
| Design system foundation (tokens, fonts, theme) | ✅ Done |
| Reusable component layer (`ds.css`) + `<AppSidebar>` | ✅ Done |
| Screen: `/design` (deliverables hub) | ✅ Done |
| Screen: `/` (Annotation Workspace — the hero) | ✅ Done & verified |
| Screen: `/dashboard` (Projects) | ✅ Done & verified |
| Screen: `/dataset` (Project gallery) | ✅ Done & verified |
| Screens: Auth, Landing, Settings, Onboarding | ⬜ Not started |
| Backend (Postgres + Prisma + auth + object storage) | ⬜ Not started |
| AI hero feature (Segment Anything assist) | ⬜ Not started |
| Tests + CI (Playwright installed) | ⬜ Not started |
| Live deployment | ⬜ Not started |
| **Git: everything is uncommitted** (still on `first commit`) | ⚠️ Commit soon |

---

## 3. The roadmap (original 2-week senior-level plan)

Each layer is meant to be independently shippable.

1. **Layer 1 — Correct & clean** ✅
   De-prototype, fix the coordinate-space export bug, honest README.
2. **Layer 2 — Real backend slice** ⬜
   Neon Postgres + Prisma, data model (Project → Image → Annotation → LabelClass),
   object storage (Vercel Blob / R2), auth (Clerk), multi-image projects, deploy to Vercel.
   *Blocked on: external accounts/credentials only the owner can create.*
3. **Layer 3 — Hero feature: AI-assisted labeling (SAM)** ⬜
   Click-to-segment via hosted inference (Replicate / fal.ai) → editable polygon.
4. **Layer 4 — Production quality** ⬜
   Vitest unit tests (export math, geometry, coordinate transforms), Playwright E2E,
   GitHub Actions CI. *(Playwright is already installed.)*
5. **Layer 5 — Packaging** ⬜
   README with GIFs + architecture diagram + live link, case study, résumé bullets.

> A **design-system overhaul** (the Claude Design handoff in `design-reference/`)
> became the active track and is most of section 4 below. It overlaps Layer 5 polish.

---

## 4. What's been done (detail)

### Layer 1 — Correctness & cleanup ✅
- **Fixed the load-bearing bug:** annotations are now stored in **image-pixel space**
  (not canvas-display space), so COCO/YOLO/JSON exports are correct at any zoom.
  See `sceneToImage`/`imageToScene` in `components/annotation-canvas-fabric.tsx`.
- Removed debug cruft (console.logs, red canvas border, commented panels).
- Deleted dead files (2 unused canvas variants, polygon-instructions).
- Removed unused deps: `konva`, `react-konva`, `@types/fabric` (later also `@tanstack/react-query-devtools`).
- Migrated deprecated Fabric v6 APIs (`getScenePoint`, `Point.transform`, `FabricImage`, etc.).
- Zustand persist `version: 1` + `migrate` (drops old display-coord annotations).
- Rewrote `README.md`; removed prototype scratch `.md` files.
- Canvas background made **transparent** so the themed checkerboard shows in light & dark.

### Design system foundation ✅
- **Tokens** ported into `app/globals.css` (Material-3 primitive + semantic, light/dark).
  Dark selector is `[data-theme="dark"], .dark` so tokens and Tailwind `dark:` stay in sync.
- **Tailwind** (`tailwind.config.ts`) extended additively: Geist `fontFamily`, semantic
  token colors (primary/surface/secondary/success/warning/destructive/outline/muted),
  elevation `boxShadow`, easing. (Old `primary` numeric scale kept so nothing breaks.)
- **Fonts**: Geist + Geist Mono via `next/font/google` in `app/layout.tsx` + anti-FOUC script.
- **Theme**: `components/theme-provider.tsx` (light/dark/system, localStorage key `as-theme`,
  one-frame transition-suppression fix) + `components/theme-switch.tsx`. Wired in `app/providers.tsx`.

### Reusable component layer ✅
- **`app/ds.css`** — the design's `components.css` ported, every selector scoped under `.ds`
  (buttons, inputs, badges, chips, avatars, progress, tabs, menus, **dialog/scrim**, tooltip,
  skeleton, empty state, kbd). Opt in with `className="ds ..."` on a screen root.
- **`components/app-sidebar.tsx` + `app/app-shell.css`** — shared left nav (`.ds .app-sidebar`)
  used by Dashboard, Dataset, and future Settings. Props: `active`, `showUsage`.

### Screens built & verified ✅
- **`/design`** — design deliverables hub (wordmark, hero, working theme toggle, card grid).
- **`/` — Annotation Workspace (hero):** redesigned chrome around the **existing Fabric canvas**
  (canvas/store/export logic untouched). Pieces in `components/workspace/`: `top-bar`,
  `tool-rail`, `inspector` (Annotations/Properties/Classes), `status-bar`, `shortcuts-overlay`,
  `export-dialog` (wired to `useExport`). No-image state = the existing `ImageUploader`.
- **`/dashboard`** — projects grid: stats with sparklines, search, status filters, sort,
  grid/list toggle, project cards. Uses `<AppSidebar active="projects" showUsage />`.
- **`/dataset`** — project gallery: breadcrumb, meta row, filter tabs, drag-drop upload zone,
  image cards (gradient thumbs + mini boxes + state badges), search, multi-select + bulk bar.

### Verification tooling
- **Playwright** installed (dev deps `playwright` + `@playwright/test`); drives the **system
  Chrome** via `chromium.launch({ channel: 'chrome' })` (no chromium download).
- All built screens were screenshotted in **light + dark** and visually confirmed.
- `npm run type-check`, `lint`, and `build` are **green**.

---

## 5. Routes & user flow

```
/design     → deliverables hub (links to the live screens)
/dashboard  → Projects grid ──click project──▶ /dataset
/dataset    → image gallery  ──click image / "Start labeling"──▶ /
/           → Annotation Workspace (upload → draw → label → export)
```

The breadcrumbs/nav link back up the chain (Workspace "Projects" → /dashboard, etc.).

---

## 6. Key files map

```
app/
  layout.tsx            Geist fonts, anti-FOUC theme script, metadata
  providers.tsx         ThemeProvider + QueryClient
  globals.css           DESIGN TOKENS (light/dark) + base + tool helper classes
  ds.css                Scoped design-system primitives (.ds …)
  app-shell.css         Shared sidebar styles (.ds .app-sidebar …)
  page.tsx              ANNOTATION WORKSPACE (route /)
  workspace.css         Workspace layout (.ws …)
  dashboard/page.tsx + dashboard.css     Projects dashboard (/dashboard, .dash)
  dataset/page.tsx   + dataset.css       Project gallery (/dataset, .dataset)
  design/page.tsx    + design-hub.css    Deliverables hub (/design, .design-hub)

components/
  annotation-canvas-fabric.tsx   Fabric canvas (CORE — image-space coords). Don't rewrite logic.
  image-uploader.tsx             Drag-drop upload (no-image state)
  theme-provider.tsx, theme-switch.tsx
  app-sidebar.tsx                Shared left nav
  workspace/                     top-bar, tool-rail, inspector, status-bar,
                                 shortcuts-overlay, export-dialog

lib/
  store/annotation-store.ts      Zustand store (annotations, tools, history, persist)
  types.ts                       Domain types (BoundingBox | Polygon, exports, etc.)
  actions/image-actions.ts       Server Action: image upload (writes public/uploads — see issues)
  hooks/use-export.ts            Export mutation (json/coco/yolo)
  utils/export-utils.ts          COCO / YOLO / JSON serialization

design-reference/                The Claude Design handoff: DESIGN_SYSTEM.md, tokens.css,
                                 components.css, theme.js, and HTML mockups for EVERY screen
                                 (Landing, Auth, Onboarding, Settings, Modals & Flows,
                                 System States, Components, Design System). Source of truth
                                 for the screens not yet built.

css.d.ts                         Ambient `declare module '*.css'` (silences editor TS2882)
PROGRESS.md                      ← this file
```

---

## 7. How to build a new screen (the established pattern)

1. Open the matching mockup in `design-reference/<Screen>.html` — read it top to bottom.
2. Reuse primitives from `ds.css` (`.btn`, `.badge`, `.input`, `.card`, `.scrim`/`.dialog`, …)
   and `<AppSidebar>` for app-shell screens.
3. Create `app/<route>/page.tsx` (client if interactive) + a scoped `<route>.css`
   (prefix every selector with a unique root class, e.g. `.dataset`, like the existing screens).
   Root element gets `className="ds <route-class>"`.
4. Wire any interactivity to real state where it exists; mock data is fine for now.
5. `npm run type-check && npm run lint && npm run build`, then **screenshot it** (see §8).
6. Link the new route from `/design`'s card grid and any relevant nav/breadcrumbs.

---

## 8. Run & verify

```bash
npm run dev          # dev server (port 3000/3001/3002 — check the log)
npm run build        # production build (also type-checks)
npm run type-check   # tsc --noEmit (strict)
npm run lint
```

**Visual verification with Playwright + system Chrome** (the approach we've been using):
write a small `.mjs` script *inside the project dir* (so it resolves `playwright`) that does
`chromium.launch({ channel: 'chrome' })`, sets `localStorage` `as-theme` (and, to render the
workspace with content, seeds `annotation-storage` with an image from `public/uploads` + sample
annotations), navigates to the route, and `page.screenshot(...)` in light & dark. Delete the
script after. (This tooling is also the basis for the Layer 4 Playwright E2E tests.)

---

## 9. Known issues / TODO

- ⚠️ **Everything is uncommitted** — still on the single `first commit`. Commit this milestone.
- The no-image **`ImageUploader` still uses the old indigo `primary-*` scale** (off-brand vs the new blue).
- `lib/actions/image-actions.ts` writes to `public/uploads` — **breaks on Vercel/serverless**
  (ephemeral disk). Needs object storage in Layer 2.
- **No tests yet.** Highest-value targets: export math, geometry, the scene↔image transform.
- Rail tools beyond Select/Bbox/Polygon (point/pan/zoom) and "Auto-label (AI)" are **future/disabled**.
- The Classes inspector tab is **derived from labels** (no real class data model yet).
- `npm audit` reports pre-existing vulnerabilities (not introduced by our work) — address in Layer 4/5.

---

## 10. Next steps (pick up here)

**Immediate (design track):** build the remaining screens from `design-reference/` —
**Auth** (split-screen sign in/up/reset — strong portfolio shot), **Landing** (marketing
front door), **Settings**, **Onboarding**. Reuse `.ds` + `<AppSidebar>`.

**Then (product depth):** Layer 2 backend (DB + auth + storage + deploy) → Layer 3 SAM hero →
Layer 4 tests + CI → Layer 5 packaging.

**Housekeeping:** commit the current milestone on a branch; align the uploader to the blue brand.
