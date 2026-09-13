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

export const DEFAULT_STOCK_PHOTO = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

export function isDefaultStockPhoto(url?: string | null): boolean {
  if (!url) return true;
  return url.includes('photo-1534528741775-53994a69daeb');
}

/**
 * Generates an elegant SVG Data URL with user's initials and a modern amber-to-orange gradient
 */
export function generateInitialsAvatar(name?: string | null): string {
  const clean = (name || 'User').trim();
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  let initials = 'U';
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length >= 2) {
    initials = parts[0].slice(0, 2).toUpperCase();
  } else if (parts.length === 1) {
    initials = parts[0][0].toUpperCase();
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="50%" stop-color="#ea580c" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="44" fill="url(#g)" />
  <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2" />
  <text x="80" y="92" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="54" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="1">${initials}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
  maxDimension = 240,
  quality = 0.82
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
