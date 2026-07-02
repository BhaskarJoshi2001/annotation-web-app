'use client';

import type { ReactNode } from 'react';
import { useAnnotationStore } from '@/lib/store/annotation-store';
import type { ToolType } from '@/lib/types';

interface Tool {
  type: ToolType;
  label: string;
  shortcut: string;
  icon: ReactNode;
}

const TOOLS: Tool[] = [
  {
    type: 'select', label: 'Select & move', shortcut: 'S',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 3l7.5 18 2.3-7.2L21 11.5z" /></svg>,
  },
  {
    type: 'bbox', label: 'Bounding box', shortcut: 'B',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="1.5" strokeDasharray="3 2.5" /></svg>,
  },
  {
    type: 'polygon', label: 'Polygon', shortcut: 'P',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3l8 5.5-3 10.5H7L4 8.5z" /><circle cx="12" cy="3" r="1.6" fill="currentColor" /><circle cx="20" cy="8.5" r="1.6" fill="currentColor" /><circle cx="4" cy="8.5" r="1.6" fill="currentColor" /></svg>,
  },
];

export function ToolRail() {
  const selectedTool = useAnnotationStore((s) => s.selectedTool);
  const setSelectedTool = useAnnotationStore((s) => s.setSelectedTool);
  const labelClasses = useAnnotationStore((s) => s.labelClasses);
  const activeClassId = useAnnotationStore((s) => s.activeClassId);
  const setActiveClass = useAnnotationStore((s) => s.setActiveClass);

  return (
    <nav className="rail" aria-label="Tools">
      <div className="group">
        {TOOLS.map((tool) => (
          <button
            key={tool.type}
            className={`tool${selectedTool === tool.type ? ' active' : ''}`}
            aria-label={tool.label}
            aria-pressed={selectedTool === tool.type}
            onClick={() => setSelectedTool(tool.type)}
          >
            {tool.icon}
            <span className="tt">{tool.label}<kbd>{tool.shortcut}</kbd></span>
          </button>
        ))}
      </div>

      {/* Active class strip */}
      {labelClasses.length > 0 && (
        <>
          <div className="sep" />
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px', overflowY: 'auto', maxHeight: 260 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted-foreground)', textAlign: 'center', marginBottom: 4, textTransform: 'uppercase' }}>
              Class
            </div>
            {labelClasses.slice(0, 9).map((cls, i) => {
              const isActive = cls.id === activeClassId;
              return (
                <button
                  key={cls.id}
                  onClick={() => setActiveClass(cls.id)}
                  title={`${cls.name} — press ${i + 1}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 8px', borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'var(--primary-subtle)' : 'transparent',
                    border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                    cursor: 'pointer', width: '100%', textAlign: 'left',
                    transition: 'background 0.12s',
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: cls.color, flex: 'none', display: 'inline-block' }} />
                  <span style={{ flex: 1, fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--primary)' : 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 52 }}>
                    {cls.name}
                  </span>
                  <kbd style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)', background: 'var(--surface-variant)', borderRadius: 3, padding: '1px 3px', flex: 'none' }}>
                    {i + 1}
                  </kbd>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="rail-foot">
        <button className="tool" aria-label="Auto-label (coming soon)" disabled title="Auto-label — coming soon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" /><path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></svg>
          <span className="tt">Auto-label (AI)<kbd>soon</kbd></span>
        </button>
      </div>
    </nav>
  );
}
