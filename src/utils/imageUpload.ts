/**
 * Utility for handling image uploads from the local device storage system.
 * Reads the selected File, validates MIME type, resizes/compresses using an HTML5 Canvas,
 * and produces an optimized Base64 Data URL safe for localStorage and retina rendering.
 */

export interface ProcessedImageResult {
  dataUrl: string;
  sizeKb: number;
  fileName: string;
  width: number;
  height: number;
}

export const PRESET_AVATARS = [
  {
    id: 'preset_1',
    label: 'Alex Rivera',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_2',
    label: 'Marcus Chen',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_3',
    label: 'Sophia Taylor',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_4',
    label: 'Elena Rostova',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_5',
    label: 'David Miller',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_6',
    label: 'Aria Patel',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  },
];

/**
 * Reads an image file from the device storage system, resizes it to a square max dimension,
 * and encodes as a clean DataURL.
 */
export function processStorageImageFile(
  file: File,
  maxDimension = 360,
  quality = 0.88
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided from storage system'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image. Please choose a JPG, PNG, WEBP, or GIF.'));
      return;
    }

    // Guard against massive files (> 20MB)
    if (file.size > 20 * 1024 * 1024) {
      reject(new Error('File is too large (> 20MB). Please select an image under 20MB.'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image from device storage.'));
    };

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        reject(new Error('Failed to decode image data. The file might be corrupted.'));
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Crop or scale to square centered view
          const minSide = Math.min(width, height);
          const sx = (width - minSide) / 2;
          const sy = (height - minSide) / 2;

          const targetSize = Math.min(minSide, maxDimension);
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context could not be created'));
            return;
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw cropped centered square
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

          // Convert to WebP or JPEG DataURL
          let mimeType = 'image/jpeg';
          if (file.type === 'image/png' || file.type === 'image/webp') {
            mimeType = 'image/webp';
          }

          const dataUrl = canvas.toDataURL(mimeType, quality);
          const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

          resolve({
            dataUrl,
            sizeKb,
            fileName: file.name,
            width: targetSize,
            height: targetSize,
          });
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Error processing image'));
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
