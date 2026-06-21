'use client';

import type {
  Annotation,
  LabelClass,
  BoundingBox,
  Polygon,
  CustomJSONExport,
  COCOExport,
  COCOImage,
  COCOAnnotation,
  COCOCategory,
  YOLOExport,
  ImageData,
} from '../types';

function className(classId: string, labelClasses: LabelClass[]): string {
  return labelClasses.find((c) => c.id === classId)?.name ?? 'unknown';
}

/**
 * Export annotations as custom JSON format
 */
export function exportAsJSON(
  image: ImageData,
  annotations: Annotation[],
  labelClasses: LabelClass[]
): CustomJSONExport {
  return {
    image: { filename: image.filename, width: image.width, height: image.height },
    labelClasses,
    annotations,
    exportedAt: new Date(),
  };
}

/**
 * Export annotations as COCO format
 */
export function exportAsCOCO(
  image: ImageData,
  annotations: Annotation[],
  labelClasses: LabelClass[]
): COCOExport {
  const uniqueClassIds = Array.from(new Set(annotations.map((a) => a.classId)));
  const categories: COCOCategory[] = uniqueClassIds.map((classId, index) => ({
    id: index + 1,
    name: className(classId, labelClasses),
    supercategory: 'object',
  }));
  const classIdToCategoryId = new Map<string, number>();
  uniqueClassIds.forEach((id, index) => classIdToCategoryId.set(id, index + 1));

  const cocoImage: COCOImage = { id: 1, file_name: image.filename, width: image.width, height: image.height };

  const cocoAnnotations: COCOAnnotation[] = annotations.map((ann, index) => {
    const categoryId = classIdToCategoryId.get(ann.classId) ?? 1;

    if (ann.type === 'bbox') {
      const bbox = ann as BoundingBox;
      return {
        id: index + 1, image_id: 1, category_id: categoryId,
        bbox: [bbox.x, bbox.y, bbox.width, bbox.height],
        area: bbox.width * bbox.height, iscrowd: 0,
      };
    } else {
      const polygon = ann as Polygon;
      const flatPoints = polygon.points.flatMap((p) => [p.x, p.y]);
      const xs = polygon.points.map((p) => p.x);
      const ys = polygon.points.map((p) => p.y);
      const minX = Math.min(...xs); const minY = Math.min(...ys);
      const maxX = Math.max(...xs); const maxY = Math.max(...ys);
      const w = maxX - minX; const h = maxY - minY;
      return {
        id: index + 1, image_id: 1, category_id: categoryId,
        bbox: [minX, minY, w, h], segmentation: [flatPoints],
        area: w * h, iscrowd: 0,
      };
    }
  });

  return { images: [cocoImage], annotations: cocoAnnotations, categories };
}

/**
 * Export annotations as YOLO format
 */
export function exportAsYOLO(
  image: ImageData,
  annotations: Annotation[],
  labelClasses: LabelClass[]
): YOLOExport {
  const uniqueClassIds = Array.from(new Set(annotations.map((a) => a.classId)));
  const classIdToYoloIdx = new Map<string, number>();
  uniqueClassIds.forEach((id, index) => classIdToYoloIdx.set(id, index));
  const classes = uniqueClassIds.map((id) => className(id, labelClasses)).join('\n');

  const yoloLines = annotations
    .filter((ann) => ann.type === 'bbox')
    .map((ann) => {
      const bbox = ann as BoundingBox;
      const yoloIdx = classIdToYoloIdx.get(bbox.classId) ?? 0;
      const xCenter = (bbox.x + bbox.width / 2) / image.width;
      const yCenter = (bbox.y + bbox.height / 2) / image.height;
      const w = bbox.width / image.width;
      const h = bbox.height / image.height;
      return `${yoloIdx} ${xCenter.toFixed(6)} ${yCenter.toFixed(6)} ${w.toFixed(6)} ${h.toFixed(6)}`;
    });

  return { annotations: yoloLines.join('\n'), classes };
}

/**
 * Download file helper
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get base filename without extension
 */
export function getBaseFilename(filename: string): string {
  return filename.split('.').slice(0, -1).join('.') || filename;
}
