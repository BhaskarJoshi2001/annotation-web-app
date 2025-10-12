'use client';

import { useAnnotationStore } from '@/lib/store/annotation-store';
import { useState } from 'react';
import type { Annotation, BoundingBox as BoundingBoxType, Polygon as PolygonType } from '@/lib/types';

interface AnnotationItemProps {
  annotation: Annotation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onLabelChange: (label: string) => void;
  onColorChange: (color: string) => void;
}

function AnnotationItem({
  annotation,
  isSelected,
  onSelect,
  onDelete,
  onLabelChange,
  onColorChange,
}: AnnotationItemProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(annotation.label);

  const handleLabelSubmit = (): void => {
    onLabelChange(labelValue);
    setIsEditingLabel(false);
  };

  const typeConfig = annotation.type === 'bbox'
    ? {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
          </svg>
        ),
        label: 'Bounding Box'
      }
    : {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        ),
        label: 'Polygon'
      };

  return (
    <div
      className={`group relative p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer animate-fade-in ${
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 shadow-large scale-105'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-gray-900 hover:shadow-medium'
      }`}
      onClick={onSelect}
    >
      {/* Type Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
          isSelected
            ? 'bg-primary-500 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
        }`}>
          <div className="w-4 h-4">{typeConfig.icon}</div>
          <span>{typeConfig.label}</span>
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this annotation?')) {
              onDelete();
            }
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-error-light/10 text-error hover:text-error-dark active:scale-95"
          title="Delete annotation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Label */}
      <div className="mb-3">
        {isEditingLabel ? (
          <input
            type="text"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleLabelSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLabelSubmit();
              if (e.key === 'Escape') {
                setLabelValue(annotation.label);
                setIsEditingLabel(false);
              }
            }}
            className="input-field text-sm font-semibold"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate group/label"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingLabel(true);
            }}
            title="Double-click to edit"
          >
            {annotation.label}
            <span className="ml-2 text-xs text-gray-400 opacity-0 group-hover/label:opacity-100 transition-opacity">
              (double-click to edit)
            </span>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {annotation.type === 'bbox' && (
            <span>{Math.round((annotation as BoundingBoxType).width)} × {Math.round((annotation as BoundingBoxType).height)}px</span>
          )}
          {annotation.type === 'polygon' && (
            <span>{(annotation as PolygonType).points.length} vertices</span>
          )}
        </div>

        {/* Color Picker */}
        <div className="relative">
          <input
            type="color"
            value={annotation.color}
            onChange={(e) => {
              e.stopPropagation();
              onColorChange(e.target.value);
            }}
            className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white dark:border-gray-700 shadow-soft hover:shadow-medium transition-all"
            title="Change color"
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              backgroundColor: annotation.color,
              opacity: 0.2,
              filter: 'blur(8px)'
            }}
          ></div>
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary-500 rounded-r-full"></div>
      )}
    </div>
  );
}

export function AnnotationList() {
  const annotations = useAnnotationStore((state) => state.annotations);
  const selectedAnnotationId = useAnnotationStore((state) => state.selectedAnnotationId);
  const {
    setSelectedAnnotation,
    deleteAnnotation,
    updateAnnotation,
    clearAll,
  } = useAnnotationStore();

  const handleClearAll = (): void => {
    if (confirm('⚠️ Are you sure you want to delete all annotations? This action cannot be undone.')) {
      clearAll();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 surface-elevated-medium border-b border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Annotations
          </h2>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 text-sm font-bold">
              {annotations.length}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {annotations.length === 0
            ? 'Start annotating by selecting a tool'
            : annotations.length === 1
            ? '1 annotation in this image'
            : `${annotations.length} annotations in this image`}
        </p>

        {annotations.length > 0 && (
          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-error-light/10 hover:bg-error-light/20 text-error hover:text-error-dark font-medium text-sm transition-all duration-200 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All Annotations
          </button>
        )}
      </div>

      {/* Annotations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {annotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No annotations yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Select a tool from the left panel and start annotating your image
            </p>
          </div>
        ) : (
          annotations.map((annotation) => (
            <AnnotationItem
              key={annotation.id}
              annotation={annotation}
              isSelected={annotation.id === selectedAnnotationId}
              onSelect={() => setSelectedAnnotation(annotation.id)}
              onDelete={() => deleteAnnotation(annotation.id)}
              onLabelChange={(label) =>
                updateAnnotation(annotation.id, { label })
              }
              onColorChange={(color) =>
                updateAnnotation(annotation.id, { color })
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
