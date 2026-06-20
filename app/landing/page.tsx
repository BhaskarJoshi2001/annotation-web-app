'use client';

import Link from 'next/link';
import { useTheme } from '@/components/theme-provider';
import '../ds.css';
import './landing.css';

function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect x="1" y="1" width="34" height="34" rx="9" fill="var(--primary)"/>
      <rect x="8.5" y="8.5" width="19" height="19" rx="3.5" stroke="var(--on-primary)" strokeWidth="2" strokeDasharray="0.5 4.4" strokeLinecap="round"/>
      <rect x="6" y="6" width="5" height="5" rx="1.5" fill="var(--on-primary)"/>
      <rect x="25" y="6" width="5" height="5" rx="1.5" fill="var(--on-primary)"/>
      <rect x="6" y="25" width="5" height="5" rx="1.5" fill="var(--on-primary)"/>
      <rect x="25" y="25" width="5" height="5" rx="1.5" fill="var(--on-primary)"/>
    </svg>
  );
}

type ABox = { bc: string; left: string; top: string; width: string; height: string; label: string };

const BOXES: ABox[] = [
  { bc: '#3b6af5', left: '12%', top: '46%', width: '24%', height: '34%', label: 'car 98%' },
  { bc: '#10b981', left: '46%', top: '40%', width: '30%', height: '42%', label: 'truck 94%' },
  { bc: '#8b5cf6', left: '80%', top: '50%', width: '10%', height: '30%', label: 'person' },
];

