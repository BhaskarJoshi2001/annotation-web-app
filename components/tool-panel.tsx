'use client';

import { useAnnotationStore } from '@/lib/store/annotation-store';
import type { ToolType } from '@/lib/types';

const tools: Array<{
  type: ToolType;
  label: string;
  shortcut: string;
  description: string;
  svg: React.ReactNode;
}> = [
  {
    type: 'select',
    label: 'Select',
    shortcut: 'S',
    description: 'Select and move annotations',
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    )
  },
  {
    type: 'bbox',
    label: 'Bounding Box',
    shortcut: 'B',
    description: 'Draw rectangular boxes',
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
      </svg>
    )
  },
  {
    type: 'polygon',
    label: 'Polygon',
    shortcut: 'P',
    description: 'Draw custom shapes',
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    )
  },
];

export function ToolPanel() {
  const selectedTool = useAnnotationStore((state) => state.selectedTool);
  const setSelectedTool = useAnnotationStore((state) => state.setSelectedTool);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide px-1">
          Annotation Tools
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
          Select a tool to start annotating
        </p>
      </div>

      {/* Tools List */}
      <div className="flex-1 space-y-2">
        {tools.map((tool) => {
          const isSelected = selectedTool === tool.type;
          return (
            <button
              key={tool.type}
              onClick={() => setSelectedTool(tool.type)}
              className={`group w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-large scale-105'
                  : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 hover:shadow-medium hover:scale-102'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              {/* Background Decoration */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              )}

              {/* Icon */}
              <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isSelected
                  ? 'bg-white/20'
                  : 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40'
              }`}>
                {tool.svg}
              </div>

              {/* Content */}
              <div className="flex-1 text-left min-w-0 relative z-10">
                <div className="font-semibold text-sm truncate">
                  {tool.label}
                </div>
                <div className={`text-xs mt-0.5 truncate ${
                  isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {tool.description}
                </div>
              </div>

              {/* Keyboard Shortcut Badge */}
              <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 group-hover:text-primary-700 dark:group-hover:text-primary-300'
              }`}>
                {tool.shortcut}
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Helper Text */}
      <div className="card p-4 space-y-2">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Quick Tips
        </div>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-0.5">•</span>
            <span>Use keyboard shortcuts for faster workflow</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-0.5">•</span>
            <span>Press ESC to cancel current action</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-0.5">•</span>
            <span>Double-click polygon to complete</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
