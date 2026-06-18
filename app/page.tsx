'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageUploader } from '@/components/image-uploader';
import { AnnotationCanvas, type AnnotationCanvasHandle } from '@/components/annotation-canvas-fabric';
import { useAnnotationStore } from '@/lib/store/annotation-store';
import { TopBar } from '@/components/workspace/top-bar';
import { ToolRail } from '@/components/workspace/tool-rail';
import { Inspector } from '@/components/workspace/inspector';
import { StatusBar } from '@/components/workspace/status-bar';
import { ShortcutsOverlay } from '@/components/workspace/shortcuts-overlay';
import { ExportDialog } from '@/components/workspace/export-dialog';
import './ds.css';
import './workspace.css';

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const canvasRef = useRef<AnnotationCanvasHandle>(null);
  const image = useAnnotationStore((s) => s.image);
  const setSelectedTool = useAnnotationStore((s) => s.setSelectedTool);
  const undo = useAnnotationStore((s) => s.undo);
  const redo = useAnnotationStore((s) => s.redo);
  const clearImage = useAnnotationStore((s) => s.clearImage);
  const resetZoom = useAnnotationStore((s) => s.resetZoom);

  const [exportOpen, setExportOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  // Global keyboard shortcuts (tools, undo/redo, export, help). Canvas-local
  // keys (Space pan, Esc/Enter/Delete) are handled inside the canvas component.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const el = e.target;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return;
      const k = e.key.toLowerCase();

      if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); setShortcutsOpen(true); return; }
      if (e.key === 'Escape') { setShortcutsOpen(false); setExportOpen(false); return; }
      if ((e.ctrlKey || e.metaKey) && k === 'e') { e.preventDefault(); setExportOpen(true); return; }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && k === 'z') { e.preventDefault(); redo(); return; }
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); return; }
      if (e.ctrlKey || e.metaKey) return;

      if (k === 's') { e.preventDefault(); setSelectedTool('select'); }
      else if (k === 'b') { e.preventDefault(); setSelectedTool('bbox'); }
      else if (k === 'p') { e.preventDefault(); setSelectedTool('polygon'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSelectedTool, undo, redo]);

  const getCanvas = () => canvasRef.current?.getCanvas() ?? null;

  const handleNewImage = (): void => {
    if (confirm('Clear the current image and all annotations?')) clearImage();
  };

  if (!hydrated) {
    return (
      <div className="ds" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="ds" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--space-8)' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          <ImageUploader />
        </div>
      </div>
    );
  }

  return (
    <div className="ds ws">
      <TopBar
        onExport={() => setExportOpen(true)}
        onHelp={() => setShortcutsOpen(true)}
        onNewImage={handleNewImage}
      />
      <ToolRail />
      <main className="canvas-wrap">
        <div className="canvas-host">
          <AnnotationCanvas ref={canvasRef} />
        </div>
        <div className="canvas-float cf-tr">
          <div className="float-card">
            <button className="icon-btn sm" title="Fit to screen" aria-label="Fit to screen" onClick={resetZoom}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
            </button>
          </div>
        </div>
      </main>
      <Inspector />
      <StatusBar onHelp={() => setShortcutsOpen(true)} />

      <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} getCanvas={getCanvas} />
    </div>
  );
}
