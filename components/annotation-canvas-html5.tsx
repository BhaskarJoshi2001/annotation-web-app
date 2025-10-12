'use client';

import { useEffect, useRef, useState } from 'react';
import { useAnnotationStore } from '@/lib/store/annotation-store';

export function AnnotationCanvas() {
  const image = useAnnotationStore((state) => state.image);
  const zoomState = useAnnotationStore((state) => state.zoomState);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image
  useEffect(() => {
    if (image) {
      const img = new Image();
      img.onload = () => setLoadedImage(img);
      img.src = image.url;
    } else {
      setLoadedImage(null);
    }
  }, [image]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply zoom and pan
    ctx.translate(zoomState.position.x, zoomState.position.y);
    ctx.scale(zoomState.scale, zoomState.scale);

    // Draw image
    ctx.drawImage(loadedImage, 0, 0, image!.width, image!.height);

    // Restore context state
    ctx.restore();
  }, [loadedImage, image, zoomState]);

  if (!image || !loadedImage) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">Upload an image to start annotating</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-100">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
}
