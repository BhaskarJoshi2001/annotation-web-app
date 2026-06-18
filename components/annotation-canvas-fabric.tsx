'use client';

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas, Rect, Polygon as FabricPolygon, Circle, FabricImage, Point } from 'fabric';
import type { TPointerEventInfo, TPointerEvent } from 'fabric';
import { useAnnotationStore } from '@/lib/store/annotation-store';
import type { BoundingBox as BoundingBoxType, Polygon as PolygonType, Point as PointType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export interface AnnotationCanvasHandle {
  getCanvas: () => Canvas | null;
}

/**
 * Maps between two coordinate spaces:
 *  - "scene" space: Fabric's canvas coordinate system, where the fitted image
 *    sits at (offsetX, offsetY) scaled by `scale`. This is what `getPointer`
 *    returns and what objects are positioned in.
 *  - "image" space: the source image's own pixel grid (0,0 .. width,height).
 *
 * Annotations are persisted in IMAGE space so that exports (COCO/YOLO/JSON) and
 * stored coordinates stay correct regardless of zoom, pan, or canvas size.
 */
interface ImagePlacement {
  scale: number;
  offsetX: number;
  offsetY: number;
}

function sceneToImage(p: PointType, pl: ImagePlacement): PointType {
  return { x: (p.x - pl.offsetX) / pl.scale, y: (p.y - pl.offsetY) / pl.scale };
}

function imageToScene(p: PointType, pl: ImagePlacement): PointType {
  return { x: p.x * pl.scale + pl.offsetX, y: p.y * pl.scale + pl.offsetY };
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

  // Image placement (scene <-> image transform). Kept in both a ref (for event
  // handlers, always current) and state (to re-run the annotation render effect).
  const [imagePlacement, setImagePlacement] = useState<ImagePlacement | null>(null);
  const imagePlacementRef = useRef<ImagePlacement | null>(null);

  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Expose canvas ref to parent
  useImperativeHandle(ref, () => ({
    getCanvas: () => fabricCanvasRef.current,
  }));

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!isMounted || !canvasRef.current || fabricCanvasRef.current) return;

    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }

    const canvas = new Canvas(canvasRef.current, {
      selection: selectedTool === 'select',
      backgroundColor: 'transparent',
    });

    fabricCanvasRef.current = canvas;
    setCanvasReady(true);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
      setCanvasReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = (): void => {
      if (containerRef.current && fabricCanvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        fabricCanvasRef.current.setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Load and display image, then record its placement transform
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !image || !canvasReady) return;

    canvas.clear();
    canvas.backgroundColor = 'transparent';

    FabricImage.fromURL(image.url, { crossOrigin: 'anonymous' })
      .then((img) => {
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        const imgWidth = img.width || 1;
        const imgHeight = img.height || 1;

        // Fit the image within the canvas while preserving aspect ratio.
        const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const left = (canvasWidth - scaledWidth) / 2;
        const top = (canvasHeight - scaledHeight) / 2;

        img.scale(scale);
        img.set({ left, top, selectable: false, evented: false });

        canvas.backgroundImage = img;
        canvas.renderAll();

        const placement: ImagePlacement = { scale, offsetX: left, offsetY: top };
        imagePlacementRef.current = placement;
        setImagePlacement(placement);
      })
      .catch((error) => {
        console.error('Failed to load image:', image.url, error);
      });
  }, [image, canvasReady]);

  // Apply zoom (operates on the viewport, independent of coordinate space)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const center = new Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    canvas.zoomToPoint(center, zoomState.scale);
    canvas.requestRenderAll();
  }, [zoomState.scale]);

  // Sync annotations (stored in image space) to canvas objects (scene space)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Remove existing annotation/preview objects (keep background image)
    canvas.getObjects().forEach((obj) => {
      const data = (obj as { data?: { isAnnotation?: boolean; isPolygonPreview?: boolean } }).data;
      if (data?.isAnnotation || data?.isPolygonPreview) {
        canvas.remove(obj);
      }
    });

    const placement = imagePlacement;
    if (!placement) {
      canvas.requestRenderAll();
      return;
    }

    annotations.forEach((annotation) => {
      if (annotation.type === 'bbox') {
        const topLeft = imageToScene({ x: annotation.x, y: annotation.y }, placement);
        const rect = new Rect({
          left: topLeft.x,
          top: topLeft.y,
          width: annotation.width * placement.scale,
          height: annotation.height * placement.scale,
          fill: 'transparent',
          stroke: annotation.color,
          strokeWidth: 2,
          strokeUniform: true,
          selectable: selectedTool === 'select',
          hasControls: true,
          hasBorders: true,
          lockRotation: true,
        });
        (rect as { data?: unknown }).data = { isAnnotation: true, annotationId: annotation.id };

        rect.on('modified', () => {
          const sceneTopLeft = { x: rect.left || 0, y: rect.top || 0 };
          const img = sceneToImage(sceneTopLeft, placement);
          updateAnnotation<BoundingBoxType>(annotation.id, {
            x: img.x,
            y: img.y,
            width: ((rect.width || 0) * (rect.scaleX || 1)) / placement.scale,
            height: ((rect.height || 0) * (rect.scaleY || 1)) / placement.scale,
          });
          rect.set({ scaleX: 1, scaleY: 1 });
        });

        rect.on('selected', () => setSelectedAnnotation(annotation.id));

        canvas.add(rect);
        if (annotation.id === selectedAnnotationId) canvas.setActiveObject(rect);
      } else if (annotation.type === 'polygon') {
        const scenePoints = annotation.points.map((p) => imageToScene(p, placement));
        const polygon = new FabricPolygon(scenePoints, {
          fill: `${annotation.color}33`,
          stroke: annotation.color,
          strokeWidth: 2,
          strokeUniform: true,
          selectable: selectedTool === 'select',
          objectCaching: false,
        });
        (polygon as { data?: unknown }).data = { isAnnotation: true, annotationId: annotation.id };

        polygon.on('selected', () => setSelectedAnnotation(annotation.id));

        polygon.on('modified', () => {
          if (!polygon.points) return;
          // Fabric stores polygon points relative to the object's own origin, so
          // reconstruct absolute scene coordinates via the object's transform.
          const matrix = polygon.calcTransformMatrix();
          const imagePoints = polygon.points.map((pt) => {
            const scenePoint = new Point(
              pt.x - polygon.pathOffset.x,
              pt.y - polygon.pathOffset.y
            ).transform(matrix);
            return sceneToImage({ x: scenePoint.x, y: scenePoint.y }, placement);
          });
          updateAnnotation<PolygonType>(annotation.id, { points: imagePoints });
        });

        canvas.add(polygon);
        if (annotation.id === selectedAnnotationId) canvas.setActiveObject(polygon);
      }
    });

    canvas.requestRenderAll();
  }, [annotations, selectedTool, selectedAnnotationId, imagePlacement, updateAnnotation, setSelectedAnnotation]);

  // Render in-progress polygon preview (points are kept in scene space)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach((obj) => {
      if ((obj as { data?: { isPolygonPreview?: boolean } }).data?.isPolygonPreview) {
        canvas.remove(obj);
      }
    });

    if (polygonDrawing.isDrawing && polygonDrawing.points.length > 0) {
      const previewPoints = [...polygonDrawing.points];
      if (polygonDrawing.previewPoint) previewPoints.push(polygonDrawing.previewPoint);

      const previewLine = new FabricPolygon(previewPoints, {
        fill: 'transparent',
        stroke: '#10b981',
        strokeWidth: 2,
        strokeUniform: true,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      (previewLine as { data?: unknown }).data = { isPolygonPreview: true };
      canvas.add(previewLine);

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
        (circle as { data?: unknown }).data = { isPolygonPreview: true };
        canvas.add(circle);

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
          (firstCircle as { data?: unknown }).data = { isPolygonPreview: true };
          canvas.add(firstCircle);
        }
      });
    }

    canvas.requestRenderAll();
  }, [polygonDrawing]);

  // Toggle selectability when the active tool changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.selection = selectedTool === 'select';
    canvas.forEachObject((obj) => {
      if ((obj as { data?: { isAnnotation?: boolean } }).data?.isAnnotation) {
        obj.selectable = selectedTool === 'select';
      }
    });
    canvas.requestRenderAll();
  }, [selectedTool]);

  // Commit the in-progress polygon, converting scene points to image space
  const finishPolygon = useCallback(() => {
    const placement = imagePlacementRef.current;
    if (!placement) return;

    const { annotations: currentAnnotations, polygonDrawing: drawing } = useAnnotationStore.getState();
    if (drawing.points.length < 3) {
      cancelPolygon();
      return;
    }

    const newPolygon: PolygonType = {
      id: uuidv4(),
      type: 'polygon',
      label: `Polygon ${currentAnnotations.length + 1}`,
      points: drawing.points.map((p) => sceneToImage(p, placement)),
      color: '#10b981',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addAnnotation(newPolygon);
    cancelPolygon();
  }, [addAnnotation, cancelPolygon]);

  // Mouse down - start drawing bbox, add polygon point, or start panning
  const handleMouseDown = useCallback(
    (opt: TPointerEventInfo<TPointerEvent>) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const ev = opt.e as MouseEvent;
      const pointer = canvas.getScenePoint(opt.e);

      if (isSpacePressed || ev.button === 1) {
        setIsPanning(true);
        lastPosRef.current = { x: ev.clientX, y: ev.clientY };
        canvas.setCursor('grabbing');
        ev.preventDefault();
        return;
      }

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
          strokeUniform: true,
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
    [selectedTool, isDrawing, polygonDrawing.isDrawing, startPolygon, addPolygonPoint, isSpacePressed]
  );

  // Mouse move - update drawing bbox, polygon preview, or pan
  const handleMouseMove = useCallback(
    (opt: TPointerEventInfo<TPointerEvent>) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const ev = opt.e as MouseEvent;

      if (isPanning && lastPosRef.current) {
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += ev.clientX - lastPosRef.current.x;
          vpt[5] += ev.clientY - lastPosRef.current.y;
          canvas.requestRenderAll();
          lastPosRef.current = { x: ev.clientX, y: ev.clientY };
          canvas.setCursor('grabbing');
        }
        return;
      }

      const pointer = canvas.getScenePoint(opt.e);

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
    [isDrawing, drawingRect, polygonDrawing.isDrawing, selectedTool, updatePolygonPreview, isPanning]
  );

  // Mouse up - finish drawing bbox or stop panning
  const handleMouseUp = useCallback(() => {
    const canvas = fabricCanvasRef.current;

    if (isPanning) {
      setIsPanning(false);
      lastPosRef.current = null;
      canvas?.setCursor('default');
      return;
    }

    if (!canvas || !isDrawing || !drawingRect || !startPointRef.current) return;

    const sceneWidth = drawingRect.width || 0;
    const sceneHeight = drawingRect.height || 0;
    canvas.remove(drawingRect);

    const placement = imagePlacementRef.current;
    // Only create an annotation if it has a meaningful size (in screen pixels)
    if (placement && sceneWidth > 5 && sceneHeight > 5) {
      const topLeft = sceneToImage({ x: drawingRect.left || 0, y: drawingRect.top || 0 }, placement);
      const newAnnotation: BoundingBoxType = {
        id: uuidv4(),
        type: 'bbox',
        label: `Object ${annotations.length + 1}`,
        x: topLeft.x,
        y: topLeft.y,
        width: sceneWidth / placement.scale,
        height: sceneHeight / placement.scale,
        color: '#3b82f6',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addAnnotation(newAnnotation);
    }

    setIsDrawing(false);
    setDrawingRect(null);
    startPointRef.current = null;
  }, [isDrawing, drawingRect, annotations.length, addAnnotation, isPanning]);

  // Double click - complete polygon
  const handleDoubleClick = useCallback(() => {
    if (polygonDrawing.isDrawing && polygonDrawing.points.length >= 3) {
      finishPolygon();
    }
  }, [polygonDrawing.isDrawing, polygonDrawing.points.length, finishPolygon]);

  // Register canvas event handlers
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

  // Keyboard shortcuts (Space to pan, Escape/Enter/Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
        fabricCanvasRef.current?.setCursor('grab');
        e.preventDefault();
        return;
      }

      if (e.key === 'Escape') {
        cancelPolygon();
        setSelectedAnnotation(null);
        fabricCanvasRef.current?.discardActiveObject();
        fabricCanvasRef.current?.requestRenderAll();
      } else if (e.key === 'Enter') {
        if (polygonDrawing.isDrawing && polygonDrawing.points.length >= 3) {
          finishPolygon();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAnnotationId) deleteAnnotation(selectedAnnotationId);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isSpacePressed) {
        setIsSpacePressed(false);
        setIsPanning(false);
        lastPosRef.current = null;
        fabricCanvasRef.current?.setCursor('default');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedAnnotationId, polygonDrawing.isDrawing, polygonDrawing.points.length, setSelectedAnnotation, deleteAnnotation, cancelPolygon, finishPolygon, isSpacePressed]);

  if (!image) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">Upload an image to start annotating</p>
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">Loading canvas...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
});

AnnotationCanvas.displayName = 'AnnotationCanvas';
