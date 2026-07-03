export interface Point {
  x: number;
  y: number;
}

export interface LabelClass {
  id: string;
  name: string;
  color: string;
  hotkey?: string;
}

export interface BoundingBox {
  id: string;
  type: 'bbox';
  classId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Polygon {
  id: string;
  type: 'polygon';
  classId: string;
  points: Point[];
  createdAt: Date;
  updatedAt: Date;
}

export type Annotation = BoundingBox | Polygon;

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

export interface ProjectState {
  image: ImageData | null;
  annotations: Annotation[];
}

export type ToolType = 'select' | 'bbox' | 'polygon' | 'ai';

export interface ZoomState {
  scale: number;
  position: Point;
}

export interface PolygonDrawingState {
  isDrawing: boolean;
  points: Point[];
  previewPoint: Point | null;
}

export type ExportFormat = 'json' | 'coco' | 'yolo' | 'image';

export interface CustomJSONExport {
  image: {
    filename: string;
    width: number;
    height: number;
  };
  labelClasses: LabelClass[];
  annotations: Annotation[];
  exportedAt: Date;
}

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

export interface YOLOExport {
  annotations: string; // .txt content
  classes: string; // classes.txt content
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  data?: string | Blob;
  error?: string;
}
