# Annotation Studio — Design System

> Material-3-inspired, premium-SaaS. A single refined-blue seed expanded into a tonal system, two first-class themes (light + dark), WCAG AA throughout. **Every screen is assembled from the tokens below — no hardcoded hex, no magic spacing.**

The canonical, runnable reference is **`Design System.html`** (the living style guide). All tokens live in **`tokens.css`** as CSS custom properties and are intended to drive `tailwind.config.ts` (see "Tailwind mapping" at the end).

---

## 1. Principles

1. **Tokens, not hex.** Components reference *semantic* variables (`--surface`, `--primary`, `--outline`), never raw tones. One source of truth → two themes with zero drift.
2. **Tactile & calm.** Real elevation + 150–250ms motion give feedback without noise. No gratuitous bounce; spring is reserved for playful affordances.
3. **Data-dense, breathable.** Built to render thousands of annotations, yet generous whitespace keeps everything legible.
4. **Accessible by default.** AA contrast in both themes, a visible 2px focus ring on every interactive element, complete keyboard paths, `prefers-reduced-motion` honored.

---

## 2. Color

### 2.1 Tonal scales (primitive — never used directly in screens)
| Scale | Steps | Role |
|---|---|---|
| **Blue** (brand) | `--blue-50` → `--blue-950` (11) | Primary actions, focus, selection |
| **Neutral** (slate) | `--neutral-0` → `--neutral-950` (13) | Surfaces, text, borders |
| **Violet** | 100 / 500 / 700 | Secondary accent |
| **Green** | 100 / 500 / 700 | Success |
| **Amber** | 100 / 500 / 700 | Warning |
| **Red** | 100 / 500 / 700 | Destructive |

Seed (`--blue-600` `#2563eb`) is the brand anchor. The neutral ramp carries a faint blue undertone so light surfaces feel tonal (Material) rather than clinically gray.

### 2.2 Semantic tokens (USE THESE)
| Token | Light | Dark | Role |
|---|---|---|---|
| `--background` | `#f7f9fc` | `#0a1120` | App canvas |
| `--surface` | `#ffffff` | `#0f172a` | Cards, sheets, menus |
| `--surface-variant` | `#eef2f8` | `#172033` | Inset wells, hover fills |
| `--surface-container-high` | `#e8edf5` | `#1b2438` | Stacked/raised containers |
| `--foreground` | `#0f172a` | `#e8edf6` | Primary text |
| `--muted-foreground` | `#64748b` | `#93a1b8` | Secondary text |
| `--subtle-foreground` | `#94a3b8` | `#64748b` | Tertiary / placeholder |
| `--outline` | `#e2e8f2` | `#25324a` | Default borders / dividers |
| `--outline-strong` | `#cbd5e3` | `#38465f` | Input borders, emphasis |
| `--primary` | `#2563eb` | `#5b8def` | Brand action |
| `--on-primary` | `#ffffff` | `#06122b` | Text/icon on primary |
| `--primary-container` | `#dbe7fe` | `#1c356f` | Tonal brand fill (chips, selected) |
| `--on-primary-container` | `#1e3a8a` | `#cfe0ff` | Text on primary-container |
| `--secondary` | `#7c3aed` | `#a78bfa` | Secondary accent |
| `--success` / `--warning` / `--destructive` | see file | see file | Functional states (+ `*-container`, `on-*`) |
| `--ring` | `#2563eb` | `#5b8def` | Focus outline color |

**Rules**
- Body text on `--surface`/`--background` must use `--foreground` or `--muted-foreground` (both AA+).
- Never put `--muted-foreground` text on `--primary` — use `--on-primary`.
- Status colors always pair the solid (`--success`) with its container (`--success-container`) + `--on-*-container` for tinted badges.
- Dark mode is **designed, not inverted**: primary lightens to stay AA on dark surfaces; containers are desaturated, not the same hex.

---

## 3. Typography

**Geist** (UI) + **Geist Mono** (every technical value: coordinates, dimensions, class IDs, JSON, counts).

