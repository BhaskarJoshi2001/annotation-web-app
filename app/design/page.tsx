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

<!-- STEP 1 -->
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

<!-- STEP 2 -->
<div class="step-label"><span class="n">2</span><h2>Product screens</h2><span class="meta">light + dark · responsive · interactive</span></div>
<div class="grid">
  <a class="card" href="/">
    <div class="preview"><div class="pv" style="background:repeating-conic-gradient(#0e1729 0% 25%, #131c30 0% 50%) 50% / 18px 18px;display:grid;place-items:center"><div style="position:relative;width:74%;height:64%;border-radius:6px;background:linear-gradient(180deg,#2b3a55,#3d4a66 45%,#23262e);box-shadow:0 10px 24px -6px rgba(0,0,0,.5)"><span style="position:absolute;left:14%;top:42%;width:30%;height:40%;border:2px solid #3b6af5;border-radius:2px;background:rgba(59,106,245,.16)"></span><span style="position:absolute;left:50%;top:34%;width:34%;height:48%;border:2px solid #10b981;border-radius:2px;background:rgba(16,185,129,.16)"></span><span style="position:absolute;left:50%;top:24%;transform:translateY(-100%);white-space:nowrap;background:#10b981;color:#fff;font-size:9px;font-weight:600;padding:1px 5px;border-radius:3px">truck 94%</span></div></div></div>
    <div class="body"><h3>Annotation Workspace <span class="badge badge-primary" style="margin-left:4px">Live</span></h3><p>The flagship: tool rail, live canvas with boxes &amp; polygons, inspector, class manager, status bar, and a ? shortcuts overlay.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="/dashboard">
    <div class="preview"><div class="pv pv-card"><div class="pv-bar" style="width:50%;background:var(--primary);opacity:1;height:14px"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px"><div style="height:44px;border-radius:6px;background:linear-gradient(135deg,#3b6af5,#8b5cf6)"></div><div style="height:44px;border-radius:6px;background:linear-gradient(135deg,#0d9488,#10b981)"></div></div><div class="pv-bar"></div><div class="pv-bar" style="width:70%"></div></div></div>
    <div class="body"><h3>Dashboard <span class="badge badge-primary" style="margin-left:4px">Live</span></h3><p>Projects grid with summary stats, search, filters, sort, per-project progress, and team presence.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="#">
    <div class="preview"><div class="pv" style="background:var(--surface-variant);padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;align-content:center"><div style="border-radius:7px;overflow:hidden;border:1px solid var(--outline);background:var(--surface)"><div style="height:34px;display:grid;grid-template-columns:repeat(4,1fr);gap:2px"><div style="background:linear-gradient(160deg,#2b3a55,#3d4a66)"></div><div style="background:linear-gradient(160deg,#3d4a66,#585c66)"></div><div style="background:linear-gradient(160deg,#585c66,#2a2d35)"></div><div style="background:linear-gradient(160deg,#2a2d35,#2b3a55)"></div></div><div style="padding:7px"><div class="pv-bar" style="width:80%;height:6px;margin:0 0 5px"></div><div class="pv-bar" style="width:50%;height:5px;margin:0"></div></div></div><div style="border-radius:7px;overflow:hidden;border:1px solid var(--outline);background:var(--surface)"><div style="height:34px;display:grid;grid-template-columns:repeat(4,1fr);gap:2px"><div style="background:linear-gradient(160deg,#3d2c2e,#774c60)"></div><div style="background:linear-gradient(160deg,#774c60,#b56576)"></div><div style="background:linear-gradient(160deg,#b56576,#2e2024)"></div><div style="background:linear-gradient(160deg,#2e2024,#3d2c2e)"></div></div><div style="padding:7px"><div class="pv-bar" style="width:70%;height:6px;margin:0 0 5px"></div><div class="pv-bar" style="width:45%;height:5px;margin:0"></div></div></div></div></div>
    <div class="body"><h3>Datasets <span class="badge badge-secondary" style="margin-left:4px">New</span></h3><p>The reusable image-collection library — sources (S3 / GCS / upload), per-dataset image counts, size, and how many projects use each.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="#">
    <div class="preview"><div class="pv" style="background:var(--surface-variant);padding:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;align-content:start"><div style="aspect-ratio:4/3;border-radius:5px;background:linear-gradient(180deg,#2b3a55,#2a2d35)"></div><div style="aspect-ratio:4/3;border-radius:5px;background:linear-gradient(180deg,#33405c,#2f3138)"></div><div style="aspect-ratio:4/3;border-radius:5px;background:linear-gradient(180deg,#243149,#272a31)"></div><div style="aspect-ratio:4/3;border-radius:5px;background:linear-gradient(180deg,#2b3a55,#2a2d35)"></div><div style="aspect-ratio:4/3;border-radius:5px;background:linear-gradient(180deg,#33405c,#2f3138)"></div><div style="aspect-ratio:4/3;border-radius:5px;background:linear-gradient(180deg,#243149,#272a31)"></div></div></div>
    <div class="body"><h3>Dataset detail <span class="badge badge-secondary" style="margin-left:4px">New</span></h3><p>One dataset's raw images, the projects that consume it, and source / storage / resolution breakdowns.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="/dataset">
    <div class="preview"><div class="pv" style="background:var(--surface-variant);padding:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;align-content:start"><div style="aspect-ratio:4/3;border-radius:5px;position:relative;background:linear-gradient(180deg,#2b3a55,#2a2d35)"><span style="position:absolute;left:20%;top:46%;width:30%;height:30%;border:1.5px solid #3b6af5;border-radius:1px"></span></div><div style="aspect-ratio:4/3;border-radius:5px;position:relative;background:linear-gradient(180deg,#33405c,#2f3138)"><span style="position:absolute;left:30%;top:40%;width:36%;height:34%;border:1.5px solid #10b981;border-radius:1px"></span></div><div style="aspect-ratio:4/3;border-radius:5px;background:linear-gradient(180deg,#243149,#272a31)"></div><div style="aspect-ratio:4/3;border-radius:5px;position:relative;background:linear-gradient(180deg,#2b3a55,#2a2d35)"><span style="position:absolute;left:16%;top:42%;width:28%;height:36%;border:1.5px solid #f59e0b;border-radius:1px"></span></div><div style="aspect-ratio:4/3;border-radius:5px;background:linear-gradient(180deg,#33405c,#2f3138)"></div><div style="aspect-ratio:4/3;border-radius:5px;position:relative;background:linear-gradient(180deg,#243149,#272a31)"><span style="position:absolute;left:34%;top:38%;width:30%;height:38%;border:1.5px solid #8b5cf6;border-radius:1px"></span></div></div></div>
    <div class="body"><h3>Project workspace <span class="badge badge-primary" style="margin-left:4px">Live</span></h3><p>A project's gallery: dataset sources, labeled / unlabeled / in-review tabs, bulk select, and progress — the bridge to the canvas.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="/auth">
    <div class="preview"><div class="pv" style="display:grid;grid-template-columns:1fr 1fr"><div style="background:linear-gradient(135deg,var(--blue-700),var(--violet-700))"></div><div style="background:var(--surface);display:grid;place-items:center;gap:6px;padding:20px"><div class="pv-bar" style="width:80%;height:12px"></div><div class="pv-bar" style="width:80%;height:24px;opacity:.3"></div><div class="pv-bar" style="width:80%;height:24px;opacity:.3"></div><div style="width:80%;height:22px;border-radius:5px;background:var(--primary)"></div></div></div></div>
    <div class="body"><h3>Auth <span class="badge badge-primary" style="margin-left:4px">Live</span></h3><p>Split-screen sign in / sign up / reset / verify, with OAuth, password strength, and validation.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="/settings">
    <div class="preview"><div class="pv pv-card" style="grid-template-columns:1fr 2fr;display:grid;gap:14px"><div style="display:grid;gap:6px;align-content:start"><div class="pv-bar" style="height:9px;background:var(--primary);opacity:1"></div><div class="pv-bar" style="height:9px"></div><div class="pv-bar" style="height:9px"></div></div><div style="display:grid;gap:8px;align-content:start"><div class="pv-bar" style="width:50%;height:11px"></div><div class="pv-bar"></div><div class="pv-bar" style="width:80%"></div></div></div></div>
    <div class="body"><h3>Settings <span class="badge badge-primary" style="margin-left:4px">Live</span></h3><p>Profile, account, appearance (theme + accent), team management, and notifications.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="/team">
    <div class="preview"><div class="pv" style="background:var(--surface);padding:16px;display:flex;flex-direction:column;gap:8px;justify-content:center"><div style="display:flex;align-items:center;gap:8px"><span class="hub-avatar" style="background:var(--blue-500)">BJ</span><div style="flex:1"><div class="pv-bar" style="width:50%;height:8px;margin-bottom:4px"></div><div class="pv-bar" style="width:70%;height:6px"></div></div><span class="badge badge-warning" style="height:18px;font-size:9px">Owner</span></div><div style="display:flex;align-items:center;gap:8px"><span class="hub-avatar" style="background:var(--violet-500)">KP</span><div style="flex:1"><div class="pv-bar" style="width:42%;height:8px;margin-bottom:4px"></div><div class="pv-bar" style="width:64%;height:6px"></div></div><span class="badge badge-primary" style="height:18px;font-size:9px">Admin</span></div><div style="display:flex;align-items:center;gap:8px"><span class="hub-avatar" style="background:var(--green-500)">JR</span><div style="flex:1"><div class="pv-bar" style="width:56%;height:8px;margin-bottom:4px"></div><div class="pv-bar" style="width:60%;height:6px"></div></div><span class="badge badge-secondary" style="height:18px;font-size:9px">Labeler</span></div></div></div>
    <div class="body"><h3>Team <span class="badge badge-primary" style="margin-left:4px">Live</span></h3><p>Member table with live role editing and status, a roles &amp; permissions guide, and the invite-member modal.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="/exports">
    <div class="preview"><div class="pv" style="background:var(--surface);padding:16px;display:flex;flex-direction:column;gap:10px;justify-content:center"><div style="display:flex;align-items:center;gap:10px;border:1px solid var(--outline);border-radius:9px;padding:9px"><div style="width:30px;height:30px;border-radius:7px;background:var(--primary-container);color:var(--on-primary-container);display:grid;place-items:center;font-family:var(--font-mono);font-size:9px;font-weight:600">COCO</div><div style="flex:1"><div class="pv-bar" style="width:58%;height:8px;margin-bottom:4px"></div><div class="pv-bar" style="width:78%;height:6px"></div></div><span class="badge badge-success" style="height:18px;font-size:9px">Ready</span></div><div style="display:flex;align-items:center;gap:10px;border:1px solid var(--outline);border-radius:9px;padding:9px"><div style="width:30px;height:30px;border-radius:7px;background:var(--primary-container);color:var(--on-primary-container);display:grid;place-items:center;font-family:var(--font-mono);font-size:9px;font-weight:600">YOLO</div><div style="flex:1"><div class="pv-bar" style="width:46%;height:8px;margin-bottom:4px"></div><div class="pv-bar" style="width:68%;height:6px"></div></div><span class="badge badge-success" style="height:18px;font-size:9px">Ready</span></div></div></div>
    <div class="body"><h3>Exports <span class="badge badge-primary" style="margin-left:4px">Live</span></h3><p>Export history — format badge, image &amp; annotation counts, size, download, row menu, and an empty state.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="/models">
    <div class="preview"><div class="pv" style="display:grid;place-items:center;background:radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--primary) 18%, var(--surface)), var(--surface))"><div style="text-align:center"><div style="width:46px;height:46px;margin:0 auto 10px;border-radius:13px;background:linear-gradient(135deg,var(--primary),var(--secondary));display:grid;place-items:center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/><circle cx="12" cy="12" r="3.4"/></svg></div><span class="badge badge-secondary" style="font-size:9px">Coming soon</span></div></div></div>
    <div class="body"><h3>Models <span class="badge badge-primary" style="margin-left:4px">Live</span></h3><p>AI-assisted labeling teaser — SAM click-to-segment, gradient hero, feature list, and notify-me CTA.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="/landing">
    <div class="preview"><div class="pv" style="background:var(--surface);display:grid;place-items:center;gap:8px;padding:20px;text-align:center"><div class="pv-bar" style="width:60%;height:18px;background:linear-gradient(120deg,var(--primary),var(--secondary));opacity:1"></div><div class="pv-bar" style="width:75%;height:8px"></div><div style="display:flex;gap:8px;margin-top:4px"><div style="width:64px;height:22px;border-radius:5px;background:var(--primary)"></div><div style="width:64px;height:22px;border-radius:5px;border:1px solid var(--outline-strong)"></div></div></div></div>
    <div class="body"><h3>Landing <span class="badge badge-primary" style="margin-left:4px">Live</span></h3><p>Marketing page — hero, product shot, feature grid, stats band, workflow, CTA, and footer.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="#">
    <div class="preview"><div class="pv" style="background:var(--surface-variant);display:grid;place-items:center;padding:18px"><div style="width:78%;background:var(--surface);border:1px solid var(--outline);border-radius:10px;box-shadow:var(--elevation-4);overflow:hidden"><div style="display:flex;align-items:center;gap:7px;padding:11px 12px 8px"><div style="width:22px;height:22px;border-radius:6px;background:var(--primary-container);display:grid;place-items:center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg></div><div class="pv-bar" style="width:46%;height:8px;margin:0"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:0 12px 10px"><div style="height:30px;border-radius:5px;border:1.5px solid var(--primary);background:var(--primary-subtle)"></div><div style="height:30px;border-radius:5px;border:1px solid var(--outline)"></div></div><div style="display:flex;justify-content:flex-end;gap:6px;padding:8px 12px;background:var(--surface-variant);border-top:1px solid var(--outline)"><div style="width:38px;height:18px;border-radius:5px;border:1px solid var(--outline-strong)"></div><div style="width:46px;height:18px;border-radius:5px;background:var(--primary)"></div></div></div></div></div>
    <div class="body"><h3>Modals &amp; Flows <span class="badge badge-secondary" style="margin-left:4px">New</span></h3><p>Export with live format previews, Share, type-to-confirm Delete, and animated Upload progress — all keyboard-accessible.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="/onboarding">
    <div class="preview"><div class="pv" style="background:var(--surface);display:grid;grid-template-columns:auto 1fr;gap:16px;padding:20px;align-items:center"><div style="display:flex;flex-direction:column;gap:0;align-items:center"><div style="width:22px;height:22px;border-radius:50%;background:var(--primary);display:grid;place-items:center"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--on-primary)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></div><div style="width:2px;height:14px;background:var(--primary)"></div><div style="width:22px;height:22px;border-radius:50%;border:2px solid var(--primary);box-shadow:0 0 0 3px var(--primary-subtle);display:grid;place-items:center;color:var(--primary);font-size:10px;font-weight:600">2</div><div style="width:2px;height:14px;background:var(--outline)"></div><div style="width:22px;height:22px;border-radius:50%;border:2px solid var(--outline-strong);color:var(--muted-foreground);display:grid;place-items:center;font-size:10px;font-weight:600">3</div></div><div style="display:grid;gap:8px;align-content:center"><div class="pv-bar" style="width:55%;height:14px;background:var(--foreground);opacity:.85"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px"><div style="height:40px;border-radius:6px;border:1.5px solid var(--primary);background:var(--primary-subtle)"></div><div style="height:40px;border-radius:6px;border:1px solid var(--outline)"></div></div></div></div></div>
    <div class="body"><h3>Onboarding <span class="badge badge-primary" style="margin-left:4px">Live</span></h3><p>Four-step create-your-first-project wizard — pick a goal, configure task &amp; classes, upload, and launch.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
  <a class="card" href="#">
    <div class="preview"><div class="pv" style="background:var(--surface);display:grid;place-items:center;padding:20px"><div style="font-family:var(--font-mono);font-size:50px;font-weight:600;letter-spacing:-0.04em;line-height:1;color:var(--foreground);display:flex;align-items:center;gap:4px">4<span style="width:42px;height:50px;border:4px solid var(--primary);border-radius:10px;display:grid;place-items:center"><span style="width:18px;height:15px;border:2px solid var(--primary);border-radius:2px"></span></span>4</div><div style="display:flex;gap:6px;margin-top:14px"><span class="badge badge-neutral" style="font-size:10px">Loading</span><span class="badge badge-warning" style="font-size:10px"><span class="dot"></span>Offline</span><span class="badge badge-destructive" style="font-size:10px">Error</span></div></div></div>
    <div class="body"><h3>System States <span class="badge badge-secondary" style="margin-left:4px">New</span></h3><p>Loading skeletons, empty states, 404, error boundary, offline, inline validation, and toasts — zero layout shift.</p><span class="go">Open<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
  </a>
</div>

<div class="note">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 12h1v4h1" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <p><b>How this maps to your repo:</b> these are high-fidelity HTML design artifacts — the visual source of truth. <b>tokens.css</b> drives <span class="mono">tailwind.config.ts</span> (mapping in DESIGN_SYSTEM.md), <b>components.css</b> patterns become your themed primitives, and each screen is the spec for its Next.js route. The Fabric canvas, Zustand store, and export logic stay — only the chrome around them is restyled.</p>
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
