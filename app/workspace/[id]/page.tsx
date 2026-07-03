'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnnotationCanvas, type AnnotationCanvasHandle } from '@/components/annotation-canvas-fabric';
import { useAnnotationStore } from '@/lib/store/annotation-store';
import { TopBar } from '@/components/workspace/top-bar';
import { ToolRail } from '@/components/workspace/tool-rail';
import { Inspector } from '@/components/workspace/inspector';
import { StatusBar } from '@/components/workspace/status-bar';
import { ShortcutsOverlay } from '@/components/workspace/shortcuts-overlay';
import { ExportDialog } from '@/components/workspace/export-dialog';
import type { Annotation, LabelClass, ImageData } from '@/lib/types';

type InspectorTab = 'annotations' | 'properties' | 'classes';
import '../../ds.css';
import '../../workspace.css';

type SaveState = 'idle' | 'saving' | 'saved';

interface ImageApiResponse {
  id: string;
  filename: string;
  r2Key: string;
  width: number | null;
  height: number | null;
  status: 'unlabeled' | 'in_progress' | 'labeled';
  createdAt: string;
  url: string;
  projectId: string;
  labelClasses: LabelClass[];
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const imageId = params.id as string;
  const canvasRef = useRef<AnnotationCanvasHandle>(null);

  const image = useAnnotationStore((s) => s.image);
  const annotations = useAnnotationStore((s) => s.annotations);
  const setImage = useAnnotationStore((s) => s.setImage);
  const setAnnotations = useAnnotationStore((s) => s.setAnnotations);
  const setLabelClasses = useAnnotationStore((s) => s.setLabelClasses);
  const setSelectedTool = useAnnotationStore((s) => s.setSelectedTool);
  const setActiveClass = useAnnotationStore((s) => s.setActiveClass);
  const setSelectedAnnotation = useAnnotationStore((s) => s.setSelectedAnnotation);
  const setProjectId = useAnnotationStore((s) => s.setProjectId);
  const undo = useAnnotationStore((s) => s.undo);
  const redo = useAnnotationStore((s) => s.redo);
  const resetZoom = useAnnotationStore((s) => s.resetZoom);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [exportOpen, setExportOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [projectId, setProjectIdState] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('annotations');
  const [imageStatus, setImageStatus] = useState<'unlabeled' | 'in_progress' | 'labeled'>('unlabeled');
  const [siblingIds, setSiblingIds] = useState<string[]>([]);
  const currentIndex = siblingIds.indexOf(imageId);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoad = useRef(true);

  const [aiError, setAiError] = useState<string | null>(null);
  const aiErrTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleAiError = useCallback((msg: string) => {
    setAiError(msg);
    if (aiErrTimer.current) clearTimeout(aiErrTimer.current);
    aiErrTimer.current = setTimeout(() => setAiError(null), 4000);
  }, []);

  // Load image + label classes + annotations from DB
  useEffect(() => {
    async function load() {
      try {
        const [imgRes, annRes] = await Promise.all([
          fetch(`/api/images/${imageId}`),
          fetch(`/api/images/${imageId}/annotations`),
        ]);

        if (!imgRes.ok) { setError('Image not found'); setLoading(false); return; }

        const img: ImageApiResponse = await imgRes.json();
        const anns: Annotation[] = await annRes.json();

        const imageData: ImageData = {
          id: img.id,
          name: img.filename,
          filename: img.filename,
          url: img.url,
          width: img.width ?? 0,
          height: img.height ?? 0,
          size: 0,
          uploadedAt: new Date(img.createdAt),
        };

        setImage(imageData);
        setProjectId(img.projectId);    // store (for label class actions)
        setProjectIdState(img.projectId); // local state (for nav/breadcrumb)
        setImageStatus(img.status);
        if (img.labelClasses.length > 0) setLabelClasses(img.labelClasses);
        if (anns.length > 0) setAnnotations(anns.map(a => {
          const raw = a as unknown as { createdAt: string; updatedAt: string };
          return { ...a, createdAt: new Date(raw.createdAt), updatedAt: new Date(raw.updatedAt) };
        }));

        // Fetch sibling image IDs for prev/next navigation
        const siblingsRes = await fetch(`/api/projects/${img.projectId}/images`);
        if (siblingsRes.ok) {
          const siblings: { id: string }[] = await siblingsRes.json();
          setSiblingIds(siblings.map((s) => s.id));
        }
      } catch {
        setError('Failed to load image');
      } finally {
        setLoading(false);
        initialLoad.current = false;
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId]);

  // Debounced auto-save whenever annotations change
  const save = useCallback(async (anns: Annotation[]) => {
    setSaveState('saving');
    try {
      await fetch(`/api/images/${imageId}/annotations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(anns),
      });
      setSaveState('saved');
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('idle');
    }
  }, [imageId]);

  useEffect(() => {
    if (initialLoad.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(annotations), 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [annotations, save]);

  const handleAnnotationAdded = useCallback((id: string) => {
    setSelectedAnnotation(id);
    setInspectorTab('properties');
  }, [setSelectedAnnotation]);

  const markDone = useCallback(async () => {
    const next = imageStatus === 'labeled' ? 'in_progress' : 'labeled';
    setImageStatus(next);
    await fetch(`/api/images/${imageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => setImageStatus(imageStatus)); // revert on error
  }, [imageId, imageStatus]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); setShortcutsOpen(true); return; }
      if (e.key === 'Escape') { setShortcutsOpen(false); setExportOpen(false); return; }
      if ((e.ctrlKey || e.metaKey) && k === 'e') { e.preventDefault(); setExportOpen(true); return; }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && k === 'z') { e.preventDefault(); redo(); return; }
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); return; }
      if (e.ctrlKey || e.metaKey) return;
      // 1-9: switch active label class
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        const cls = useAnnotationStore.getState().labelClasses[num - 1];
        if (cls) { e.preventDefault(); setActiveClass(cls.id); return; }
      }
      if (k === 's') { e.preventDefault(); setSelectedTool('select'); }
      else if (k === 'b') { e.preventDefault(); setSelectedTool('bbox'); }
      else if (k === 'p') { e.preventDefault(); setSelectedTool('polygon'); }
      else if (k === 'a') { e.preventDefault(); setSelectedTool('ai'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSelectedTool, undo, redo, setActiveClass]);

