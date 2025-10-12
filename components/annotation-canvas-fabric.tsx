'use client';

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas, Rect, Polygon as FabricPolygon, Circle, Image as FabricImage, Point } from 'fabric';
import { useAnnotationStore } from '@/lib/store/annotation-store';
import type { BoundingBox as BoundingBoxType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export interface AnnotationCanvasHandle {
  getCanvas: () => Canvas | null;
}

export const AnnotationCanvas = forwardRef<AnnotationCanvasHandle>((_props, ref) => {
  const image = useAnnotationStore((state) => state.image);
  const annotations = useAnnotationStore((state) => state.annotations);
  const selectedTool = useAnnotationStore((state) => state.selectedTool);
  const selectedAnnotationId = useAnnotationStore((state) => state.selectedAnnotationId);
  const zoomState = useAnnotationStore((state) => state.zoomState);
  const polygonDrawing = useAnnotationStore((state) => state.polygonDrawing);

  const {
    addAnnotation,
    updateAnnotation,
    setSelectedAnnotation,
    deleteAnnotation,
    startPolygon,
    addPolygonPoint,
    updatePolygonPreview,
    completePolygon,
    cancelPolygon,
  } = useAnnotationStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingRect, setDrawingRect] = useState<Rect | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  // Expose canvas ref to parent
  useImperativeHandle(ref, () => ({
    getCanvas: () => fabricCanvasRef.current,
  }));

  // Set mounted state
  useEffect(() => {
    console.log('Component mounted');
    setIsMounted(true);
  }, []);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!isMounted || !canvasRef.current || fabricCanvasRef.current) return;

    console.log('Initializing Fabric canvas');

    // Set initial dimensions first
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      console.log('Canvas dimensions:', width, height);

      if (width === 0 || height === 0) {
        console.error('Container has zero dimensions!');
        return;
      }

      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }

    const canvas = new Canvas(canvasRef.current, {
      selection: selectedTool === 'select',
      backgroundColor: '#f3f4f6',
    });

    console.log('Fabric canvas initialized', {
      width: canvas.getWidth(),
      height: canvas.getHeight()
    });
    fabricCanvasRef.current = canvas;
    setCanvasReady(true);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
      setCanvasReady(false);
    };
  }, [isMounted]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = (): void => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();

        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.setDimensions({ width, height });
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Load and display image
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !image || !canvasReady) {
      console.log('Skipping image load - canvas:', !!canvas, 'image:', !!image, 'canvasReady:', canvasReady);
      return;
    }

    console.log('Loading image:', image.url);
    console.log('Canvas state:', {
      width: canvas.getWidth(),
      height: canvas.getHeight(),
      ready: canvasReady
    });

    // Clear canvas first
    canvas.clear();
    canvas.backgroundColor = '#f3f4f6';

    FabricImage.fromURL(
      image.url,
      {
        crossOrigin: 'anonymous',
      }
    ).then((img) => {
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const imgWidth = img.width || 1;
      const imgHeight = img.height || 1;

      console.log('Image loaded successfully', {
        imgWidth,
        imgHeight,
        canvasWidth,
        canvasHeight
      });

      // Calculate scale to fit image within canvas while maintaining aspect ratio
      const scaleX = canvasWidth / imgWidth;
      const scaleY = canvasHeight / imgHeight;
      const scale = Math.min(scaleX, scaleY);

      // Apply scaling
      img.scale(scale);

      // Center the image
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      const left = (canvasWidth - scaledWidth) / 2;
      const top = (canvasHeight - scaledHeight) / 2;

      console.log('Image scaling', {
        scale,
        scaledWidth,
        scaledHeight,
        left,
        top
      });

      img.set({
        left,
        top,
        selectable: false,
        evented: false,
      });

      canvas.backgroundImage = img;
      canvas.renderAll();
      console.log('Canvas renderAll called');
    }).catch((error) => {
      console.error('Error loading image:', error);
      console.error('Failed URL:', image.url);
    });
  }, [image, canvasReady]);

  // Apply zoom
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const center = canvas.getCenter();
    canvas.zoomToPoint(
      new Point(center.left, center.top),
      zoomState.scale
    );
    canvas.requestRenderAll();
  }, [zoomState.scale]);

  // Sync annotations to canvas
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Remove all annotation objects (keep background image)
    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      if (obj.data?.isAnnotation || obj.data?.isPolygonPreview) {
        canvas.remove(obj);
      }
    });

    // Add current annotations
    annotations.forEach((annotation) => {
      if (annotation.type === 'bbox') {
        const rect = new Rect({
          left: annotation.x,
          top: annotation.y,
          width: annotation.width,
          height: annotation.height,
          fill: 'transparent',
          stroke: annotation.color,
          strokeWidth: 2,
          selectable: selectedTool === 'select',
          hasControls: true,
          hasBorders: true,
          lockRotation: true,
        });

        // Store annotation data
        (rect as any).data = {
          isAnnotation: true,
          annotationId: annotation.id,
        };

        // Update annotation on modification
        rect.on('modified', () => {
          const id = (rect as any).data?.annotationId;
          if (id) {
            updateAnnotation(id, {
              x: rect.left || 0,
              y: rect.top || 0,
              width: (rect.width || 0) * (rect.scaleX || 1),
              height: (rect.height || 0) * (rect.scaleY || 1),
            });
            // Reset scale after applying to dimensions
            rect.set({ scaleX: 1, scaleY: 1 });
          }
        });

        // Selection handling
        rect.on('selected', () => {
          const id = (rect as any).data?.annotationId;
          if (id) {
            setSelectedAnnotation(id);
          }
        });

        canvas.add(rect);

        // Highlight selected annotation
        if (annotation.id === selectedAnnotationId) {
          canvas.setActiveObject(rect);
        }
      } else if (annotation.type === 'polygon') {
        const points = annotation.points.map((p) => ({ x: p.x, y: p.y }));
        const polygon = new FabricPolygon(points, {
          fill: `${annotation.color}33`,
          stroke: annotation.color,
          strokeWidth: 2,
          selectable: selectedTool === 'select',
          objectCaching: false,
        });

        (polygon as any).data = {
          isAnnotation: true,
          annotationId: annotation.id,
        };

        // Selection handling
        polygon.on('selected', () => {
          const id = (polygon as any).data?.annotationId;
          if (id) {
            setSelectedAnnotation(id);
          }
        });

        // Update annotation on modification
        polygon.on('modified', () => {
          const id = (polygon as any).data?.annotationId;
          if (id && polygon.points) {
            const newPoints = polygon.points.map((p: any) => ({
              x: p.x,
              y: p.y,
            }));
            updateAnnotation(id, { points: newPoints });
          }
        });

        canvas.add(polygon);

        // Highlight selected annotation
        if (annotation.id === selectedAnnotationId) {
          canvas.setActiveObject(polygon);
        }
      }
    });

    canvas.requestRenderAll();
  }, [annotations, selectedTool, selectedAnnotationId, updateAnnotation, setSelectedAnnotation]);

  // Render polygon preview
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Remove old preview objects
    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      if (obj.data?.isPolygonPreview) {
        canvas.remove(obj);
      }
    });

    if (polygonDrawing.isDrawing && polygonDrawing.points.length > 0) {
      // Draw preview line
      const previewPoints = [...polygonDrawing.points];
      if (polygonDrawing.previewPoint) {
        previewPoints.push(polygonDrawing.previewPoint);
      }

      const xyPoints = previewPoints.map((p) => ({ x: p.x, y: p.y }));
      const previewLine = new FabricPolygon(xyPoints, {
        fill: 'transparent',
        stroke: '#10b981',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      (previewLine as any).data = { isPolygonPreview: true };
      canvas.add(previewLine);

      // Draw point circles
      polygonDrawing.points.forEach((point, index) => {
        const circle = new Circle({
          left: point.x - 5,
          top: point.y - 5,
          radius: 5,
          fill: '#10b981',
          stroke: 'white',
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        (circle as any).data = { isPolygonPreview: true };
        canvas.add(circle);

        // First point indicator (larger)
        if (index === 0) {
          const firstCircle = new Circle({
            left: point.x - 8,
            top: point.y - 8,
            radius: 8,
            fill: 'transparent',
            stroke: '#10b981',
            strokeWidth: 3,
            selectable: false,
            evented: false,
          });
          (firstCircle as any).data = { isPolygonPreview: true };
          canvas.add(firstCircle);
        }
      });
    }

    canvas.requestRenderAll();
  }, [polygonDrawing]);

  // Drawing mode handler
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.selection = selectedTool === 'select';
    canvas.forEachObject((obj: any) => {
      if (obj.data?.isAnnotation) {
        obj.selectable = selectedTool === 'select';
      }
    });

    canvas.requestRenderAll();
  }, [selectedTool]);

  // Mouse down - start drawing bbox or add polygon point
  const handleMouseDown = useCallback(
    (e: any) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const pointer = canvas.getPointer(e.e);

      if (selectedTool === 'bbox' && !isDrawing) {
        startPointRef.current = { x: pointer.x, y: pointer.y };
        setIsDrawing(true);

        const rect = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: 'transparent',
          stroke: '#3b82f6',
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });

        canvas.add(rect);
        setDrawingRect(rect);
      } else if (selectedTool === 'polygon') {
        if (!polygonDrawing.isDrawing) {
          startPolygon({ x: pointer.x, y: pointer.y });
        } else {
          addPolygonPoint({ x: pointer.x, y: pointer.y });
        }
      }
    },
    [selectedTool, isDrawing, polygonDrawing.isDrawing, startPolygon, addPolygonPoint]
  );

  // Mouse move - update drawing bbox or polygon preview
  const handleMouseMove = useCallback(
    (e: any) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const pointer = canvas.getPointer(e.e);

      if (isDrawing && drawingRect && startPointRef.current) {
        const x = Math.min(startPointRef.current.x, pointer.x);
        const y = Math.min(startPointRef.current.y, pointer.y);
        const width = Math.abs(pointer.x - startPointRef.current.x);
        const height = Math.abs(pointer.y - startPointRef.current.y);

        drawingRect.set({ left: x, top: y, width, height });
        canvas.requestRenderAll();
      } else if (polygonDrawing.isDrawing && selectedTool === 'polygon') {
        updatePolygonPreview({ x: pointer.x, y: pointer.y });
      }
    },
    [isDrawing, drawingRect, polygonDrawing.isDrawing, selectedTool, updatePolygonPreview]
  );

  // Mouse up - finish drawing bbox
  const handleMouseUp = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isDrawing || !drawingRect || !startPointRef.current) return;

    const width = drawingRect.width || 0;
    const height = drawingRect.height || 0;

    canvas.remove(drawingRect);

    // Only create annotation if it has meaningful size
    if (width > 5 && height > 5) {
      const newAnnotation: BoundingBoxType = {
        id: uuidv4(),
        type: 'bbox',
        label: `Object ${annotations.length + 1}`,
        x: drawingRect.left || 0,
        y: drawingRect.top || 0,
        width,
        height,
        color: '#3b82f6',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addAnnotation(newAnnotation);
    }

    setIsDrawing(false);
    setDrawingRect(null);
    startPointRef.current = null;
  }, [isDrawing, drawingRect, annotations.length, addAnnotation]);

  // Double click - complete polygon
  const handleDoubleClick = useCallback(() => {
    if (polygonDrawing.isDrawing && polygonDrawing.points.length >= 3) {
      completePolygon();
    }
  }, [polygonDrawing.isDrawing, polygonDrawing.points.length, completePolygon]);

  // Register event handlers
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('mouse:dblclick', handleDoubleClick);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('mouse:dblclick', handleDoubleClick);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleDoubleClick]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelPolygon();
        setSelectedAnnotation(null);
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.discardActiveObject();
          fabricCanvasRef.current.requestRenderAll();
        }
      } else if (e.key === 'Enter') {
        if (polygonDrawing.isDrawing && polygonDrawing.points.length >= 3) {
          completePolygon();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAnnotationId) {
          deleteAnnotation(selectedAnnotationId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId, polygonDrawing.isDrawing, polygonDrawing.points.length, setSelectedAnnotation, deleteAnnotation, cancelPolygon, completePolygon]);

  if (!image) {
    console.log('No image loaded - showing uploader');
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">Upload an image to start annotating</p>
      </div>
    );
  }

  console.log('Image loaded, isMounted:', isMounted, 'Image URL:', image.url);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">Loading canvas...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gray-200">
      <canvas ref={canvasRef} style={{ border: '2px solid red', display: 'block' }} />
      {/* <div className="absolute bottom-4 right-4 bg-white p-2 text-xs shadow-lg border border-gray-300 rounded max-w-sm">
        <div className="font-bold mb-1">Debug Info:</div>
        <div>Image: {image.name}</div>
        <div>URL: {image.url}</div>
        <div>Mounted: {isMounted ? 'Yes' : 'No'}</div>
        <div>Canvas Ready: {canvasReady ? 'Yes' : 'No'}</div>
        <div>Tool: {selectedTool}</div>
        <div>Canvas Dims: {fabricCanvasRef.current ? `${fabricCanvasRef.current.getWidth()}×${fabricCanvasRef.current.getHeight()}` : 'N/A'}</div>
        <div className="mt-2">
          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Test Image Load
          </a>
        </div>
      </div> */}
    </div>
  );
});

AnnotationCanvas.displayName = 'AnnotationCanvas';
