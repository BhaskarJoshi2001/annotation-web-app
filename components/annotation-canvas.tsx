'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import { useAnnotationStore } from '@/lib/store/annotation-store';

export function AnnotationCanvas() {
  const image = useAnnotationStore((state) => state.image);
  const zoomState = useAnnotationStore((state) => state.zoomState);
  const [konvaImage, setKonvaImage] = useState<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image
  useEffect(() => {
    if (image) {
      const img = new window.Image();
      img.onload = () => setKonvaImage(img);
      img.src = image.url;
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

  if (!image || !konvaImage) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">Upload an image to start annotating</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-100">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        scaleX={zoomState.scale}
        scaleY={zoomState.scale}
        x={zoomState.position.x}
        y={zoomState.position.y}
      >
        <Layer>
          <KonvaImage
            image={konvaImage}
            width={image.width}
            height={image.height}
          />
        </Layer>
      </Stage>
    </div>
  );
}
