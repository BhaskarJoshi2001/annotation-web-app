'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/theme-provider';
import { AppSidebar } from '@/components/app-sidebar';
import '../ds.css';
import '../app-shell.css';
import './dataset.css';

type ImgState = 'labeled' | 'review' | 'unlabeled';

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

interface ImageItem { id: number; fn: string; state: ImgState; scene: string; count: number; }

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
            <button className="btn btn-outline btn-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>Export</button>
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="1.5" strokeDasharray="3 2.5" /></svg>Start labeling</button>
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
                  <span
                    className="checkbox"
                    role="button"
                    tabIndex={-1}
                    aria-label="Select image"
                    onClick={(e) => { e.stopPropagation(); toggle(im.id); }}
                  >
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
    </div>
  );
}
