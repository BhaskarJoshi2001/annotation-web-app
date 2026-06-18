'use client';

import { useState } from 'react';
import { useAnnotationStore } from '@/lib/store/annotation-store';
import type { Annotation, BoundingBox, Polygon } from '@/lib/types';

type Tab = 'annotations' | 'properties' | 'classes';

function dims(a: Annotation): string {
  if (a.type === 'bbox') {
    const b = a as BoundingBox;
    return `${Math.round(b.width)}×${Math.round(b.height)}px`;
  }
  return `polygon · ${(a as Polygon).points.length} pts`;
}

export function Inspector() {
  const annotations = useAnnotationStore((s) => s.annotations);
  const selectedId = useAnnotationStore((s) => s.selectedAnnotationId);
  const setSelected = useAnnotationStore((s) => s.setSelectedAnnotation);
  const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation);
  const deleteAnnotation = useAnnotationStore((s) => s.deleteAnnotation);

  const [tab, setTab] = useState<Tab>('annotations');

  const selected = annotations.find((a) => a.id === selectedId) ?? null;

  // Derive a class manager view from the labels in use.
  const classMap = new Map<string, { label: string; color: string; count: number }>();
  annotations.forEach((a) => {
    const ex = classMap.get(a.label);
    if (ex) ex.count += 1;
    else classMap.set(a.label, { label: a.label, color: a.color, count: 1 });
  });
  const classes = [...classMap.values()];

  const selectRow = (id: string) => { setSelected(id); setTab('properties'); };

  return (
    <aside className="inspect">
      <div className="insp-tabs" role="tablist">
        {(['annotations', 'properties', 'classes'] as Tab[]).map((t) => (
          <button
            key={t}
            className="insp-tab"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {t === 'annotations' ? 'Annotations' : t === 'properties' ? 'Properties' : 'Classes'}
          </button>
        ))}
      </div>

      {/* ANNOTATIONS */}
      {tab === 'annotations' && (
        <div className="insp-panel">
          <div className="panel-head">
            <span className="t">On this image</span>
            <span className="ct">{annotations.length} object{annotations.length === 1 ? '' : 's'}</span>
          </div>
          {annotations.length === 0 ? (
            <div className="empty" style={{ padding: 'var(--space-12) var(--space-5)' }}>
              <div className="art" style={{ width: 56, height: 56 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="4" width="16" height="16" rx="1.5" strokeDasharray="3 2.5" /></svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-label-size)' }}>No annotations yet</h3>
              <p style={{ fontSize: 'var(--text-caption-size)' }}>Pick a tool and draw on the image to add your first object.</p>
            </div>
          ) : (
            annotations.map((a) => (
              <button
                key={a.id}
                className={`ann${a.id === selectedId ? ' selected' : ''}`}
                onClick={() => selectRow(a.id)}
              >
                <span className="sw" style={{ background: a.color }} />
                <div className="meta">
                  <div className="nm">{a.label}<span className="type">· {a.type === 'bbox' ? 'box' : 'polygon'}</span></div>
                  <div className="dim">{dims(a)}</div>
                </div>
                <div className="act">
                  <span
                    className="icon-btn sm"
                    role="button"
                    tabIndex={-1}
                    aria-label="Delete"
                    onClick={(e) => { e.stopPropagation(); deleteAnnotation(a.id); }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* PROPERTIES */}
      {tab === 'properties' && (
        <div className="insp-panel">
          <div className="panel-head"><span className="t">Selected object</span></div>
          {!selected ? (
            <div className="empty" style={{ padding: 'var(--space-12) var(--space-5)' }}>
              <div className="art" style={{ width: 56, height: 56 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 3l7.5 18 2.3-7.2L21 11.5z" /></svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-label-size)' }}>No selection</h3>
              <p style={{ fontSize: 'var(--text-caption-size)' }}>Select an object on the canvas or list to edit its properties.</p>
            </div>
          ) : (
            <>
              <div className="prop-group">
                <div className="gh">Label</div>
                <div className="row" style={{ gap: 10 }}>
                  <input
                    type="color"
                    value={selected.color}
                    onChange={(e) => updateAnnotation(selected.id, { color: e.target.value })}
                    aria-label="Color"
                    style={{ width: 34, height: 34, padding: 0, border: '1px solid var(--outline)', borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer', flex: 'none' }}
                  />
                  <input
                    className="input"
                    value={selected.label}
                    onChange={(e) => updateAnnotation(selected.id, { label: e.target.value })}
                    aria-label="Label"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="prop-group">
                <div className="gh">Geometry · px</div>
                {selected.type === 'bbox' ? (
                  <>
                    <div className="prop-row">
                      <div className="prop"><label>X</label><div className="v">{Math.round((selected as BoundingBox).x)}</div></div>
                      <div className="prop"><label>Y</label><div className="v">{Math.round((selected as BoundingBox).y)}</div></div>
                    </div>
                    <div className="prop-row">
                      <div className="prop"><label>Width</label><div className="v">{Math.round((selected as BoundingBox).width)}</div></div>
                      <div className="prop"><label>Height</label><div className="v">{Math.round((selected as BoundingBox).height)}</div></div>
                    </div>
                  </>
                ) : (
                  <div className="prop-row">
                    <div className="prop"><label>Type</label><div className="v">polygon</div></div>
                    <div className="prop"><label>Vertices</label><div className="v">{(selected as Polygon).points.length}</div></div>
                  </div>
                )}
              </div>

              <div className="prop-group" style={{ border: 0 }}>
                <button
                  className="btn btn-secondary btn-sm btn-block"
                  onClick={() => deleteAnnotation(selected.id)}
                  style={{ color: 'var(--destructive)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                  Delete object
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* CLASSES */}
      {tab === 'classes' && (
        <div className="insp-panel">
          <div className="panel-head">
            <span className="t">Class manager</span>
            <span className="ct">{classes.length} class{classes.length === 1 ? '' : 'es'}</span>
          </div>
          {classes.length === 0 ? (
            <div className="empty" style={{ padding: 'var(--space-12) var(--space-5)' }}>
              <div className="art" style={{ width: 56, height: 56 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /></svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-label-size)' }}>No classes yet</h3>
              <p style={{ fontSize: 'var(--text-caption-size)' }}>Classes appear here as you label objects.</p>
            </div>
          ) : (
            classes.map((c) => (
              <div className="class-item" key={c.label}>
                <span className="sw" style={{ background: c.color }} />
                <span className="nm">{c.label}</span>
                <span className="ct">{c.count}</span>
              </div>
            ))
          )}
          <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <button className="btn btn-tonal btn-sm btn-block" disabled title="Custom classes — coming soon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
              New class
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
