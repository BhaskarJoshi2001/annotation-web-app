'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/components/theme-provider';
import { AppSidebar } from '@/components/app-sidebar';
import '../../ds.css';
import '../../app-shell.css';
import '../dataset.css';

type ImgStatus = 'labeled' | 'in_progress' | 'unlabeled';
type ExportFmt = 'coco' | 'yolo' | 'json' | 'csv';
type SortKey = 'newest' | 'oldest' | 'az';

interface DbImage {
  id: string;
  projectId: string;
  filename: string;
  r2Key: string;
  width: number | null;
  height: number | null;
  status: ImgStatus;
  createdAt: string;
  url: string;
  annotationCount: number;
}

interface DbProject {
  id: string;
  name: string;
  taskType: string;
}

const EXPORT_FMTS: { id: ExportFmt; name: string; desc: string }[] = [
  { id: 'coco', name: 'COCO JSON', desc: '.json · det/seg' },
  { id: 'yolo', name: 'YOLO v8', desc: '.zip · labels/ + classes.txt' },
  { id: 'json', name: 'Custom JSON', desc: 'full annotation model' },
  { id: 'csv', name: 'CSV manifest', desc: 'filenames + counts' },
];

interface Toast { id: number; title: string; msg: string; }

function StateBadge({ state }: { state: ImgStatus }) {
  if (state === 'labeled') return <span className="badge badge-success" style={{ height: 20 }}><span className="dot" />Labeled</span>;
  if (state === 'in_progress') return <span className="badge badge-warning" style={{ height: 20 }}><span className="dot" />In progress</span>;
  return <span className="badge" style={{ height: 20, background: 'rgba(0,0,0,.4)', color: '#fff', backdropFilter: 'blur(3px)' }}>Unlabeled</span>;
}

