'use client';

import { useAnnotationStore } from '@/lib/store/annotation-store';
import { useEffect, useState } from 'react';

export function PolygonInstructions() {
  const [mounted, setMounted] = useState(false);
  const selectedTool = useAnnotationStore((state) => state.selectedTool);
  const polygonDrawing = useAnnotationStore((state) => state.polygonDrawing);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything during SSR or if tool is not polygon
  if (!mounted || selectedTool !== 'polygon') {
    return null;
  }

  const pointCount = polygonDrawing?.points?.length ?? 0;
  const isDrawing = polygonDrawing?.isDrawing ?? false;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-lg shadow-lg border border-gray-200 z-10">
      <div className="text-sm space-y-1">
        {!isDrawing ? (
          <div className="text-gray-700">
            <span className="font-semibold">Click</span> to start drawing polygon
          </div>
        ) : (
          <>
            <div className="text-gray-700">
              <span className="font-semibold">Click</span> to add points
            </div>
            <div className="text-gray-600 text-xs">
              <span className="font-semibold">Double-click</span> or{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">Enter</kbd> to
              complete
            </div>
            <div className="text-gray-600 text-xs">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">Esc</kbd> to
              cancel
            </div>
            <div className="text-gray-500 text-xs mt-2">
              {pointCount} points
              {pointCount < 3 && (
                <span className="text-orange-600 ml-1">
                  (minimum 3 required)
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
