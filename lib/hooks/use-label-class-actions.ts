'use client';

import { useCallback } from 'react';
import { useAnnotationStore } from '@/lib/store/annotation-store';
import type { LabelClass } from '@/lib/types';

export function useLabelClassActions() {
  const projectId = useAnnotationStore((s) => s.projectId);
  const _insertLabelClass = useAnnotationStore((s) => s._insertLabelClass);
  const updateLabelClass = useAnnotationStore((s) => s.updateLabelClass);
  const deleteLabelClass = useAnnotationStore((s) => s.deleteLabelClass);
  const addLabelClass = useAnnotationStore((s) => s.addLabelClass);

  const add = useCallback(async (name: string, color: string): Promise<LabelClass> => {
    if (!projectId) return addLabelClass(name, color);

    const res = await fetch(`/api/projects/${projectId}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) throw new Error('Failed to create class');
    const cls = await res.json() as LabelClass;
    _insertLabelClass(cls);
    return cls;
  }, [projectId, _insertLabelClass, addLabelClass]);

  const update = useCallback(async (id: string, updates: Partial<Pick<LabelClass, 'name' | 'color'>>) => {
    updateLabelClass(id, updates);
    if (!projectId) return;
    await fetch(`/api/projects/${projectId}/classes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => { /* optimistic — ignore network errors */ });
  }, [projectId, updateLabelClass]);

  const remove = useCallback(async (id: string) => {
    deleteLabelClass(id);
    if (!projectId) return;
    await fetch(`/api/projects/${projectId}/classes/${id}`, { method: 'DELETE' })
      .catch(() => { /* optimistic */ });
  }, [projectId, deleteLabelClass]);

  return { add, update, remove };
}
