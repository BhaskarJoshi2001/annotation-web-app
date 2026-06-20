'use client';

import { useMemo, useState, useEffect, useRef, useCallback, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/theme-provider';
import { AppSidebar } from '@/components/app-sidebar';
import '../ds.css';
import '../app-shell.css';
import './dataset.css';

type ImgState = 'labeled' | 'review' | 'unlabeled';
type ExportFmt = 'coco' | 'yolo' | 'voc' | 'csv';

const SCENES = [
  'linear-gradient(180deg,#2b3a55,#3d4a66 40%,#585c66 52%,#2a2d35)',
  'linear-gradient(175deg,#33405c,#46506b 44%,#646a78 54%,#2f3138)',
  'linear-gradient(180deg,#243149,#3a4862 42%,#5c6373 53%,#272a31)',
];
const BOX_COLORS = ['#3b6af5', '#10b981', '#f59e0b', '#8b5cf6'];
const LAYOUTS: number[][][] = [
  [[18, 52, 30, 28], [58, 44, 26, 32]],
  [[12, 40, 24, 40], [44, 48, 30, 30], [74, 42, 18, 34]],
  [[30, 46, 38, 34]],
];

const EXPORT_FMTS: { id: ExportFmt; name: string; desc: string }[] = [
  { id: 'coco', name: 'COCO JSON', desc: '.json · det/seg' },
  { id: 'yolo', name: 'YOLO v8', desc: '.txt per image' },
  { id: 'voc', name: 'Pascal VOC', desc: '.xml per image' },
  { id: 'csv', name: 'CSV manifest', desc: 'filenames + counts' },
];

interface ImageItem { id: number; fn: string; state: ImgState; scene: string; count: number; }
interface Toast { id: number; title: string; msg: string; action?: string; }

const IMAGES: ImageItem[] = Array.from({ length: 24 }, (_, i) => {
  const state: ImgState = i < 18 ? 'labeled' : i < 21 ? 'review' : 'unlabeled';
  return { id: i, fn: `frame_0${400 + i}.jpg`, state, scene: SCENES[i % 3], count: state === 'unlabeled' ? 0 : 2 + (i % 5) };
});

const TABS: { label: string; value: 'all' | ImgState; count: number; badge: string }[] = [
  { label: 'All', value: 'all', count: 2480, badge: 'badge-neutral' },
  { label: 'Labeled', value: 'labeled', count: 2032, badge: 'badge-success' },
  { label: 'Unlabeled', value: 'unlabeled', count: 448, badge: 'badge-neutral' },
  { label: 'In review', value: 'review', count: 96, badge: 'badge-warning' },
];

function StateBadge({ state }: { state: ImgState }) {
  if (state === 'labeled') return <span className="badge badge-success" style={{ height: 20 }}><span className="dot" />Labeled</span>;
  if (state === 'review') return <span className="badge badge-warning" style={{ height: 20 }}><span className="dot" />Review</span>;
  return <span className="badge" style={{ height: 20, background: 'rgba(0,0,0,.4)', color: '#fff', backdropFilter: 'blur(3px)' }}>Unlabeled</span>;
}

function MiniBoxes({ item }: { item: ImageItem }) {
  if (item.state === 'unlabeled') return null;
  const layout = LAYOUTS[item.id % 3];
  return (
    <>
      {layout.map((b, i) => (
        <span key={i} className="mini" style={{ ['--bc']: BOX_COLORS[i % 4], left: `${b[0]}%`, top: `${b[1]}%`, width: `${b[2]}%`, height: `${b[3]}%` } as CSSProperties} />
      ))}
    </>
  );
}

export default function DatasetPage() {
  const router = useRouter();
  const { resolved, setMode } = useTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | ImgState>('all');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Export modal
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFmt, setExportFmt] = useState<ExportFmt>('coco');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportOpts, setExportOpts] = useState({ includeEmpty: false, splitFiles: true });

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((title: string, msg: string, action?: string, duration = 3400) => {
    const id = ++toastIdRef.current;
    setToasts(p => [...p, { id, title, msg, action }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && exportOpen && !exportLoading) setExportOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [exportOpen, exportLoading]);

  function doExport() {
    if (exportLoading) return;
    setExportLoading(true);
    const fmt = EXPORT_FMTS.find(f => f.id === exportFmt)!;
    setTimeout(() => {
      setExportLoading(false);
      setExportOpen(false);
      addToast('Export ready', `${fmt.name} · 4.2 MB — 2,032 images`, 'Download', 6000);
    }, 1200);
  }

  const list = useMemo(() => {
    const q = query.toLowerCase();
    return IMAGES.filter((im) => (filter === 'all' || im.state === filter) && im.fn.includes(q));
  }, [query, filter]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const onCardClick = (id: number) => {
    if (selected.size > 0) toggle(id);
    else router.push('/');
  };

  const selectAll = () => {
    setSelected((prev) => (prev.size === list.length ? new Set() : new Set(list.map((im) => im.id))));
  };

  return (
    <div className="ds dataset">
      <AppSidebar active="datasets" />

      <div className="main">
        <header className="topbar">
          <div className="row1">
            <div className="crumb"><a href="/dashboard">Projects</a><span>›</span><b>Traffic — Q3 dashcam</b></div>
            <div style={{ flex: 1 }} />
            <button className="icon-btn" aria-label="Toggle theme" onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}>
              {resolved === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              )}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setExportOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              Export
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="1.5" strokeDasharray="3 2.5" /></svg>
              Start labeling
            </button>
          </div>
          <h1>Traffic — Q3 dashcam</h1>
          <div className="meta-row">
            <span><span className="mono">2,480</span> images</span><span className="vsep" />
            <span><span className="mono">6</span> classes</span><span className="vsep" />
            <span><span className="mono">12,840</span> annotations</span><span className="vsep" />
            <span className="badge badge-success" style={{ height: 20 }}><span className="dot" />82% labeled</span>
          </div>
          <div className="tabsrow" role="tablist">
            {TABS.map((t) => (
              <button key={t.value} className="tab-u" role="tab" aria-selected={filter === t.value} onClick={() => setFilter(t.value)}>
                {t.label} <span className={`badge ${t.badge}`} style={{ height: 18 }}>{t.count}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="content">
          <button className="upload" type="button">
            <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg></span>
            <span className="txt"><b>Drag &amp; drop images, or click to browse</b><p>JPG, PNG, WebP up to 50&nbsp;MB · or import from S3, GCS, or a URL list</p></span>
            <span className="btn btn-tonal">Import from cloud</span>
          </button>

          <div className="galbar">
            <div className="searchbar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" /></svg>
              <input placeholder="Filter by filename…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter by filename" />
            </div>
            <button className="btn btn-outline btn-sm" onClick={selectAll}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              {selected.size === list.length && list.length > 0 ? 'Clear all' : 'Select all'}
            </button>
            <div className="grow" />
            <span className="t-caption">Showing {list.length} of 2,480</span>
            <div className="select-wrap">
              <select className="select-native" style={{ height: 34, fontSize: 'var(--text-label-size)' }} aria-label="Sort">
                <option>Newest first</option><option>Oldest first</option><option>Most annotations</option><option>Filename A–Z</option>
              </select>
            </div>
          </div>

          <div className="gallery">
            {list.map((im) => (
              <article
                key={im.id}
                className={`imgcard${selected.has(im.id) ? ' sel' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => onCardClick(im.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCardClick(im.id); } }}
              >
                <div className="thumb">
                  <div className="scene" style={{ background: im.scene }} />
                  <MiniBoxes item={im} />
                  <div className="ov" />
                  <span className="checkbox" role="button" tabIndex={-1} aria-label="Select image" onClick={(e) => { e.stopPropagation(); toggle(im.id); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  <div className="statedot"><StateBadge state={im.state} /></div>
                  <div className="info">
                    <span className="fn">{im.fn}</span>
                    {im.count > 0 && <span className="cnt">{im.count}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className={`dataset-bulkbar${selected.size > 0 ? ' show' : ''}`}>
        <span className="ct">{selected.size} selected</span>
        <span className="vsep" />
        <button className="prim" onClick={() => router.push('/')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="1.5" strokeDasharray="3 2.5" /></svg>Label selected</button>
        <button><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>Mark reviewed</button>
        <button><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>Delete</button>
        <span className="vsep" />
        <button className="closebtn" aria-label="Clear selection" onClick={() => setSelected(new Set())}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg></button>
      </div>

      {/* ── EXPORT MODAL ── */}
      <div className={`scrim${exportOpen ? ' open' : ''}`} onClick={() => { if (!exportLoading) setExportOpen(false); }}>
        <div className="dialog exp-dlg" role="dialog" aria-modal="true" aria-labelledby="exp-ttl" onClick={e => e.stopPropagation()}>
          <div className="dlg-head">
            <div className="dlg-ico exp-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </div>
            <div>
              <h3 id="exp-ttl">Export dataset</h3>
              <p className="dlg-sub">Traffic — Q3 dashcam</p>
            </div>
            <button className="icon-btn sm" aria-label="Close" onClick={() => !exportLoading && setExportOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>

          <div className="dlg-body">
            <p className="exp-section-lbl">Format</p>
            <div className="fmt-grid">
              {EXPORT_FMTS.map(f => (
                <button
                  key={f.id}
                  className={`fmt-card${exportFmt === f.id ? ' sel' : ''}`}
                  onClick={() => setExportFmt(f.id)}
                >
                  <span className="fmt-radio"><span className="fmt-pip" /></span>
                  <span className="fmt-info">
                    <b>{f.name}</b>
                    <span>{f.desc}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="exp-summary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>
              <span>2,032 images · 12,840 annotations · 6 classes</span>
            </div>

            <div className="exp-opts">
              <label className="exp-opt">
                <span>
                  <b>Include unannotated images</b>
                  <span>448 images with no annotations</span>
                </span>
                <label className="switch">
                  <input type="checkbox" checked={exportOpts.includeEmpty} onChange={e => setExportOpts(o => ({ ...o, includeEmpty: e.target.checked }))} />
                  <span className="track"><span className="thumb" /></span>
                </label>
              </label>
              <label className="exp-opt" style={{ borderBottom: 0 }}>
                <span>
                  <b>Split train / val / test</b>
                  <span>80 / 10 / 10 split by default</span>
                </span>
                <label className="switch">
                  <input type="checkbox" checked={exportOpts.splitFiles} onChange={e => setExportOpts(o => ({ ...o, splitFiles: e.target.checked }))} />
                  <span className="track"><span className="thumb" /></span>
                </label>
              </label>
            </div>
          </div>

          <div className="dlg-foot">
            <button className="btn btn-ghost" onClick={() => !exportLoading && setExportOpen(false)}>Cancel</button>
            <button className="btn btn-primary" data-loading={exportLoading ? 'true' : undefined} onClick={doExport}>
              {exportLoading && <span className="spinner" />}
              <span className="btn-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Export
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TOASTS ── */}
      <div className="ds-toast-host">
        {toasts.map(t => (
          <div key={t.id} className="ds-toast show">
            <span style={{ color: 'var(--primary)', flex: 'none', width: 18, height: 18, marginTop: 1 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-label-size)', fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
              <div style={{ fontSize: 'var(--text-caption-size)', color: 'var(--muted-foreground)' }}>Traffic — Q3 dashcam</div>
              {t.action && (
                <a href="#" onClick={e => e.preventDefault()} style={{ display: 'inline-block', marginTop: 4, fontSize: 'var(--text-caption-size)', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                  {t.action}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
