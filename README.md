# Annotation Studio

A production-grade image annotation platform for building computer-vision
datasets. Draw bounding boxes and polygons — or click an object and let
**SAM (Segment Anything)** trace it for you — then export in the formats ML
pipelines actually use: **COCO**, **YOLO**, **JSON**, and **CSV**.

## Features

- **Annotation workspace** — Fabric.js canvas with bounding boxes, polygons,
  zoom/pan, undo/redo, per-class hotkeys, debounced auto-save
- **AI select (SAM)** — click any object; a fal.ai-hosted SAM 2 model
  segments it and the mask becomes an editable polygon (Moore-neighbor
  boundary tracing + Ramer-Douglas-Peucker simplification, server-side)
- **Dataset management** — drag-and-drop uploads straight from the browser
  to Cloudflare R2 via presigned URLs, gallery with status filters, bulk ops
- **Label classes** — defined per project with colors and hotkeys, managed
  inline from the workspace
- **Exports** — COCO / YOLO / JSON / CSV, streamed on demand, with history
- **Auth & tenancy** — Clerk authentication; every API route is
  ownership-checked; per-user storage quotas and daily AI-call caps

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Route Handlers) |
| Auth | Clerk |
| Database | Neon Postgres + Drizzle ORM |
| Storage | Cloudflare R2 (S3-compatible, presigned direct uploads) |
| AI inference | fal.ai (`fal-ai/sam2/image`) |
| Validation | Zod on every mutation input |
| Canvas | Fabric.js 6 |
| State | Zustand (canvas) + TanStack Query (server state) |

## Architecture notes

- **Uploads never touch the server.** The browser asks for a presigned PUT
  URL, uploads directly to R2, then confirms; the server verifies the object
  with `HeadObject` before creating the DB record. This sidesteps serverless
  body-size limits and double bandwidth.
- **Images are served by presigned GET URLs** minted at list time — zero
  function invocations per image view.
- **Annotation saves are atomic** — delete + insert + status update ship as
  one `db.batch()`, which Neon executes in a single implicit transaction.
- **Coordinates are stored in image-pixel space**, not canvas space — the
  canvas converts through a `{ scale, offsetX, offsetY }` transform at the
  input and render boundaries, so exports stay correct at any zoom.
- **Every quota has one chokepoint**: storage limits are enforced at
  presign, AI-call caps at the segment route, both fail-closed.

## Getting started

```bash
git clone <repo>
cd annotation-web-app
npm install
cp .env.example .env.local   # fill in Clerk, Neon, R2, fal.ai credentials
npm run db:push              # create tables in Neon
npm run dev
```

You'll also need a CORS policy on the R2 bucket (GET + PUT from your app
origin) — see [DEPLOYMENT.md](./DEPLOYMENT.md) for the exact JSON and the
full production checklist.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run type-check` | TypeScript, no emit |
| `npm run db:push` | Sync Drizzle schema to Neon |
| `npm run db:studio` | Browse the DB |
