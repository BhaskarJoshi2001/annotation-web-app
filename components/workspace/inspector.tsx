'use client';

import { useState } from 'react';
import { useAnnotationStore } from '@/lib/store/annotation-store';
import type { Annotation, BoundingBox, LabelClass, Polygon } from '@/lib/types';

type Tab = 'annotations' | 'properties' | 'classes';

function dims(a: Annotation): string {
  if (a.type === 'bbox') {
    const b = a as BoundingBox;
    return `${Math.round(b.width)}×${Math.round(b.height)}px`;
  }
  return `polygon · ${(a as Polygon).points.length} pts`;
}

function ClassRow({
  cls,
  isActive,
  count,
  onActivate,
  onDelete,
  onUpdate,
}: {
  cls: LabelClass;
  isActive: boolean;
  count: number;
  onActivate: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Pick<LabelClass, 'name' | 'color'>>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cls.name);

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== cls.name) onUpdate({ name: trimmed });
    setEditing(false);
  };

  return (
    <div
      className={`class-item${isActive ? ' active' : ''}`}
      onClick={onActivate}
      style={{ cursor: 'pointer' }}
    >
      <input
        type="color"
        value={cls.color}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onUpdate({ color: e.target.value })}
        aria-label="Class color"
        style={{ width: 18, height: 18, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', flex: 'none', background: 'transparent' }}
      />
      {editing ? (
        <input
          className="input"
          value={draft}
          autoFocus
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
          style={{ flex: 1, fontSize: 'var(--text-label-size)', height: 26 }}
        />
      ) : (
        <span
          className="nm"
          onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); setDraft(cls.name); }}
          title="Double-click to rename"
          style={{ flex: 1 }}
        >
          {cls.name}
        </span>
      )}
      {isActive && (
        <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.03em' }}>ACTIVE</span>
      )}
      <span className="ct">{count}</span>
      <span
        className="icon-btn sm"
        role="button"
        tabIndex={-1}
        aria-label="Delete class"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </span>
    </div>
  );
}

function AddClassForm({ onAdd }: { onAdd: (name: string, color: string) => void }) {
  const labelClasses = useAnnotationStore((s) => s.labelClasses);
  const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLORS[labelClasses.length % DEFAULT_COLORS.length]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, color);
    setName('');
    setColor(DEFAULT_COLORS[(labelClasses.length + 1) % DEFAULT_COLORS.length]);
  };

  return (
    <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--outline)' }}>
      <div className="row" style={{ gap: 8, marginBottom: 8 }}>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          aria-label="New class color"
          style={{ width: 32, height: 32, padding: 0, border: '1px solid var(--outline)', borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer', flex: 'none' }}
        />
        <input
          className="input"
          placeholder="Class name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          style={{ flex: 1 }}
        />
      </div>
      <button
        className="btn btn-tonal btn-sm btn-block"
        onClick={submit}
        disabled={!name.trim()}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        Add class
      </button>
    </div>
  );
}

export function Inspector() {
  const annotations = useAnnotationStore((s) => s.annotations);
  const labelClasses = useAnnotationStore((s) => s.labelClasses);
  const activeClassId = useAnnotationStore((s) => s.activeClassId);
  const selectedId = useAnnotationStore((s) => s.selectedAnnotationId);
  const setSelected = useAnnotationStore((s) => s.setSelectedAnnotation);
  const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation);
  const deleteAnnotation = useAnnotationStore((s) => s.deleteAnnotation);
  const addLabelClass = useAnnotationStore((s) => s.addLabelClass);
  const updateLabelClass = useAnnotationStore((s) => s.updateLabelClass);
  const deleteLabelClass = useAnnotationStore((s) => s.deleteLabelClass);
  const setActiveClass = useAnnotationStore((s) => s.setActiveClass);

  const [tab, setTab] = useState<Tab>('annotations');

  const selected = annotations.find((a) => a.id === selectedId) ?? null;

  const classCountMap = new Map<string, number>();
  annotations.forEach((a) => classCountMap.set(a.classId, (classCountMap.get(a.classId) ?? 0) + 1));

  const getClassName = (classId: string) => labelClasses.find((c) => c.id === classId)?.name ?? '(unknown)';
  const getClassColor = (classId: string) => labelClasses.find((c) => c.id === classId)?.color ?? '#3b82f6';

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
                <span className="sw" style={{ background: getClassColor(a.classId) }} />
                <div className="meta">
                  <div className="nm">{getClassName(a.classId)}<span className="type">· {a.type === 'bbox' ? 'box' : 'polygon'}</span></div>
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
                <div className="gh">Class</div>
                <div className="row" style={{ gap: 10 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 3, background: getClassColor(selected.classId), flex: 'none', display: 'inline-block' }} />
                  {labelClasses.length > 0 ? (
                    <select
                      className="input"
                      value={selected.classId}
                      onChange={(e) => updateAnnotation(selected.id, { classId: e.target.value })}
                      style={{ flex: 1 }}
                    >
                      {labelClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ flex: 1, fontSize: 'var(--text-caption-size)', color: 'var(--subtle-foreground)' }}>
                      No classes defined — add one in the Classes tab.
                    </span>
                  )}
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
        <div className="insp-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-head">
            <span className="t">Label classes</span>
            <span className="ct">{labelClasses.length} class{labelClasses.length === 1 ? '' : 'es'}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {labelClasses.length === 0 ? (
              <div className="empty" style={{ padding: 'var(--space-10) var(--space-5)' }}>
                <div className="art" style={{ width: 56, height: 56 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" /></svg>
                </div>
                <h3 style={{ fontSize: 'var(--text-label-size)' }}>No classes yet</h3>
                <p style={{ fontSize: 'var(--text-caption-size)' }}>Define classes first, then draw annotations. Each annotation belongs to a class.</p>
              </div>
            ) : (
              labelClasses.map((cls) => (
                <ClassRow
                  key={cls.id}
                  cls={cls}
                  isActive={cls.id === activeClassId}
                  count={classCountMap.get(cls.id) ?? 0}
                  onActivate={() => setActiveClass(cls.id)}
                  onDelete={() => deleteLabelClass(cls.id)}
                  onUpdate={(updates) => updateLabelClass(cls.id, updates)}
                />
              ))
            )}
          </div>
          <AddClassForm onAdd={(name, color) => addLabelClass(name, color)} />
        </div>
      )}
    </aside>
  );
}
