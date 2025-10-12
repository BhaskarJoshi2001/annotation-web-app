'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ImageData } from '../types';

interface UploadResult {
  success: boolean;
  data?: ImageData;
  error?: string;
}

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  try {
    const file = formData.get('image') as File;

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type' };
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File too large (max 10MB)' };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const id = uuidv4();
    const ext = file.name.split('.').pop();
    const filename = `${id}.${ext}`;
    const filepath = join(uploadDir, filename);

    // Write file
    await writeFile(filepath, buffer);

    // Get image dimensions using sharp (install: npm install sharp)
    // For now, we'll get dimensions on client side

    const imageData: ImageData = {
      id,
      name: file.name,
      filename,
      url: `/uploads/${filename}`,
      width: 0, // Will be set on client
      height: 0, // Will be set on client
      size: file.size,
      uploadedAt: new Date(),
    };

    return { success: true, data: imageData };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Failed to upload image' };
  }
}
