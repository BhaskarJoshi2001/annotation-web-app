'use client';

import { useRef } from 'react';
import { ImageUploader } from '@/components/image-uploader';
import { AnnotationCanvas, type AnnotationCanvasHandle } from '@/components/annotation-canvas-fabric';
import { Controls } from '@/components/controls';
import { ToolPanel } from '@/components/tool-panel';
import { AnnotationList } from '@/components/annotation-list';
import { ExportPanel } from '@/components/export-panel';
import { useAnnotationStore } from '@/lib/store/annotation-store';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const canvasRef = useRef<AnnotationCanvasHandle>(null);
  const image = useAnnotationStore((state) => state.image);
  const setSelectedTool = useAnnotationStore((state) => state.setSelectedTool);
  const { undo, redo, clearImage } = useAnnotationStore();

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Get canvas ref for export
  const getCanvasRef = () => {
    return { current: canvasRef.current?.getCanvas() || null };
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Tool shortcuts
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        setSelectedTool('select');
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSelectedTool('bbox');
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setSelectedTool('polygon');
      }

      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedTool, undo, redo]);

  if (!hydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Modern Header with Glass-morphism */}
      <header className="surface-elevated-medium border-b border-gray-200 dark:border-gray-700/50 px-6 py-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Annotation Studio
                </h1>
                {image && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                    {image.name} • {image.width} × {image.height}px
                  </p>
                )}
              </div>
            </div>

            {/* New Image Button */}
            {image && (
              <button
                onClick={() => {
                  if (confirm('Clear current image and annotations?')) {
                    clearImage();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-error to-error-dark text-white rounded-xl shadow-soft hover:shadow-medium transition-all duration-200 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                New Image
              </button>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {image && <ExportPanel canvasRef={getCanvasRef()} />}
            {image && <Controls />}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {image ? (
          <>
            {/* Left Sidebar - Tools */}
            <aside className="w-20 md:w-72 surface-elevated border-r border-gray-200 dark:border-gray-700/50 p-4 animate-slide-in-right transition-all duration-300">
              <ToolPanel />
            </aside>

            {/* Canvas Area */}
            <div className="flex-1 relative bg-gray-50 dark:bg-gray-800 overflow-hidden">
              <AnnotationCanvas ref={canvasRef} />
            </div>

            {/* Right Sidebar - Annotations List */}
            <aside className="w-80 lg:w-96 surface-elevated border-l border-gray-200 dark:border-gray-700/50 animate-slide-in-right">
              <AnnotationList />
            </aside>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 animate-fade-in-up">
            <div className="card-hover max-w-lg w-full p-12">
              <ImageUploader />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