export default function DatasetPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();
  const { resolved, setMode } = useTheme();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | ImgStatus>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [exportOpen, setExportOpen] = useState(false);
  const [exportFmt, setExportFmt] = useState<ExportFmt>('coco');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportOpts, setExportOpts] = useState({ includeEmpty: false });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload counter: tracks concurrent uploads
  const [uploadPending, setUploadPending] = useState(0);
  const [uploadDone, setUploadDone] = useState(0);
  const uploadTotalRef = useRef(0);

  const addToast = useCallback((title: string, msg: string, duration = 3400) => {
    const id = ++toastIdRef.current;
    setToasts(p => [...p, { id, title, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }, []);

  // Fetch project name for breadcrumb
  const { data: project } = useQuery<DbProject>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      return res.json();
    },
    enabled: !!projectId,
  });

  const { data: imageList = [], isLoading } = useQuery<DbImage[]>({
    queryKey: ['images', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/images`);
      if (!res.ok) throw new Error('Failed to fetch images');
      return res.json();
    },
    enabled: !!projectId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const dims = await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
        img.src = url;
      });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('width', String(dims.width));
      formData.append('height', String(dims.height));
      const res = await fetch(`/api/projects/${projectId}/images`, { method: 'POST', body: formData });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'Upload failed'); }
      return res.json() as Promise<DbImage>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images', projectId] });
      setUploadDone(d => {
        const next = d + 1;
        if (next >= uploadTotalRef.current) {
          setTimeout(() => { setUploadPending(0); setUploadDone(0); uploadTotalRef.current = 0; }, 1800);
        }
        return next;
      });
      setUploadPending(p => Math.max(0, p - 1));
    },
    onError: (err: Error) => {
      addToast('Upload failed', err.message);
      setUploadPending(p => Math.max(0, p - 1));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const res = await fetch(`/api/images/${imageId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Delete failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images', projectId] });
    },
    onError: (err: Error) => addToast('Delete failed', err.message),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: ImgStatus }) => {
      await Promise.all(ids.map(id =>
        fetch(`/api/images/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images', projectId] });
      setSelected(new Set());
    },
    onError: (err: Error) => addToast('Failed', err.message),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => fetch(`/api/images/${id}`, { method: 'DELETE' })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images', projectId] });
      setSelected(new Set());
      addToast('Deleted', `${selected.size} image${selected.size === 1 ? '' : 's'} removed.`);
    },
    onError: (err: Error) => addToast('Delete failed', err.message),
  });

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!valid.length) return;
    uploadTotalRef.current += valid.length;
    setUploadPending(p => p + valid.length);
    valid.forEach(file => uploadMutation.mutate(file));
  }, [uploadMutation]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && exportOpen && !exportLoading) setExportOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [exportOpen, exportLoading]);

  async function doExport() {
    if (exportLoading || imageList.length === 0) return;
    setExportLoading(true);
    try {
      const qs = new URLSearchParams({ format: exportFmt, includeEmpty: String(exportOpts.includeEmpty) });
      const res = await fetch(`/api/projects/${projectId}/export?${qs}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cd = res.headers.get('Content-Disposition');
      link.download = cd?.match(/filename="([^"]+)"/)?.[1] ?? 'export';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      const fmt = EXPORT_FMTS.find(f => f.id === exportFmt)!;
      addToast('Export ready', `${fmt.name} · ${imageList.length} images`);
      setExportOpen(false);
    } catch (err) {
      addToast('Export failed', (err as Error).message);
    } finally {
      setExportLoading(false);
    }
  }

  const list = useMemo(() => {
    const q = query.toLowerCase();
    let filtered = imageList.filter(
      (im) => (filter === 'all' || im.status === filter) && im.filename.toLowerCase().includes(q)
    );
    if (sort === 'newest') filtered = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else if (sort === 'oldest') filtered = [...filtered].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    else if (sort === 'az') filtered = [...filtered].sort((a, b) => a.filename.localeCompare(b.filename));
    return filtered;
  }, [imageList, query, filter, sort]);

  const labeledCount = imageList.filter(i => i.status === 'labeled').length;
  const unlabeledCount = imageList.filter(i => i.status === 'unlabeled').length;
  const inProgressCount = imageList.filter(i => i.status === 'in_progress').length;

  const TABS = [
    { label: 'All', value: 'all' as const, count: imageList.length, badge: 'badge-neutral' },
    { label: 'Labeled', value: 'labeled' as const, count: labeledCount, badge: 'badge-success' },
    { label: 'Unlabeled', value: 'unlabeled' as const, count: unlabeledCount, badge: 'badge-neutral' },
    { label: 'In progress', value: 'in_progress' as const, count: inProgressCount, badge: 'badge-warning' },
  ];

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const onCardClick = (id: string) => {
    if (selected.size > 0) toggle(id);
    else router.push(`/workspace/${id}`);
  };

  const selectAll = () => {
    setSelected((prev) => (prev.size === list.length ? new Set() : new Set(list.map((im) => im.id))));
  };

  // Navigate to first unlabeled → first in-progress → first overall
  const startLabelingTarget = useMemo(() => {
    const unlabeled = imageList.find(i => i.status === 'unlabeled');
    if (unlabeled) return unlabeled.id;
    const inProg = imageList.find(i => i.status === 'in_progress');
    if (inProg) return inProg.id;
    return imageList[0]?.id ?? null;
  }, [imageList]);

  const showUploadBar = uploadPending > 0 || uploadDone > 0;

  return (
    <div
      className="ds dataset"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
    >
      <AppSidebar active="datasets" />

      <div className="main">
        <header className="topbar">
          <div className="row1">
            <div className="crumb">
              <a href="/dashboard">Projects</a>
              <span>›</span>
              <b>{project?.name ?? 'Dataset'}</b>
            </div>
            <div style={{ flex: 1 }} />
            <button className="icon-btn" aria-label="Toggle theme" onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}>
              {resolved === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              )}
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setExportOpen(true)}
              disabled={imageList.length === 0}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              Export
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={!startLabelingTarget}
              onClick={() => startLabelingTarget && router.push(`/workspace/${startLabelingTarget}`)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="1.5" strokeDasharray="3 2.5" /></svg>
              Start labeling
            </button>
          </div>
          <h1>{project?.name ?? 'Dataset'}</h1>
          <div className="meta-row">
            <span><span className="mono">{imageList.length}</span> images</span><span className="vsep" />
            <span><span className="mono">{labeledCount}</span> labeled</span><span className="vsep" />
            {imageList.length > 0 && (
              <span className="badge badge-success" style={{ height: 20 }}>
                <span className="dot" />{Math.round((labeledCount / imageList.length) * 100)}% done
              </span>
            )}
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button className="upload" type="button" onClick={() => fileInputRef.current?.click()}>
            <span className="ic">
              {showUploadBar ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
              )}
            </span>
            <span className="txt">
              {showUploadBar ? (
                <>
                  <b>Uploading {uploadDone} / {uploadTotalRef.current} files…</b>
                  <p>{uploadPending} remaining</p>
                </>
              ) : (
                <>
                  <b>Drag & drop images, or click to browse</b>
                  <p>JPG, PNG, WebP up to 50 MB · supports multiple files</p>
                </>
              )}
            </span>
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
            <span className="t-caption">Showing {list.length} of {imageList.length}</span>
            <div className="select-wrap">
              <select
                className="select-native"
                style={{ height: 34, fontSize: 'var(--text-label-size)' }}
                aria-label="Sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="az">Filename A–Z</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>Loading images…</div>
          ) : list.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
              {imageList.length === 0 ? 'No images yet — upload some above.' : 'No images match your filter.'}
            </div>
          ) : (
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
                    <img
                      src={im.url}
                      alt={im.filename}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                    <div className="ov" />
                    <span className="checkbox" role="button" tabIndex={-1} aria-label="Select image" onClick={(e) => { e.stopPropagation(); toggle(im.id); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                    {/* Delete button — top right on hover */}
                    <button
                      className="icon-btn sm"
                      aria-label="Delete image"
                      style={{ position: 'absolute', top: 6, right: 6, zIndex: 2, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', opacity: 0, transition: 'opacity 0.15s' }}
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(im.id); }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                    </button>
                    <div className="statedot"><StateBadge state={im.status} /></div>
                    <div className="info">
                      <span className="fn">{im.filename}</span>
                      {im.annotationCount > 0 && (
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
                          {im.annotationCount} object{im.annotationCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── BULK ACTION BAR ── */}
      <div className={`dataset-bulkbar${selected.size > 0 ? ' show' : ''}`}>
        <span className="ct">{selected.size} selected</span>
        <span className="vsep" />
        <button
          className="prim"
          onClick={() => { const first = Array.from(selected)[0]; if (first) router.push(`/workspace/${first}`); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="1.5" strokeDasharray="3 2.5" /></svg>
          Label selected
        </button>
        <button
          onClick={() => bulkStatusMutation.mutate({ ids: Array.from(selected), status: 'labeled' })}
          disabled={bulkStatusMutation.isPending}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          Mark labeled
        </button>
        <button
          onClick={() => {
            if (!confirm(`Delete ${selected.size} image${selected.size === 1 ? '' : 's'}? This cannot be undone.`)) return;
            bulkDeleteMutation.mutate(Array.from(selected));
          }}
          disabled={bulkDeleteMutation.isPending}
          style={{ color: 'var(--destructive)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
          Delete
        </button>
        <span className="vsep" />
        <button className="closebtn" aria-label="Clear selection" onClick={() => setSelected(new Set())}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
        </button>
      </div>

      {/* ── EXPORT MODAL ── */}
      <div className={`scrim${exportOpen ? ' open' : ''}`} onClick={() => { if (!exportLoading) setExportOpen(false); }}>
        <div className="dialog exp-dlg" role="dialog" aria-modal="true" aria-labelledby="exp-ttl" onClick={e => e.stopPropagation()}>
          <div className="dlg-head">
            <div className="dlg-ico exp-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            </div>
            <div>
              <h3 id="exp-ttl">Export dataset</h3>
              <p className="dlg-sub">{imageList.length} images · {labeledCount} labeled</p>
            </div>
            <button className="icon-btn sm" aria-label="Close" onClick={() => !exportLoading && setExportOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>

          <div className="dlg-body">
            <p className="exp-section-lbl">Format</p>
            <div className="fmt-grid">
              {EXPORT_FMTS.map(f => (
                <button key={f.id} className={`fmt-card${exportFmt === f.id ? ' sel' : ''}`} onClick={() => setExportFmt(f.id)}>
                  <span className="fmt-radio"><span className="fmt-pip" /></span>
                  <span className="fmt-info"><b>{f.name}</b><span>{f.desc}</span></span>
                </button>
              ))}
            </div>

            <div className="exp-summary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>
              <span>{labeledCount} labeled · {unlabeledCount} unlabeled · {imageList.length} total</span>
            </div>

            <div className="exp-opts">
              <label className="exp-opt" style={{ borderBottom: 0 }}>
                <span><b>Include unannotated images</b><span>{unlabeledCount} images with no annotations</span></span>
                <label className="switch">
                  <input type="checkbox" checked={exportOpts.includeEmpty} onChange={e => setExportOpts(o => ({ ...o, includeEmpty: e.target.checked }))} />
                  <span className="track"><span className="thumb" /></span>
                </label>
              </label>
            </div>
          </div>

          <div className="dlg-foot">
            <button className="btn btn-ghost" onClick={() => !exportLoading && setExportOpen(false)}>Cancel</button>
            <button className="btn btn-primary" data-loading={exportLoading ? 'true' : undefined} onClick={doExport} disabled={exportLoading}>
              {exportLoading && <span className="spinner" />}
              <span className="btn-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-label-size)', fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
              <div style={{ fontSize: 'var(--text-caption-size)', color: 'var(--muted-foreground)' }}>{t.msg}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