| Role | Class | Size / LH | Weight | Tracking | Use |
|---|---|---|---|---|---|
| Display | `.t-display` | 48 / 56 | 600 | -0.02em | Marketing hero, big numbers |
| Headline | `.t-headline` | 32 / 40 | 600 | -0.018em | Page titles |
| Title large | `.t-title-lg` | 22 / 28 | 600 | -0.012em | Section headers |
| Title | `.t-title` | 18 / 26 | 600 | -0.008em | Card/panel titles |
| Body large | `.t-body-lg` | 16 / 26 | 400 | 0 | Lead paragraphs |
| Body | `.t-body` | 14 / 22 | 400 | 0 | Default UI text |
| Label | `.t-label` | 13 / 18 | 500 | — | Buttons, inputs, list rows |
| Caption | `.t-caption` | 12 / 16 | 500 | — | Metadata, helper text |
| Overline | `.t-overline` | 11 / 16 | 600 | 0.08em, UPPERCASE | Eyebrows, section kickers |

Mono via `.mono`. **Do:** use mono for `x:128 y:64 w:512 h:288`. **Don't:** set body copy in mono or go below 12px anywhere.

---

## 4. Spacing — 4px base
`--space-1`…`--space-24` = 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 px.
- Dense controls (button padding, input gaps): steps 1–3.
- Component internals: 3–5. Layout rhythm between sections: 6–12. Page gutters: 10–16.
- **Don't** invent `15px`/`7px`; round to the nearest step.

## 5. Radius
`xs 4 · sm 6 · md 8 · lg 12 · xl 16 · 2xl 20 · 3xl 28 · full`.
Controls → `sm`–`md`. Cards/panels → `lg`–`xl`. Modals → `xl`–`2xl`. Pills, avatars, switches → `full`.

## 6. Elevation (Material 0–5)
`--elevation-0`…`--elevation-5`. Layered soft shadows in light; in dark, shadows deepen **and** surfaces lighten tonally so depth survives.
- 0 flush · 1 resting card · 2 hovered card / sticky bar · 3 dropdown / popover · 4 dialog / drawer · 5 command palette / spotlight.
- **Don't** stack a heavy shadow on an element that already sits on a raised container — depth is cumulative.

## 7. Motion
Durations: `instant 80 · fast 150 · base 200 · slow 300 · slower 450` ms.
Easing: `--ease-standard` (most UI), `--ease-emphasized` (entrances), `--ease-decelerate` (incoming), `--ease-accelerate` (outgoing), `--ease-spring` (playful only).
- Hover/press/focus: `fast` + standard. Modals/drawers: `base`–`slow` + emphasized. Toasts: `base` + spring-in.
- Always gate decorative animation behind `@media (prefers-reduced-motion: no-preference)`; entrance states must resolve to the visible end-state for print/PDF/reduced-motion.

## 8. Z-index
`base 0 · raised 10 · sticky 100 · overlay 1000 · drawer 1100 · modal 1200 · popover 1300 · toast 1400 · tooltip 1500`.

---

## 9. Tailwind mapping (intended)
In `tailwind.config.ts`, map semantic tokens through `hsl/var` so utilities stay token-driven:

```ts
// theme.extend.colors
background: "var(--background)",
surface: { DEFAULT: "var(--surface)", variant: "var(--surface-variant)" },
foreground: "var(--foreground)",
muted: { foreground: "var(--muted-foreground)" },
border: "var(--outline)",
primary: { DEFAULT: "var(--primary)", foreground: "var(--on-primary)", container: "var(--primary-container)" },
destructive: { DEFAULT: "var(--destructive)", foreground: "var(--on-destructive)" },
// …success / warning / secondary identically
// borderRadius, boxShadow, fontFamily, transitionTimingFunction → the matching --* vars
```

Then shadcn/ui components inherit the system automatically. `globals.css` should `@import "tokens.css"` (or inline its contents) ahead of Tailwind's base layer.

---

*v1.0 — Foundations. Component primitives (Step 2) and screen specs (Step 3) build exclusively on this contract.*
