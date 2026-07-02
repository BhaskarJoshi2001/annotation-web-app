'use client';

import { useAnnotationStore } from '@/lib/store/annotation-store';
import { useTheme } from '@/components/theme-provider';
import { useUser } from '@clerk/nextjs';

export function TopBar({
  onExport,
  onHelp,
  onNewImage,
  saveState = 'idle',
  currentIndex = 0,
  totalImages = 1,
  onPrev,
  onNext,
  projectId,
  imageStatus = 'unlabeled',
  onMarkDone,
}: {
  onExport: () => void;
  onHelp: () => void;
  onNewImage: () => void;
  saveState?: 'idle' | 'saving' | 'saved';
  currentIndex?: number;
  totalImages?: number;
  onPrev?: () => void;
  onNext?: () => void;
  projectId?: string | null;
  imageStatus?: 'unlabeled' | 'in_progress' | 'labeled';
  onMarkDone?: () => void;
}) {
  const image = useAnnotationStore((s) => s.image);
  const zoomState = useAnnotationStore((s) => s.zoomState);
  const setZoomState = useAnnotationStore((s) => s.setZoomState);
  const resetZoom = useAnnotationStore((s) => s.resetZoom);
  const { resolved, setMode } = useTheme();
  const { user } = useUser();
  const initials = (user?.fullName || user?.firstName || 'U').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const zoomPct = Math.round(zoomState.scale * 100);
  const zoomIn = () => setZoomState({ scale: Math.min(zoomState.scale * 1.2, 5) });
  const zoomOut = () => setZoomState({ scale: Math.max(zoomState.scale / 1.2, 0.1) });

  return (
    <header className="topbar">
      <div className="top-l">
        <svg className="ws-logo" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="1" y="1" width="34" height="34" rx="9" fill="var(--primary)" />
          <rect x="8.5" y="8.5" width="19" height="19" rx="3.5" stroke="var(--on-primary)" strokeWidth="2" strokeDasharray="0.5 4.4" strokeLinecap="round" />
          <rect x="6" y="6" width="5" height="5" rx="1.5" fill="var(--on-primary)" /><rect x="25" y="6" width="5" height="5" rx="1.5" fill="var(--on-primary)" />
          <rect x="6" y="25" width="5" height="5" rx="1.5" fill="var(--on-primary)" /><rect x="25" y="25" width="5" height="5" rx="1.5" fill="var(--on-primary)" />
        </svg>
        <div className="crumb">
          <a href="/dashboard">Projects</a>
          {projectId && <><span className="sep">›</span><a href={`/dataset/${projectId}`}>Dataset</a></>}
          <span className="sep">›</span>
          <b>{image?.name ?? 'Untitled'}</b>
        </div>
      </div>

      <div className="top-c">
        <div className="imgswitch">
          <button className="icon-btn sm" aria-label="Previous image" disabled={!onPrev || currentIndex === 0} onClick={onPrev}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="idx">{currentIndex + 1} / {totalImages}</span>
          <button className="icon-btn sm" aria-label="Next image" disabled={!onNext || currentIndex === totalImages - 1} onClick={onNext}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        {saveState === 'saving' && <span className="savechip"><span className="pip" style={{ background: 'var(--warning)' }} />Saving…</span>}
        {saveState === 'saved' && <span className="savechip"><span className="pip" />Saved</span>}
        <button
          onClick={onMarkDone}
          title={imageStatus === 'labeled' ? 'Mark as in-progress' : 'Mark as labeled / done'}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 'var(--radius-full)',
            border: `1.5px solid ${imageStatus === 'labeled' ? 'var(--success)' : 'var(--outline)'}`,
            background: imageStatus === 'labeled' ? 'var(--success-subtle, #dcfce7)' : 'transparent',
            color: imageStatus === 'labeled' ? 'var(--success)' : 'var(--muted-foreground)',
            cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.12s',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l4 4 10-10" />
          </svg>
          {imageStatus === 'labeled' ? 'Labeled' : 'Mark done'}
        </button>
      </div>

      <div className="top-r">
        <div className="zoomctl">
          <button className="icon-btn sm" aria-label="Zoom out" onClick={zoomOut}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" strokeLinecap="round" /></svg>
          </button>
          <button className="pct" title="Reset zoom" onClick={resetZoom}>{zoomPct}%</button>
          <button className="icon-btn sm" aria-label="Zoom in" onClick={zoomIn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          </button>
        </div>
        <button className="icon-btn" aria-label="New image" title="New image" onClick={onNewImage}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" /></svg>
        </button>
        <button className="btn btn-outline btn-sm" onClick={onExport}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Export
        </button>
        <span className="vsep-bar" />
        <button className="icon-btn" aria-label="Keyboard shortcuts" title="Shortcuts (?)" onClick={onHelp}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7M12 17h.01" strokeLinecap="round" /></svg>
        </button>
        <button className="icon-btn" aria-label="Toggle theme" onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}>
          {resolved === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
          )}
        </button>
        {user?.imageUrl
          ? <img src={user.imageUrl} alt={initials} className="avatar sm" style={{ objectFit: 'cover', marginLeft: 4 }} />
          : <span className="avatar sm" style={{ background: 'var(--blue-500)', color: '#fff', marginLeft: 4 }}>{initials}</span>
        }
      </div>
    </header>
  );
}
