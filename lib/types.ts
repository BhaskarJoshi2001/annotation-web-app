/**
 * Represents a 2D point coordinate
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Bounding box annotation
 */
export interface BoundingBox {
  id: string;
  type: 'bbox';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Polygon annotation
 */
export interface Polygon {
  id: string;
  type: 'polygon';
  label: string;
  points: Point[];
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Union type for all annotation types
 */
export type Annotation = BoundingBox | Polygon;

/**
 * Image metadata
 */
export interface ImageData {
  id: string;
  name: string;
  filename: string;
  url: string;
  width: number;
  height: number;
  size: number;
  uploadedAt: Date;
}

/**
 * Project state
 */
export interface ProjectState {
  image: ImageData | null;
  annotations: Annotation[];
}

/**
 * Tool types
 */
export type ToolType = 'select' | 'bbox' | 'polygon';

/**
 * Zoom state
 */
export interface ZoomState {
  scale: number;
  position: Point;
}

/**
 * Polygon drawing state
 */
export interface PolygonDrawingState {
  isDrawing: boolean;
  points: Point[];
  previewPoint: Point | null;
}

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'coco' | 'yolo' | 'image';

/**
 * Custom JSON export format
 */
export interface CustomJSONExport {
  image: {
    filename: string;
    width: number;
    height: number;
  };
  annotations: Annotation[];
  exportedAt: Date;
}

/**
 * COCO format types
 */
export interface COCOImage {
  id: number;
  file_name: string;
  width: number;
  height: number;
}

export interface COCOAnnotation {
  id: number;
  image_id: number;
  category_id: number;
  bbox?: [number, number, number, number];
  segmentation?: number[][];
  area: number;
  iscrowd: 0 | 1;
}

export interface COCOCategory {
  id: number;
  name: string;
  supercategory: string;
}

export interface COCOExport {
  images: COCOImage[];
  annotations: COCOAnnotation[];
  categories: COCOCategory[];
}

/**
 * YOLO format export
 */
export interface YOLOExport {
  annotations: string; // .txt content
  classes: string; // classes.txt content
}

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  filename?: string;
  data?: string | Blob;
  error?: string;
}