  if (loading) {
    return (
      <div className="ds" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p className="muted">Loading image…</p>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="ds" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p className="muted" style={{ marginBottom: 16 }}>{error ?? 'Image not found'}</p>
          <button className="btn btn-primary" onClick={() => router.back()}>Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ds ws">
      <TopBar
        onExport={() => setExportOpen(true)}
        onHelp={() => setShortcutsOpen(true)}
        onNewImage={() => projectId ? router.push(`/dataset/${projectId}`) : router.push('/dashboard')}
        saveState={saveState}
        currentIndex={currentIndex >= 0 ? currentIndex : 0}
        totalImages={siblingIds.length || 1}
        onPrev={currentIndex > 0 ? () => router.push(`/workspace/${siblingIds[currentIndex - 1]}`) : undefined}
        onNext={currentIndex < siblingIds.length - 1 ? () => router.push(`/workspace/${siblingIds[currentIndex + 1]}`) : undefined}
        projectId={projectId}
        imageStatus={imageStatus}
        onMarkDone={markDone}
      />
      <ToolRail />
      <main className="canvas-wrap">
        <div className="canvas-host">
          <AnnotationCanvas ref={canvasRef} onAnnotationAdded={handleAnnotationAdded} onAiError={handleAiError} />
        </div>
        <div className="canvas-float cf-tr">
          <div className="float-card">
            <button className="icon-btn sm" title="Fit to screen" aria-label="Fit to screen" onClick={resetZoom}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
            </button>
          </div>
        </div>
      </main>
      <Inspector activeTab={inspectorTab} onTabChange={setInspectorTab} />
      {aiError && (
        <div className="ds-toast-host">
          <div className="ds-toast show">
            <span style={{ color: 'var(--destructive)', flex: 'none', width: 18, height: 18, marginTop: 1 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" /></svg>
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-label-size)', fontWeight: 600, marginBottom: 2 }}>AI select failed</div>
              <div style={{ fontSize: 'var(--text-caption-size)', color: 'var(--muted-foreground)' }}>{aiError}</div>
            </div>
          </div>
        </div>
      )}
      <StatusBar onHelp={() => setShortcutsOpen(true)} />
      <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} getCanvas={() => canvasRef.current?.getCanvas() ?? null} />
    </div>
  );
}
