'use client';

import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAnnotationStore } from '../store/annotation-store';
import {
  exportAsJSON,
  exportAsCOCO,
  exportAsYOLO,
  downloadFile,
  getBaseFilename,
} from '../utils/export-utils';
import type { ExportFormat } from '../types';

export function useExport() {
  const image = useAnnotationStore((state) => state.image);
  const annotations = useAnnotationStore((state) => state.annotations);
  const labelClasses = useAnnotationStore((state) => state.labelClasses);

  const exportMutation = useMutation({
    mutationFn: async (format: ExportFormat) => {
      if (!image) {
        throw new Error('No image loaded');
      }

      if (annotations.length === 0) {
        throw new Error('No annotations to export');
      }

      const baseFilename = getBaseFilename(image.filename);

      switch (format) {
        case 'json': {
          const data = exportAsJSON(image, annotations, labelClasses);
          downloadFile(
            JSON.stringify(data, null, 2),
            `${baseFilename}_annotations.json`,
            'application/json'
          );
          return { format: 'JSON', filename: `${baseFilename}_annotations.json` };
        }

        case 'coco': {
          const data = exportAsCOCO(image, annotations, labelClasses);
          downloadFile(
            JSON.stringify(data, null, 2),
            `${baseFilename}_coco.json`,
            'application/json'
          );
          return { format: 'COCO', filename: `${baseFilename}_coco.json` };
        }

        case 'yolo': {
          const data = exportAsYOLO(image, annotations, labelClasses);

          // Download annotations file
          downloadFile(
            data.annotations,
            `${baseFilename}.txt`,
            'text/plain'
          );

          // Download classes file
          downloadFile(
            data.classes,
            'classes.txt',
            'text/plain'
          );

          return {
            format: 'YOLO',
            filename: `${baseFilename}.txt + classes.txt`,
          };
        }

        case 'image': {
          // This will be handled separately with canvas export
          throw new Error('Image export not implemented in this mutation');
        }

        default:
          throw new Error(`Unknown export format: ${format}`);
      }
    },
  });

  const exportAnnotations = useCallback(
    (format: ExportFormat) => {
      return exportMutation.mutateAsync(format);
    },
    [exportMutation]
  );

  return {
    exportAnnotations,
    isExporting: exportMutation.isPending,
    error: exportMutation.error,
  };
}
