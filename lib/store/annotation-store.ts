import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Annotation, LabelClass, ToolType, ZoomState, ImageData, PolygonDrawingState, Point, Polygon } from '../types';

const CLASS_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#84cc16', '#14b8a6',
];

interface HistoryState {
  annotations: Annotation[];
}

interface AnnotationStore {
  image: ImageData | null;
  annotations: Annotation[];
  labelClasses: LabelClass[];
  activeClassId: string | null;
  selectedTool: ToolType;
  selectedAnnotationId: string | null;
  zoomState: ZoomState;
  polygonDrawing: PolygonDrawingState;
  history: HistoryState[];
  historyStep: number;

  setImage: (image: ImageData) => void;
  clearImage: () => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: <T extends Annotation>(id: string, updates: Partial<T>) => void;
  deleteAnnotation: (id: string) => void;
  setSelectedTool: (tool: ToolType) => void;
  setSelectedAnnotation: (id: string | null) => void;
  setZoomState: (zoom: Partial<ZoomState>) => void;
  resetZoom: () => void;
  clearAll: () => void;
  undo: () => void;
  redo: () => void;
  _addToHistory: (annotations: Annotation[]) => void;

  addLabelClass: (name: string, color?: string) => LabelClass;
  updateLabelClass: (id: string, updates: Partial<Pick<LabelClass, 'name' | 'color'>>) => void;
  deleteLabelClass: (id: string) => void;
  setActiveClass: (id: string | null) => void;
  getEffectiveClassId: () => string;

  startPolygon: (point: Point) => void;
  addPolygonPoint: (point: Point) => void;
  updatePolygonPreview: (point: Point | null) => void;
  completePolygon: () => void;
  cancelPolygon: () => void;
}

const MAX_HISTORY = 50;

