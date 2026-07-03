'use client';

import { useAnnotationStore } from '@/lib/store/annotation-store';
import type { ToolType } from '@/lib/types';

const TOOL_NAMES: Record<ToolType, string> = {
  select: 'Select',
  bbox: 'Bounding box',
  polygon: 'Polygon',
  ai: 'AI select',
};

export function StatusBar({ onHelp }: { onHelp: () => void }) {
  const image = useAnnotationStore((s) => s.image);
  const annotations = useAnnotationStore((s) => s.annotations);
  const selectedTool = useAnnotationStore((s) => s.selectedTool);

  return (
    <footer className="status">
      <div className="grp">
        <span className="item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /></svg>
          <span className="mono">{image ? `${image.width} × ${image.height}` : '—'}</span>
        </span>
        <span className="vsep" />
        <span className="item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="1.5" strokeDasharray="3 2.5" /></svg>
          <span className="mono">{annotations.length}</span> annotations
        </span>
      </div>
      <div className="grp">
        <span className="item">Tool: <span className="mono" style={{ marginLeft: 4 }}>{TOOL_NAMES[selectedTool]}</span></span>
        <span className="vsep" />
        <span className="item">
          Press{' '}
          <kbd
            className="key"
            role="button"
            tabIndex={0}
            onClick={onHelp}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHelp(); } }}
            style={{ cursor: 'pointer' }}
            aria-label="Open keyboard shortcuts"
          >?</kbd>
          <span style={{ marginLeft: 4 }}>for shortcuts</span>
        </span>
      </div>
    </footer>
  );
}
