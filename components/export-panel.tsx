'use client';

import { useState } from 'react';
import { useAnnotationStore } from '@/lib/store/annotation-store';
import { useExport } from '@/lib/hooks/use-export';
import type { ExportFormat } from '@/lib/types';
import type { Canvas } from 'fabric';

interface ExportPanelProps {
  canvasRef: React.RefObject<Canvas | null>;
}

export function ExportPanel({ canvasRef }: ExportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const image = useAnnotationStore((state) => state.image);
  const annotations = useAnnotationStore((state) => state.annotations);
  const { exportAnnotations, isExporting, error } = useExport();

  const canExport = image !== null && annotations.length > 0;

  const handleExport = async (format: ExportFormat) => {
    if (!canExport) return;

    try {
      if (format === 'image') {
        // Export annotated image using Fabric canvas
        if (canvasRef.current && image) {
          const dataURL = canvasRef.current.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2, // 2x resolution for better quality
          });

          const link = document.createElement('a');
          link.download = `${image.filename.split('.')[0]}_annotated.png`;
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setSuccessMessage('Image exported successfully!');
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      } else {
        const result = await exportAnnotations(format);
        setSuccessMessage(`${result.format} exported: ${result.filename}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      setIsOpen(false);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const exportOptions: Array<{
    format: ExportFormat;
    label: string;
    description: string;
    icon: string;
  }> = [
    {
      format: 'json',
      label: 'Custom JSON',
      description: 'Custom format with all annotation data',
      icon: '📄',
    },
    {
      format: 'coco',
      label: 'COCO Format',
      description: 'Common Objects in Context format',
      icon: '🗂️',
    },
    {
      format: 'yolo',
      label: 'YOLO Format',
      description: 'YOLO training format (.txt + classes.txt)',
      icon: '📝',
    },
    {
      format: 'image',
      label: 'Annotated Image',
      description: 'PNG image with annotations drawn',
      icon: '🖼️',
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={!canExport}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
          canExport
            ? 'bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white shadow-soft hover:shadow-large active:scale-95'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
        }`}
        title={!canExport ? 'Upload image and add annotations to export' : 'Export annotations'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
        <span>Export</span>
        {annotations.length > 0 && (
          <span className="px-2 py-0.5 rounded-lg bg-white/20 text-xs font-bold">
            {annotations.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-96 glass-surface rounded-3xl shadow-glass z-50 animate-scale-in overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-primary-500/10 to-transparent border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                  Export Annotations
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn-icon text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose your preferred export format
              </p>
            </div>

            {/* Export Options */}
            <div className="p-4 space-y-2">
              {exportOptions.map((option) => (
                <button
                  key={option.format}
                  onClick={() => handleExport(option.format)}
                  disabled={isExporting}
                  className="group w-full flex items-start gap-4 p-4 rounded-2xl transition-all duration-200 hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700"
                >
                  <div className="text-3xl">{option.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {option.description}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-error-light/10 border-t border-error/20">
                <div className="flex items-start gap-3 text-error">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <div className="font-semibold">Export Failed</div>
                    <div className="text-xs mt-1">{error.message}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isExporting && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                <div className="text-center">
                  <div className="relative w-12 h-12 mx-auto mb-3">
                    <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-900"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin"></div>
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Exporting...
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 glass-surface-light px-6 py-4 rounded-2xl shadow-large z-50 animate-slide-in-right flex items-center gap-3 max-w-md">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white">Success!</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{successMessage}</div>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
