# Annotation Studio

An image-annotation tool for building computer-vision datasets. Draw bounding
boxes and polygons over an image, manage them with labels and colors, and export
in the formats ML pipelines actually use — **COCO**, **YOLO**, and JSON.

> Status: in active development. This is Phase 1 (single-image annotation engine).
> See [Roadmap](#roadmap) for what's next.

## Features

- **Bounding-box and polygon tools** with live drawing preview
- **Select, move, resize, and reshape** existing annotations
- **Per-annotation labels and colors**, editable inline
- **Zoom and pan** (mouse wheel buttons + hold `Space` to drag)
- **Undo / redo** with a 50-step history
- **Keyboard-driven workflow** — `S`/`B`/`P` to switch tools, `Esc` to cancel,
  `Enter` / double-click to close a polygon, `Delete` to remove
- **Export to COCO, YOLO, JSON, and a rendered PNG**
- **Local persistence** so your work survives a page reload

## Tech stack

- **Next.js 15** (App Router) + **React 18** + **TypeScript** (strict mode)
- **Fabric.js 6** for the interactive canvas
- **Zustand** for client state (with `persist` middleware)
- **TanStack Query** for the upload mutation / async state
- **Tailwind CSS** for styling
- **Server Actions** for image upload handling

## How coordinates work

Annotations are stored in the **source image's pixel coordinate space**, not in
screen/canvas coordinates. The canvas fits the image to the viewport with a
`{ scale, offsetX, offsetY }` transform, and the app converts between "scene"
(canvas) space and "image" space at the input and render boundaries.

This is what keeps exports correct: a box drawn while zoomed to 250% still
exports the right pixel coordinates, and COCO/YOLO normalization against the
image's true dimensions stays accurate. Storing display coordinates instead
would silently corrupt exports the moment the zoom level or canvas size changed.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` (strict) |

## Usage

1. **Upload an image** — drag & drop or click (JPG, PNG, WEBP; up to 10 MB).
2. **Pick a tool** — Select (`S`), Bounding Box (`B`), or Polygon (`P`).
3. **Draw** — drag for a box; click points and double-click / `Enter` to close a polygon.
4. **Edit** — select an annotation to move/resize it; double-click its label to rename.
5. **Export** — choose COCO, YOLO, JSON, or an annotated PNG.

## Export formats

- **COCO** — `images`, `annotations` (bbox + polygon `segmentation`), and `categories`.
- **YOLO** — normalized `class x_center y_center width height` lines plus `classes.txt`.
- **JSON** — the raw annotation model with image metadata.
- **PNG** — the canvas rendered at 2× for a quick visual artifact.

## Project structure

```
app/                 # App Router pages, layout, providers
components/          # Canvas, tool panel, annotation list, export panel, uploader
lib/
  store/            # Zustand store (annotations, tools, history, persistence)
  actions/          # Server Actions (image upload)
  hooks/            # use-export
  utils/            # COCO / YOLO / JSON serialization
  types.ts          # Shared domain types
public/uploads/     # Uploaded images (local dev)
```

## Roadmap

Phase 1 (this repo) is the single-image annotation engine. Planned next:

- **Backend & persistence** — Postgres + Prisma, projects/datasets/images, object storage
- **AI-assisted labeling** — click-to-segment with Segment Anything
- **Auth & multi-image projects** with a dataset browser
- **Tests & CI** — unit (export/geometry), component, and E2E coverage with GitHub Actions
- **Live deployment**

## License

MIT
