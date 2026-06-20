'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { useTheme } from '@/components/theme-provider';
import '../ds.css';
import '../app-shell.css';
import './exports.css';

interface Export {
  id: number;
  fmt: string;
  name: string;
  proj: string;
  imgs: string;
  anns: string;
  size: string;
  ago: string;
}

const INITIAL_EXPORTS: Export[] = [
  { id: 1, fmt: 'COCO', name: 'COCO JSON', proj: 'Traffic — Q3 dashcam', imgs: '2,032', anns: '12,840', size: '4.2 MB', ago: '2h ago' },
  { id: 2, fmt: 'YOLO', name: 'YOLO v8', proj: 'Warehouse pallets', imgs: '1,180', anns: '8,204', size: '2.8 MB', ago: 'yesterday' },
  { id: 3, fmt: 'COCO', name: 'COCO JSON', proj: 'Retail shelf audit', imgs: '3,804', anns: '51,240', size: '18.1 MB', ago: '3d ago' },
];

interface Toast { id: number; title: string; msg: string; accent: string; }

export default function ExportsPage() {
  const { resolved, setMode } = useTheme();
  const isDark = resolved === 'dark';
  const [exports, setExports] = useState<Export[]>(INITIAL_EXPORTS);
  const [removing, setRemoving] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; id: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const addToast = useCallback((title: string, msg: string, accent = 'var(--primary)') => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, title, msg, accent }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3400);
  }, []);

  function handleDownload(id: number) {
    const e = exports.find(x => x.id === id);
    if (e) addToast('Download started', `${e.name} · ${e.size}`);
  }

  function handleDelete(id: number) {
    const e = exports.find(x => x.id === id);
    setRemoving(id);
    setTimeout(() => {
      setExports(p => p.filter(x => x.id !== id));
      setRemoving(null);
      if (e) addToast('Export deleted', `Removed ${e.name} for ${e.proj}.`);
    }, 200);
  }

  function openMenu(ev: React.MouseEvent, id: number) {
    ev.stopPropagation();
    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu({ x: rect.right - 180, y: rect.bottom + 6, id });
  }

  useEffect(() => {
    if (!menu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null);
    }
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setMenu(null); }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey); };
  }, [menu]);

  return (
    <div className="ds exp-pg">
      <AppSidebar active="exports" showUsage />

      <div className="main">
        <header className="topbar">
          <h1>Exports</h1>
          <div className="grow" />
          <button className="icon-btn" aria-label="Toggle theme" onClick={() => setMode(isDark ? 'light' : 'dark')}>
            {isDark
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
            }
          </button>
          <button className="btn btn-primary" onClick={() => addToast('New export', 'Choose a project to export from the projects page.')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            New export
          </button>
        </header>

        <div className="content">
          {exports.length === 0 ? (
            <div className="empty">
              <div className="art">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              </div>
              <h3>No exports yet</h3>
              <p>Export a dataset from any project to see it here. Exports are bundled and ready to download for training.</p>
              <a className="btn btn-outline" href="/dashboard">Go to projects</a>
            </div>
          ) : (
            <div className="exp-list">
              {exports.map(e => (
                <div key={e.id} className={`exp-row${removing === e.id ? ' removing' : ''}`}>
                  <div className="fmt-badge">{e.fmt}</div>
                  <div className="exp-meta">
                    <div className="l1">
                      <b>{e.name}</b>
                      <span className="proj">{e.proj}</span>
                    </div>
                    <div className="l2">{e.imgs} images · {e.anns} annotations</div>
                  </div>
                  <div className="exp-right">
                    <span className="badge badge-success">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 2 }}>
                        <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Ready
                    </span>
                    <span className="size">{e.size}<span className="ago">{e.ago}</span></span>
                    <button className="btn btn-outline btn-sm" onClick={() => handleDownload(e.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                      Download
                    </button>
                    <button className="icon-btn sm" aria-label="Export options" onClick={ev => openMenu(ev, e.id)}>
                      <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Context menu */}
      {menu && (
        <div ref={menuRef} className="ctx-menu" style={{ left: menu.x, top: menu.y }}>
          <button onClick={() => { handleDownload(menu.id); setMenu(null); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Download
          </button>
          <div className="divider" />
          <button className="danger" onClick={() => { handleDelete(menu.id); setMenu(null); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" /></svg>
            Delete export
          </button>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-host">
        {toasts.map(t => (
          <div key={t.id} className="toast-item show" style={{ borderLeftColor: t.accent }}>
            <span className="t-icon" style={{ color: t.accent }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <div>
              <div className="t-label" style={{ marginBottom: 2 }}>{t.title}</div>
              <div className="t-caption">{t.msg}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
