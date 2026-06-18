import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Annotation, ToolType, ZoomState, ImageData, PolygonDrawingState, Point, Polygon } from '../types';

interface HistoryState {
  annotations: Annotation[];
}

interface AnnotationStore {
  // State
  image: ImageData | null;
  annotations: Annotation[];
  selectedTool: ToolType;
  selectedAnnotationId: string | null;
  zoomState: ZoomState;
  polygonDrawing: PolygonDrawingState;

  // History for undo/redo
  history: HistoryState[];
  historyStep: number;

  // Actions with strong typing
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

  // Polygon actions
  startPolygon: (point: Point) => void;
  addPolygonPoint: (point: Point) => void;
  updatePolygonPreview: (point: Point | null) => void;
  completePolygon: (label?: string) => void;
  cancelPolygon: () => void;
}

const MAX_HISTORY = 50;

export const useAnnotationStore = create<AnnotationStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        image: null,
        annotations: [],
        selectedTool: 'select',
        selectedAnnotationId: null,
        zoomState: { scale: 1, position: { x: 0, y: 0 } },
        polygonDrawing: { isDrawing: false, points: [], previewPoint: null },
        history: [{ annotations: [] }],
        historyStep: 0,

        // Helper to add to history
        _addToHistory: (annotations: Annotation[]) => {
          const { history, historyStep } = get();
          const newHistory = history.slice(0, historyStep + 1);
          newHistory.push({ annotations: [...annotations] });

          // Limit history size
          if (newHistory.length > MAX_HISTORY) {
            newHistory.shift();
            set({
              history: newHistory,
              historyStep: newHistory.length - 1,
            });
          } else {
            set({
              history: newHistory,
              historyStep: newHistory.length - 1,
            });
          }
        },

        // Actions implementation
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

        setZoomState: (zoom) =>
          set((state) => ({
            zoomState: { ...state.zoomState, ...zoom },
          })),

        resetZoom: () =>
          set({ zoomState: { scale: 1, position: { x: 0, y: 0 } } }),

        clearAll: () => {
          set({
            annotations: [],
            selectedAnnotationId: null,
            selectedTool: 'select',
          });
          get()._addToHistory([]);
        },

        undo: () => {
          const { history, historyStep } = get();
          if (historyStep > 0) {
            const newStep = historyStep - 1;
            set({
              annotations: [...history[newStep].annotations],
              historyStep: newStep,
              selectedAnnotationId: null,
            });
          }
        },

        redo: () => {
          const { history, historyStep } = get();
          if (historyStep < history.length - 1) {
            const newStep = historyStep + 1;
            set({
              annotations: [...history[newStep].annotations],
              historyStep: newStep,
              selectedAnnotationId: null,
            });
          }
        },

        // Polygon actions
        startPolygon: (point) =>
          set({
            polygonDrawing: { isDrawing: true, points: [point], previewPoint: null },
          }),

        addPolygonPoint: (point) =>
          set((state) => ({
            polygonDrawing: {
              ...state.polygonDrawing,
              points: [...state.polygonDrawing.points, point],
            },
          })),

        updatePolygonPreview: (point) =>
          set((state) => ({
            polygonDrawing: { ...state.polygonDrawing, previewPoint: point },
          })),

        completePolygon: (label) => {
          const state = get();
          if (state.polygonDrawing.points.length < 3) {
            set({ polygonDrawing: { isDrawing: false, points: [], previewPoint: null } });
            return;
          }

          const newAnnotation: Polygon = {
            id: uuidv4(),
            type: 'polygon',
            label: label || `Polygon ${state.annotations.length + 1}`,
            points: state.polygonDrawing.points,
            color: '#10b981',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const newAnnotations = [...state.annotations, newAnnotation];
          set({
            annotations: newAnnotations,
            polygonDrawing: { isDrawing: false, points: [], previewPoint: null },
          });
          get()._addToHistory(newAnnotations);
        },

        cancelPolygon: () =>
          set({
            polygonDrawing: { isDrawing: false, points: [], previewPoint: null },
          }),
      }),
      {
        name: 'annotation-storage',
        version: 1,
        // v0 persisted annotations in canvas-display coordinates. They are
        // incompatible with the current image-space storage, so drop them.
        migrate: (persistedState, version) => {
          if (version < 1) {
            const prev = persistedState as { image?: ImageData | null } | null;
            return {
              image: prev?.image ?? null,
              annotations: [],
              history: [{ annotations: [] }],
              historyStep: 0,
            };
          }
          return persistedState as AnnotationStore;
        },
        partialize: (state) => ({
          annotations: state.annotations,
          image: state.image,
          history: state.history,
          historyStep: state.historyStep,
        }),
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...(persistedState as object),
          // Ensure polygonDrawing always exists with correct shape
          polygonDrawing: { isDrawing: false, points: [], previewPoint: null },
        }),
      }
    )
  )
);
