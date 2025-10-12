'use client';

import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadImage } from '@/lib/actions/image-actions';
import { useAnnotationStore } from '@/lib/store/annotation-store';
import type { ImageData } from '@/lib/types';

export function ImageUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const setImage = useAnnotationStore((state) => state.setImage);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return uploadImage(formData);
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        // Load image to get dimensions
        const img = new Image();
        img.onload = () => {
          const imageData: ImageData = {
            ...result.data!,
            width: img.naturalWidth,
            height: img.naturalHeight,
          };
          setImage(imageData);
        };
        img.src = result.data.url;
      } else {
        alert(result.error || 'Upload failed');
      }
    },
    onError: (error) => {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    },
  });

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        uploadMutation.mutate(file);
      }
    },
    [uploadMutation]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadMutation.mutate(file);
      }
    },
    [uploadMutation]
  );

  return (
    <div
      className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
        isDragging
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 scale-105 shadow-large'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-medium'
      } ${uploadMutation.isPending ? 'pointer-events-none' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInput}
        className="hidden"
        id="file-input"
        disabled={uploadMutation.isPending}
      />
      <label
        htmlFor="file-input"
        className="cursor-pointer block"
      >
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            {/* Loading Spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-900"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin"></div>
            </div>
            <div className="text-lg font-medium text-primary-700 dark:text-primary-300">
              Uploading your image...
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Please wait while we process your file
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 animate-fade-in-up">
            {/* Modern Icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-large animate-scale-in">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {/* Decorative circles */}
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-primary-300 opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>

            {/* Text Content */}
            <div className="space-y-2">
              <div className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Drop your image here
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                or click to browse from your device
              </div>
            </div>

            {/* File Info */}
            <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                JPG, PNG, WEBP
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Max 10MB
              </div>
            </div>
          </div>
        )}
      </label>

      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary-500/10 rounded-3xl flex items-center justify-center pointer-events-none">
          <div className="text-primary-700 dark:text-primary-300 text-lg font-medium">
            Drop to upload
          </div>
        </div>
      )}
    </div>
  );
}