export default function LandingPage() {
  const { resolved, setMode } = useTheme();
  const isDark = resolved === 'dark';

  return (
    <div className="ds lp">
      {/* NAV */}
      <nav className="top-nav">
        <div className="wrap inner">
          <Link href="/landing" className="logo">
            <LogoMark />
            Annotation Studio
          </Link>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#">Pricing</a>
            <a href="#">Docs</a>
          </div>
          <div className="nav-grow" />
          <div className="nav-actions">
            <button className="icon-btn" aria-label="Toggle theme" onClick={() => setMode(isDark ? 'light' : 'dark')}>
              {isDark
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
              }
            </button>
            <Link href="/auth" className="btn btn-ghost">Sign in</Link>
            <Link href="/auth" className="btn btn-primary">Start free</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="hero-glow" />
        <div className="grid-bg" />
        <div className="wrap">
          <span className="hero-pill"><span className="tag">New</span> Model-assisted labeling is here</span>
          <h1>Label data your model can <span className="accent">actually trust.</span></h1>
          <p className="hero-lede">
            The annotation platform for computer-vision teams. Draw bounding boxes, polygons, and keypoints,
            review at scale, and export to COCO &amp; YOLO — without the spreadsheet chaos.
          </p>
          <div className="hero-cta">
            <Link href="/auth" className="btn btn-primary btn-xl">
              Start free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Link href="/" className="btn btn-outline btn-xl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 5v14l11-7z" strokeLinejoin="round"/></svg>
              See it live
            </Link>
          </div>
          <div className="hero-trust">No credit card required · 14-day Pro trial · SOC 2 Type II</div>

          {/* PRODUCT SHOT */}
          <div className="shot">
            <div className="shot-chrome">
              <div className="shot-dots"><span/><span/><span/></div>
              <span className="shot-url">studio.acmevision.ai/traffic-q3/frame_0428</span>
            </div>
            <div className="shot-canvas">
              <div className="shot-rail">
                {[
                  <svg key="cursor" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 3l7.5 18 2.3-7.2L21 11.5z"/></svg>,
                  <svg key="bbox" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="1.5" strokeDasharray="3 2.5"/></svg>,
                  <svg key="poly" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3l8 5.5-3 10.5H7L4 8.5z"/></svg>,
                  <svg key="kpt" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3.5" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round"/></svg>,
                ].map((icon, i) => (
                  <div key={i} className={`shot-tool${i === 1 ? ' on' : ''}`}>{icon}</div>
                ))}
              </div>
              <div className="shot-view">
                <div className="shot-pic">
                  <div className="sc" />
                  {BOXES.map((b, i) => (
                    <span key={i} className="mb" style={{'--bc': b.bc, left: b.left, top: b.top, width: b.width, height: b.height} as React.CSSProperties}>
                      <span className="ml">{b.label}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="shot-insp">
                <div className="insp-h">Annotations · 3</div>
                {[{c:'#3b6af5',n:'Car',d:'150×96',on:true},{c:'#10b981',n:'Truck',d:'176×108'},{c:'#8b5cf6',n:'Person',d:'42×96'}].map(r => (
                  <div key={r.n} className={`insp-row${r.on ? ' on' : ''}`}>
                    <span className="sw" style={{background: r.c}}/>
                    <span className="nm">{r.n}</span>
                    <span className="dim">{r.d}</span>
                  </div>
                ))}
                <div className="insp-h" style={{marginTop: 18}}>Classes · 6</div>
                {[{c:'#f59e0b',n:'Truck',d:'1'},{c:'#ec4899',n:'Traffic light',d:'0'}].map(r => (
                  <div key={r.n} className="insp-row">
                    <span className="sw" style={{background: r.c}}/>
                    <span className="nm">{r.n}</span>
                    <span className="dim">{r.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* LOGOS */}
      <div className="logos-strip wrap">
        <div className="logos-lbl">Trusted by vision teams at</div>
        <div className="logos-row">
          {['NORTHBEAM','VECTRA','OAKRIDGE AI','HELIX','SENTRA'].map(n => <span key={n}>{n}</span>)}
        </div>
      </div>

      {/* FEATURES */}
      <section className="feat wrap" id="features">
        <div className="sec-head">
          <div className="eyebrow">Everything in one canvas</div>
          <h2>Built for the messy reality of real datasets</h2>
          <p>From first upload to production export, every step lives in one fast, keyboard-driven workspace.</p>
        </div>
        <div className="fgrid">
          <div className="fcard">
            <div className="ic" style={{background:'var(--primary-container)',color:'var(--primary)'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="1.5" strokeDasharray="3 2.5"/></svg>
            </div>
            <h3>Boxes, polygons &amp; keypoints</h3>
            <p>Pixel-precise tools with snapping, magnetic edges, and sub-pixel nudging. Switch tools without leaving the keyboard.</p>
          </div>
          <div className="fcard">
            <div className="ic" style={{background:'var(--secondary-container)',color:'var(--secondary)'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/></svg>
            </div>
            <h3>Model-assisted labeling</h3>
            <p>Pre-label with your own model or our foundation detector, then correct instead of starting from scratch. 60% faster.</p>
          </div>
          <div className="fcard">
            <div className="ic" style={{background:'var(--success-container)',color:'var(--success)'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <h3>Review workflows</h3>
            <p>Assign, review, and approve in stages. Catch conflicts before they reach training, with full annotation history.</p>
          </div>
          <div className="fcard wide">
            <div className="body">
              <div className="ic" style={{background:'var(--warning-container)',color:'var(--warning)'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              </div>
              <h3>Export to any format, instantly</h3>
              <p>COCO, YOLO, Pascal VOC, CreateML — one click, versioned and reproducible. Pipe straight into your training jobs via the API.</p>
            </div>
            <div className="visual">
              <div className="code">
                <span style={{color:'var(--primary)'}}>{'{ "annotations": ['}</span>
                <span style={{paddingLeft:12}}>{' { "bbox": [120,250,150,96],'}</span>
                <span style={{paddingLeft:24}}>{'"category": "car" },'}</span>
                <span style={{paddingLeft:12}}>{' { "bbox": [470,236,176,108],'}</span>
                <span style={{paddingLeft:24}}>{'"category": "truck" }'}</span>
                <span style={{color:'var(--primary)'}}>{'} ]'}</span>
              </div>
            </div>
          </div>
          <div className="fcard">
            <div className="ic" style={{background:'var(--destructive-container)',color:'var(--destructive)'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>
            </div>
            <h3>Keyboard-first &amp; ⌘K</h3>
            <p>Every action has a shortcut. A command palette gets you anywhere in two keystrokes.</p>
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <div className="band">
        <div className="band-glow" />
        <div className="stats-grid">
          {[['312M+','annotations labeled'],['60%','faster with AI assist'],['99.2%','label accuracy'],['4,000+','vision teams']].map(([b,s]) => (
            <div key={s} className="stat"><b>{b}</b><span>{s}</span></div>
          ))}
        </div>
      </div>

      {/* WORKFLOW */}
      <section className="feat wrap" id="workflow">
        <div className="sec-head">
          <div className="eyebrow">From upload to model in 3 steps</div>
          <h2>A workflow your whole team can follow</h2>
        </div>
        <div className="steps">
          {[
            {h:'Upload & organize', p:'Drag in images or sync from S3 / GCS. Auto-dedup, group, and split into train / val.'},
            {h:'Label & review', p:'Pre-label with AI, correct on the canvas, then route to reviewers with one click.'},
            {h:'Export & train', p:'Export to COCO or YOLO, or pull a versioned dataset straight from the API.'},
          ].map((s, i) => (
            <div key={i} className="step-item">
              {i < 2 && <div className="step-line" />}
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <section className="cta-band wrap">
        <h2>Ship your detector a month early.</h2>
        <p>Start free today — bring your first 5,000 images on us.</p>
        <div className="cta-btns">
          <Link href="/auth" className="btn btn-primary btn-xl">
            Create your workspace
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <Link href="/dashboard" className="btn btn-outline btn-xl">Explore the demo</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="footer-cols">
            <div className="footer-col footer-about">
              <Link href="/landing" className="logo" style={{fontSize:'var(--text-title-size)'}}>
                <LogoMark />
                Annotation Studio
              </Link>
              <p>The annotation platform for computer-vision teams who care about data quality.</p>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a><a href="#">Pricing</a>
              <a href="#">Changelog</a><a href="#">Roadmap</a>
            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <a href="#">Docs</a><a href="#">API reference</a>
              <a href="#">Guides</a><a href="#">Status</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About</a><a href="#">Careers</a>
              <a href="#">Blog</a><a href="#">Contact</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Annotation Studio, Inc.</span>
            <span>Privacy · Terms · SOC 2 Type II</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
