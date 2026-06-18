import type { Metadata } from 'next';
import { ThemeSwitch } from '@/components/theme-switch';
import './design-hub.css';

export const metadata: Metadata = {
  title: 'Design deliverables · Annotation Studio',
  description:
    'The Annotation Studio design system and product screens — tokens, components, and every screen in light and dark.',
};

const HUB_CONTENT = `
<div class="hero">
  <div class="eyebrow">Flagship design package</div>
  <h1>A complete design system &amp; product, end to end.</h1>
  <p>From color tokens to the annotation workspace — every screen is built from one token contract, works in light and dark, and is keyboard-accessible. Start with the system, then explore the live screens.</p>
</div>

<div class="step-label"><span class="n">1</span><h2>Foundations &amp; documentation</h2><span class="meta">tokens.css · DESIGN_SYSTEM.md</span></div>
<div class="grid">
  <a class="card" href="#">
    <div class="preview"><div class="pv pv-tokens"><div class="ramp"><span style="background:#dbe7fe"></span><span style="background:#93b4fd"></span><span style="background:#3b6af5"></span><span style="background:#2563eb"></span><span style="background:#1d4ed8"></span><span style="background:#1e3a8a"></span></div></div></div>
    <div class="body"><h3>Design System</h3><p>Living style guide: color ramps, semantic tokens in both themes, type scale, spacing, radius, elevation, and motion.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="#">
    <div class="preview"><div class="pv pv-comp"><span class="btn btn-primary btn-sm">Primary</span><span class="btn btn-outline btn-sm">Outline</span><span class="badge badge-success"><span class="dot"></span>Labeled</span><span class="badge badge-warning"><span class="dot"></span>Review</span><span class="chip selected">All</span></div></div>
    <div class="body"><h3>Components</h3><p>28 interactive primitives — buttons, inputs, toggles, tabs, dialogs, menus, toasts, skeletons, empty states, and ⌘K.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
</div>

<div class="step-label"><span class="n">2</span><h2>Product screens</h2><span class="meta">light + dark · responsive · interactive</span></div>
<div class="grid">
  <a class="card" href="/">
    <div class="preview"><div class="pv" style="background:repeating-conic-gradient(#0e1729 0% 25%, #131c30 0% 50%) 50% / 18px 18px;display:grid;place-items:center"><div style="position:relative;width:74%;height:64%;border-radius:6px;background:linear-gradient(180deg,#2b3a55,#3d4a66 45%,#23262e);box-shadow:0 10px 24px -6px rgba(0,0,0,.5)"><span style="position:absolute;left:14%;top:42%;width:30%;height:40%;border:2px solid #3b6af5;border-radius:2px;background:rgba(59,106,245,.16)"></span><span style="position:absolute;left:50%;top:34%;width:34%;height:48%;border:2px solid #10b981;border-radius:2px;background:rgba(16,185,129,.16)"></span><span style="position:absolute;left:50%;top:24%;transform:translateY(-100%);white-space:nowrap;background:#10b981;color:#fff;font-size:9px;font-weight:600;padding:1px 5px;border-radius:3px">truck 94%</span></div></div></div>
    <div class="body"><h3>Annotation Workspace <span class="badge badge-primary" style="margin-left:4px">Live</span></h3><p>The flagship: tool rail, live canvas with boxes &amp; polygons, inspector, class manager, status bar. Opens the working tool.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="/dashboard">
    <div class="preview"><div class="pv pv-card"><div class="pv-bar" style="width:50%;background:var(--primary);opacity:1;height:14px"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px"><div style="height:44px;border-radius:6px;background:linear-gradient(135deg,#3b6af5,#8b5cf6)"></div><div style="height:44px;border-radius:6px;background:linear-gradient(135deg,#0d9488,#10b981)"></div></div><div class="pv-bar"></div><div class="pv-bar" style="width:70%"></div></div></div>
    <div class="body"><h3>Dashboard</h3><p>Projects grid with summary stats, search, filters, sort, per-project progress, and team presence.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="/dataset">
    <div class="preview"><div class="pv" style="background:var(--surface-variant);padding:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;align-content:start"><div style="aspect-ratio:4/3;border-radius:5px;background:linear-gradient(180deg,#2b3a55,#2a2d35)"></div><div style="aspect-ratio:4/3;border-radius:5px;background:linear-gradient(180deg,#33405c,#2f3138)"></div><div style="aspect-ratio:4/3;border-radius:5px;background:linear-gradient(180deg,#243149,#272a31)"></div><div style="aspect-ratio:4/3;border-radius:5px;background:linear-gradient(180deg,#2b3a55,#2a2d35)"></div><div style="aspect-ratio:4/3;border-radius:5px;background:linear-gradient(180deg,#33405c,#2f3138)"></div><div style="aspect-ratio:4/3;border-radius:5px;background:linear-gradient(180deg,#243149,#272a31)"></div></div></div>
    <div class="body"><h3>Dataset view</h3><p>Image gallery with mini box previews, upload zone, labeled / unlabeled filters, and bulk selection.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="#">
    <div class="preview"><div class="pv" style="display:grid;grid-template-columns:1fr 1fr"><div style="background:linear-gradient(135deg,var(--blue-700),var(--violet-700))"></div><div style="background:var(--surface);display:grid;place-items:center;gap:6px;padding:20px"><div class="pv-bar" style="width:80%;height:12px"></div><div class="pv-bar" style="width:80%;height:24px;opacity:.3"></div><div class="pv-bar" style="width:80%;height:24px;opacity:.3"></div><div style="width:80%;height:22px;border-radius:5px;background:var(--primary)"></div></div></div></div>
    <div class="body"><h3>Auth</h3><p>Split-screen sign in / sign up / reset / verify, with OAuth, password strength, and validation.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="#">
    <div class="preview"><div class="pv pv-card" style="grid-template-columns:1fr 2fr;display:grid;gap:14px"><div style="display:grid;gap:6px;align-content:start"><div class="pv-bar" style="height:9px;background:var(--primary);opacity:1"></div><div class="pv-bar" style="height:9px"></div><div class="pv-bar" style="height:9px"></div></div><div style="display:grid;gap:8px;align-content:start"><div class="pv-bar" style="width:50%;height:11px"></div><div class="pv-bar"></div><div class="pv-bar" style="width:80%"></div></div></div></div>
    <div class="body"><h3>Settings</h3><p>Profile, account, appearance (theme + accent), team management, and notifications.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="#">
    <div class="preview"><div class="pv" style="background:var(--surface);display:grid;place-items:center;gap:8px;padding:20px;text-align:center"><div class="pv-bar" style="width:60%;height:18px;background:linear-gradient(120deg,var(--primary),var(--secondary));opacity:1"></div><div class="pv-bar" style="width:75%;height:8px"></div><div style="display:flex;gap:8px;margin-top:4px"><div style="width:64px;height:22px;border-radius:5px;background:var(--primary)"></div><div style="width:64px;height:22px;border-radius:5px;border:1px solid var(--outline-strong)"></div></div></div></div>
    <div class="body"><h3>Landing</h3><p>Marketing page — hero, product shot, feature grid, stats band, workflow, CTA, and footer.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
</div>

<div class="note">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 12h1v4h1" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <p><b>How this maps to the repo:</b> the design tokens now drive <span class="mono">globals.css</span> + <span class="mono">tailwind.config.ts</span>, Geist + Geist Mono are loaded via next/font, and theme switching is wired through a React provider. The annotation tool's canvas, store, and export logic are untouched — only the chrome around them gets the new system. Cards link to screens as they get built; the Annotation Workspace opens the working tool.</p>
</div>

<footer>Annotation Studio · Design system v1.0 · Geist + Geist Mono · Light &amp; dark · WCAG AA</footer>
`;

export default function DesignHubPage() {
  return (
    <div className="design-hub">
      <div className="top">
        <div className="logo">
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="34" height="34" rx="9" fill="var(--primary)" />
            <rect
              x="8.5"
              y="8.5"
              width="19"
              height="19"
              rx="3.5"
              stroke="var(--on-primary)"
              strokeWidth="2"
              strokeDasharray="0.5 4.4"
              strokeLinecap="round"
            />
            <rect x="6" y="6" width="5" height="5" rx="1.5" fill="var(--on-primary)" />
            <rect x="25" y="6" width="5" height="5" rx="1.5" fill="var(--on-primary)" />
            <rect x="6" y="25" width="5" height="5" rx="1.5" fill="var(--on-primary)" />
            <rect x="25" y="25" width="5" height="5" rx="1.5" fill="var(--on-primary)" />
          </svg>
          <div>
            <b>Annotation Studio</b>
            <span>Design deliverables · v1.0</span>
          </div>
        </div>
        <div className="toolbar">
          <ThemeSwitch />
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: HUB_CONTENT }} />
    </div>
  );
}