export const useAnnotationStore = create<AnnotationStore>()(
  devtools(
    persist(
      (set, get) => ({
        image: null,
        annotations: [],
        labelClasses: [],
        activeClassId: null,
        selectedTool: 'select',
        selectedAnnotationId: null,
        zoomState: { scale: 1, position: { x: 0, y: 0 } },
        polygonDrawing: { isDrawing: false, points: [], previewPoint: null },
        history: [{ annotations: [] }],
        historyStep: 0,

        _addToHistory: (annotations) => {
          const { history, historyStep } = get();
          const newHistory = history.slice(0, historyStep + 1);
          newHistory.push({ annotations: [...annotations] });
          if (newHistory.length > MAX_HISTORY) {
            newHistory.shift();
            set({ history: newHistory, historyStep: newHistory.length - 1 });
          } else {
            set({ history: newHistory, historyStep: newHistory.length - 1 });
          }
        },

        setImage: (image) => set({
          image,
          annotations: [],
          history: [{ annotations: [] }],
          historyStep: 0,
          selectedAnnotationId: null,
        }),

        clearImage: () => set({
          image: null,
          annotations: [],
          history: [{ annotations: [] }],
          historyStep: 0,
          selectedAnnotationId: null,
        }),

        addAnnotation: (annotation) => {
          const newAnnotations = [...get().annotations, annotation];
          set({ annotations: newAnnotations });
          get()._addToHistory(newAnnotations);
        },

        updateAnnotation: (id, updates) => {
          const newAnnotations = get().annotations.map((ann) =>
            ann.id === id ? { ...ann, ...updates, updatedAt: new Date() } as Annotation : ann
          );
          set({ annotations: newAnnotations });
          get()._addToHistory(newAnnotations);
        },

        deleteAnnotation: (id) => {
          const newAnnotations = get().annotations.filter((ann) => ann.id !== id);
          set({
            annotations: newAnnotations,
            selectedAnnotationId: get().selectedAnnotationId === id ? null : get().selectedAnnotationId,
          });
          get()._addToHistory(newAnnotations);
        },

        setSelectedTool: (tool) => set({ selectedTool: tool }),
        setSelectedAnnotation: (id) => set({ selectedAnnotationId: id }),
        setZoomState: (zoom) => set((state) => ({ zoomState: { ...state.zoomState, ...zoom } })),
        resetZoom: () => set({ zoomState: { scale: 1, position: { x: 0, y: 0 } } }),

        clearAll: () => {
          set({ annotations: [], selectedAnnotationId: null, selectedTool: 'select' });
          get()._addToHistory([]);
        },

        undo: () => {
          const { history, historyStep } = get();
          if (historyStep > 0) {
            const newStep = historyStep - 1;
            set({ annotations: [...history[newStep].annotations], historyStep: newStep, selectedAnnotationId: null });
          }
        },

        redo: () => {
          const { history, historyStep } = get();
          if (historyStep < history.length - 1) {
            const newStep = historyStep + 1;
            set({ annotations: [...history[newStep].annotations], historyStep: newStep, selectedAnnotationId: null });
          }
        },

        addLabelClass: (name, color) => {
          const { labelClasses, activeClassId } = get();
          const nextColor = color ?? CLASS_COLORS[labelClasses.length % CLASS_COLORS.length];
          const newClass: LabelClass = { id: uuidv4(), name: name.trim(), color: nextColor };
          const newClasses = [...labelClasses, newClass];
          set({
            labelClasses: newClasses,
            activeClassId: activeClassId ?? newClass.id,
          });
          return newClass;
        },

        updateLabelClass: (id, updates) => {
          set((state) => ({
            labelClasses: state.labelClasses.map((c) => c.id === id ? { ...c, ...updates } : c),
          }));
        },

        deleteLabelClass: (id) => {
          const { labelClasses, activeClassId } = get();
          const remaining = labelClasses.filter((c) => c.id !== id);
          set({
            labelClasses: remaining,
            activeClassId: activeClassId === id ? (remaining[0]?.id ?? null) : activeClassId,
          });
        },

        setActiveClass: (id) => set({ activeClassId: id }),

        // Returns a valid classId to use when drawing. Creates a default class if none exist.
        getEffectiveClassId: () => {
          const { activeClassId, labelClasses, addLabelClass } = get();
          if (activeClassId && labelClasses.find((c) => c.id === activeClassId)) return activeClassId;
          if (labelClasses.length > 0) {
            set({ activeClassId: labelClasses[0].id });
            return labelClasses[0].id;
          }
          const defaultClass = addLabelClass('Object');
          return defaultClass.id;
        },

        startPolygon: (point) => set({ polygonDrawing: { isDrawing: true, points: [point], previewPoint: null } }),

        addPolygonPoint: (point) => set((state) => ({
          polygonDrawing: { ...state.polygonDrawing, points: [...state.polygonDrawing.points, point] },
        })),

        updatePolygonPreview: (point) => set((state) => ({
          polygonDrawing: { ...state.polygonDrawing, previewPoint: point },
        })),

        completePolygon: () => {
          const state = get();
          if (state.polygonDrawing.points.length < 3) {
            set({ polygonDrawing: { isDrawing: false, points: [], previewPoint: null } });
            return;
          }
          const classId = state.getEffectiveClassId();
          const newAnnotation: Polygon = {
            id: uuidv4(),
            type: 'polygon',
            classId,
            points: state.polygonDrawing.points,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          const newAnnotations = [...state.annotations, newAnnotation];
          set({ annotations: newAnnotations, polygonDrawing: { isDrawing: false, points: [], previewPoint: null } });
          get()._addToHistory(newAnnotations);
        },

        cancelPolygon: () => set({ polygonDrawing: { isDrawing: false, points: [], previewPoint: null } }),
      }),
      {
        name: 'annotation-storage',
        version: 2,
        migrate: (persistedState, version) => {
          if (version < 2) {
            // Schema changed: annotations now use classId instead of label/color
            const prev = persistedState as { image?: ImageData | null } | null;
            return {
              image: prev?.image ?? null,
              annotations: [],
              labelClasses: [],
              activeClassId: null,
              history: [{ annotations: [] }],
              historyStep: 0,
            };
          }
          return persistedState as AnnotationStore;
        },
        partialize: (state) => ({
          annotations: state.annotations,
          image: state.image,
          labelClasses: state.labelClasses,
          activeClassId: state.activeClassId,
          history: state.history,
          historyStep: state.historyStep,
        }),
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...(persistedState as object),
          polygonDrawing: { isDrawing: false, points: [], previewPoint: null },
        }),
      }
    )
  )
);
