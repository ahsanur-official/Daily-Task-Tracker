import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, pixelFn) {
  // 1. Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // 2. IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // 3. Scanlines
  // Each scanline begins with filter type 0 (None)
  const rawScanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawScanlines[offset++] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      rawScanlines[offset++] = r;
      rawScanlines[offset++] = g;
      rawScanlines[offset++] = b;
      rawScanlines[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawScanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressedData);

  // 4. IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(4 + 4 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crcTarget = buffer.subarray(4, 8 + length);
  const crc = calculateCrc32(crcTarget);
  buffer.writeInt32BE(crc, 8 + length);

  return buffer;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function calculateCrc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) | 0;
}

// Draw Daily Task Tracker Icon:
// Dark background (#0c0a09 or #1c1917), Amber circle, Clock hands, Checkmark
function renderIconPixel(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background
  const bgR = 12, bgG = 10, bgB = 9; // #0c0a09

  if (isMaskable) {
    // Maskable icons fill entire square with background
    const outerR = w * 0.38;
    const innerR = w * 0.32;

    // Check if inside amber ring
    if (dist <= outerR && dist >= innerR) {
      return [245, 158, 11, 255]; // Amber 500
    }
    // Check if inside inner disc
    if (dist < innerR) {
      // Draw clock tick / checkmark in center
      // Checkmark: line from (-0.12*w, 0.02*h) to (-0.02*w, 0.12*h) to (0.14*w, -0.08*h)
      const nx = dx / w;
      const ny = dy / h;

      // Draw checkmark segment 1: (-0.12, 0.02) -> (-0.02, 0.12)
      const dSeg1 = distToSegment(nx, ny, -0.12, 0.02, -0.02, 0.12);
      // Draw checkmark segment 2: (-0.02, 0.12) -> (0.14, -0.08)
      const dSeg2 = distToSegment(nx, ny, -0.02, 0.12, 0.14, -0.08);

      if (Math.min(dSeg1, dSeg2) < 0.035) {
        return [245, 158, 11, 255]; // Amber checkmark
      }

      // Center dot
      if (dist < w * 0.03) {
        return [255, 255, 255, 255];
      }

      return [28, 25, 23, 255]; // Stone 900
    }

    return [bgR, bgG, bgB, 255];
  } else {
    // Standard icon with transparent padding & rounded/circle emblem
    const outerRadius = w * 0.46;
    if (dist > outerRadius) {
      return [0, 0, 0, 0]; // transparent
    }

    const ringOuter = w * 0.44;
    const ringInner = w * 0.38;

    if (dist <= ringOuter && dist >= ringInner) {
      return [245, 158, 11, 255]; // Amber 500
    }

    if (dist < ringInner) {
      const nx = dx / w;
      const ny = dy / h;

      const dSeg1 = distToSegment(nx, ny, -0.14, 0.02, -0.02, 0.14);
      const dSeg2 = distToSegment(nx, ny, -0.02, 0.14, 0.16, -0.10);

      if (Math.min(dSeg1, dSeg2) < 0.04) {
        return [245, 158, 11, 255]; // Amber checkmark
      }

      // Hour hand
      const dClockHand = distToSegment(nx, ny, 0, 0, 0, -0.22);
      if (dClockHand < 0.028 && ny <= 0.01) {
        return [255, 255, 255, 255];
      }

      // Center hub
      if (dist < w * 0.035) {
        return [255, 255, 255, 255];
      }

      return [18, 18, 20, 255]; // dark inner
    }

    return [bgR, bgG, bgB, 255];
  }
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

// Generate PNGs
console.log('Generating PWA icons...');

const png192 = createPng(192, 192, (x, y, w, h) => renderIconPixel(x, y, w, h, false));
fs.writeFileSync('public/pwa-192x192.png', png192);

const png512 = createPng(512, 512, (x, y, w, h) => renderIconPixel(x, y, w, h, false));
fs.writeFileSync('public/pwa-512x512.png', png512);

const pngMaskable512 = createPng(512, 512, (x, y, w, h) => renderIconPixel(x, y, w, h, true));
fs.writeFileSync('public/pwa-maskable-512x512.png', pngMaskable512);

const pngAppleTouch = createPng(180, 180, (x, y, w, h) => renderIconPixel(x, y, w, h, true));
fs.writeFileSync('public/apple-touch-icon.png', pngAppleTouch);

console.log('Successfully generated all PWA icons:');
console.log(' - public/pwa-192x192.png');
console.log(' - public/pwa-512x512.png');
console.log(' - public/pwa-maskable-512x512.png');
console.log(' - public/apple-touch-icon.png');
