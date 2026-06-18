'use client';

import { useState } from 'react';
import type { Canvas } from 'fabric';
import { useAnnotationStore } from '@/lib/store/annotation-store';
import { useExport } from '@/lib/hooks/use-export';
import type { ExportFormat } from '@/lib/types';

interface FormatOption {
  key: ExportFormat;
  name: string;
  desc: string;
}

const FORMATS: FormatOption[] = [
  { key: 'coco', name: 'COCO JSON', desc: 'Single .json · object detection' },
  { key: 'yolo', name: 'YOLO', desc: '.txt per image + classes.txt' },
  { key: 'json', name: 'Custom JSON', desc: 'Full annotation model' },
  { key: 'image', name: 'Annotated PNG', desc: 'Canvas rendered at 2×' },
];

export function ExportDialog({
  open,
  onClose,
  getCanvas,
}: {
  open: boolean;
  onClose: () => void;
  getCanvas: () => Canvas | null;
}) {
  const image = useAnnotationStore((s) => s.image);
  const annotations = useAnnotationStore((s) => s.annotations);
  const { exportAnnotations, isExporting, error } = useExport();
  const [selected, setSelected] = useState<ExportFormat>('coco');

  if (!open) return null;

  const canExport = image !== null && annotations.length > 0;

  const exportImage = (): void => {
    const canvas = getCanvas();
    if (!canvas || !image) return;
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    const link = document.createElement('a');
    link.download = `${image.filename.split('.')[0]}_annotated.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (): Promise<void> => {
    if (!canExport) return;
    try {
      if (selected === 'image') exportImage();
      else await exportAnnotations(selected);
      onClose();
    } catch {
      /* error surfaced below via useExport */
    }
  };

  return (
    <div
      className="scrim open"
      role="dialog"
      aria-modal="true"
      aria-label="Export dataset"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dialog" style={{ maxWidth: 540 }}>
        <div style={{ padding: 'var(--space-6) var(--space-6) var(--space-4)' }}>
          <div className="row spread" style={{ marginBottom: 'var(--space-3)' }}>
            <span className="avatar lg" style={{ borderRadius: 'var(--radius-lg)', background: 'var(--primary-container)', color: 'var(--primary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            </span>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
            </button>
          </div>
          <h2 className="t-title-lg" style={{ margin: '0 0 6px' }}>Export annotations</h2>
          <p className="muted" style={{ margin: 0, fontSize: 'var(--text-body-size)' }}>
            {canExport
              ? `Choose a format for ${annotations.length} annotation${annotations.length === 1 ? '' : 's'}.`
              : 'Add at least one annotation to export.'}
          </p>
        </div>
        <div style={{ padding: '0 var(--space-6) var(--space-5)' }}>
          <div className="t-overline" style={{ color: 'var(--subtle-foreground)', marginBottom: 10 }}>Format</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {FORMATS.map((f) => {
              const sel = selected === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setSelected(f.key)}
                  style={{
                    textAlign: 'left', padding: 14, cursor: 'pointer',
                    border: `1.5px solid ${sel ? 'var(--primary)' : 'var(--outline)'}`,
                    background: sel ? 'var(--primary-subtle)' : 'var(--surface)',
                    borderRadius: 'var(--radius-lg)',
                    transition: 'all var(--duration-fast) var(--ease-standard)',
                  }}
                >
                  <div className="row spread" style={{ marginBottom: 4 }}>
                    <span className="t-label">{f.name}</span>
                    {sel && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><path d="M5 12l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <div className="t-caption" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{f.desc}</div>
                </button>
              );
            })}
          </div>
          {error && (
            <p style={{ color: 'var(--destructive)', fontSize: 'var(--text-caption-size)', marginTop: 12 }}>{error.message}</p>
          )}
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--outline)', background: 'var(--surface-variant)', borderRadius: '0 0 var(--radius-2xl) var(--radius-2xl)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleExport} disabled={!canExport || isExporting}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            {isExporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
