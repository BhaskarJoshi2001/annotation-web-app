'use client';

import { useAnnotationStore } from '@/lib/store/annotation-store';

export function Controls() {
  const { zoomState, setZoomState, resetZoom, undo, redo, historyStep, history } =
    useAnnotationStore();

  const canUndo = historyStep > 0;
  const canRedo = historyStep < history.length - 1;

  const handleZoomIn = (): void => {
    setZoomState({ scale: Math.min(zoomState.scale * 1.2, 5) });
  };

  const handleZoomOut = (): void => {
    setZoomState({ scale: Math.max(zoomState.scale / 1.2, 0.1) });
  };

  return (
    <div className="flex items-center gap-3">
      {/* Undo/Redo Group */}
      <div className="surface-elevated-medium rounded-2xl p-1.5 flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
            canUndo
              ? 'hover:bg-primary-50 dark:hover:bg-primary-950/30 text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-primary-300 active:scale-95'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          <span className="text-sm">Undo</span>
          {canUndo && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse"></span>
          )}
        </button>

        <div className="w-px h-6 bg-outline"></div>

        <button
          onClick={redo}
          disabled={!canRedo}
          className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
            canRedo
              ? 'hover:bg-primary-50 dark:hover:bg-primary-950/30 text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-primary-300 active:scale-95'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Shift+Z)"
        >
          <span className="text-sm">Redo</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
          {canRedo && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse"></span>
          )}
        </button>
      </div>

      {/* Zoom Controls Group */}
      <div className="surface-elevated-medium rounded-2xl p-1.5 flex items-center gap-1">
        <button
          onClick={handleZoomOut}
          className="group px-3 py-2.5 rounded-xl font-medium transition-all duration-200 hover:bg-primary-50 dark:hover:bg-primary-950/30 text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-primary-300 active:scale-95"
          title="Zoom Out (-)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>

        <div className="px-3 py-2 min-w-[70px] text-center">
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {Math.round(zoomState.scale * 100)}%
          </div>
        </div>

        <button
          onClick={handleZoomIn}
          className="group px-3 py-2.5 rounded-xl font-medium transition-all duration-200 hover:bg-primary-50 dark:hover:bg-primary-950/30 text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-primary-300 active:scale-95"
          title="Zoom In (+)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>

        <div className="w-px h-6 bg-outline"></div>

        <button
          onClick={resetZoom}
          className="group px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 hover:bg-primary-50 dark:hover:bg-primary-950/30 text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-primary-300 active:scale-95 flex items-center gap-2"
          title="Reset Zoom (0)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>
      </div>
    </div>
  );
}
