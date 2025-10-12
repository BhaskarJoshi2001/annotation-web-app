'use client';

import type {
  Annotation,
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

/**
 * Export annotations as custom JSON format
 */
export function exportAsJSON(
  image: ImageData,
  annotations: Annotation[]
): CustomJSONExport {
  return {
    image: {
      filename: image.filename,
      width: image.width,
      height: image.height,
    },
    annotations,
    exportedAt: new Date(),
  };
}

/**
 * Export annotations as COCO format
 */
export function exportAsCOCO(
  image: ImageData,
  annotations: Annotation[]
): COCOExport {
  // Extract unique labels
  const uniqueLabels = Array.from(new Set(annotations.map((a) => a.label)));

  // Create categories
  const categories: COCOCategory[] = uniqueLabels.map((label, index) => ({
    id: index + 1,
    name: label,
    supercategory: 'object',
  }));

  // Create category map
  const labelToCategoryId = new Map<string, number>();
  categories.forEach((cat) => labelToCategoryId.set(cat.name, cat.id));

  // Create COCO image
  const cocoImage: COCOImage = {
    id: 1,
    file_name: image.filename,
    width: image.width,
    height: image.height,
  };

  // Create COCO annotations
  const cocoAnnotations: COCOAnnotation[] = annotations.map((ann, index) => {
    const categoryId = labelToCategoryId.get(ann.label) || 1;

    if (ann.type === 'bbox') {
      const bbox = ann as BoundingBox;
      return {
        id: index + 1,
        image_id: 1,
        category_id: categoryId,
        bbox: [bbox.x, bbox.y, bbox.width, bbox.height],
        area: bbox.width * bbox.height,
        iscrowd: 0,
      };
    } else {
      // Polygon
      const polygon = ann as Polygon;
      const flatPoints = polygon.points.flatMap((p) => [p.x, p.y]);

      // Calculate bounding box from polygon
      const xs = polygon.points.map((p) => p.x);
      const ys = polygon.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      const width = maxX - minX;
      const height = maxY - minY;

      return {
        id: index + 1,
        image_id: 1,
        category_id: categoryId,
        bbox: [minX, minY, width, height],
        segmentation: [flatPoints],
        area: width * height,
        iscrowd: 0,
      };
    }
  });

  return {
    images: [cocoImage],
    annotations: cocoAnnotations,
    categories,
  };
}

/**
 * Export annotations as YOLO format
 */
export function exportAsYOLO(
  image: ImageData,
  annotations: Annotation[]
): YOLOExport {
  // Extract unique labels
  const uniqueLabels = Array.from(new Set(annotations.map((a) => a.label)));
  const classes = uniqueLabels.join('\n');

  // Create label to class ID map
  const labelToId = new Map<string, number>();
  uniqueLabels.forEach((label, index) => labelToId.set(label, index));

  // Convert annotations to YOLO format (only bboxes)
  const yoloLines = annotations
    .filter((ann) => ann.type === 'bbox')
    .map((ann) => {
      const bbox = ann as BoundingBox;
      const classId = labelToId.get(bbox.label) || 0;

      // Normalize coordinates (0-1 range)
      const xCenter = (bbox.x + bbox.width / 2) / image.width;
      const yCenter = (bbox.y + bbox.height / 2) / image.height;
      const width = bbox.width / image.width;
      const height = bbox.height / image.height;

      return `${classId} ${xCenter.toFixed(6)} ${yCenter.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`;
    });

  const annotationsContent = yoloLines.join('\n');

  return {
    annotations: annotationsContent,
    classes,
  };
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
