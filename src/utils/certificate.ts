import { Certificate } from '../types';
import { formatSecondsToHuman, formatFullDateLabel } from './time';

export function renderCertificateToCanvas(
  cert: Certificate,
  canvas: HTMLCanvasElement,
  scale = 2 // 2x for crisp retina display and high-res export
): void {
  const width = 1400 * scale;
  const height = 990 * scale;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.scale(scale, scale);

  const w = 1400;
  const h = 990;

  // Colors based on template
  const isOnyx = cert.template === 'onyx';
  const isEmerald = cert.template === 'emerald';
  const isClassic = cert.template === 'classic';
  // modern is default clean white

  let bgColor = '#ffffff';
  let primaryText = '#1c1917';
  let secondaryText = '#57534e';
  let accentColor = '#b45309'; // Gold
  let borderColor = '#d97706';
  let innerBg = '#fafaf9';

  if (isOnyx) {
    bgColor = '#0c0a09';
    innerBg = '#18181b';
    primaryText = '#f5f5f4';
    secondaryText = '#a8a29e';
    accentColor = '#eab308';
    borderColor = '#ca8a04';
  } else if (isEmerald) {
    bgColor = '#064e3b';
    innerBg = '#022c22';
    primaryText = '#ecfdf5';
    secondaryText = '#6ee7b7';
    accentColor = '#fcd34d';
    borderColor = '#f59e0b';
  } else if (isClassic) {
    bgColor = '#fefcf8';
    innerBg = '#fffbeb';
    primaryText = '#292524';
    secondaryText = '#78716c';
    accentColor = '#b45309';
    borderColor = '#d97706';
  }

  // Draw Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  // Outer Border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, w - 60, h - 60);

  // Decorative double line
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(38, 38, w - 76, h - 76);

  // Inner container background
  ctx.fillStyle = innerBg;
  ctx.fillRect(48, 48, w - 96, h - 96);

  // Corner Ornaments
  const cornerSize = 40;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  // Top left
  ctx.beginPath();
  ctx.moveTo(56, 56 + cornerSize);
  ctx.lineTo(56, 56);
  ctx.lineTo(56 + cornerSize, 56);
  ctx.stroke();
  // Top right
  ctx.beginPath();
  ctx.moveTo(w - 56 - cornerSize, 56);
  ctx.lineTo(w - 56, 56);
  ctx.lineTo(w - 56, 56 + cornerSize);
  ctx.stroke();
  // Bottom left
  ctx.beginPath();
  ctx.moveTo(56, h - 56 - cornerSize);
  ctx.lineTo(56, h - 56);
  ctx.lineTo(56 + cornerSize, h - 56);
  ctx.stroke();
  // Bottom right
  ctx.beginPath();
  ctx.moveTo(w - 56 - cornerSize, h - 56);
  ctx.lineTo(w - 56, h - 56);
  ctx.lineTo(w - 56, h - 56 - cornerSize);
  ctx.stroke();

  // Top App Emblem / Seal
  const centerX = w / 2;
  
  // Seal circle
  ctx.beginPath();
  ctx.arc(centerX, 150, 42, 0, Math.PI * 2);
  ctx.fillStyle = accentColor;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, 150, 37, 0, Math.PI * 2);
  ctx.strokeStyle = isOnyx || isEmerald ? innerBg : '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Star in seal
  ctx.fillStyle = isOnyx || isEmerald ? innerBg : '#ffffff';
  ctx.font = '24px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', centerX, 150);

  // Header Title
  ctx.font = 'bold 16px sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillStyle = accentColor;
  ctx.fillText('DAILY TASK & GOAL TRACKER', centerX, 230);

  // Main Heading: CERTIFICATE OF ACHIEVEMENT
  ctx.font = 'bold 44px serif';
  ctx.fillStyle = primaryText;
  ctx.letterSpacing = '3px';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', centerX, 290);

  // Subtitle
  ctx.font = 'italic 18px serif';
  ctx.fillStyle = secondaryText;
  ctx.letterSpacing = '1px';
  ctx.fillText('This certificate is proudly awarded to', centerX, 345);

  // Recipient Name
  ctx.font = 'bold 48px sans-serif';
  ctx.fillStyle = primaryText;
  ctx.letterSpacing = '1px';
  ctx.fillText(cert.userName.toUpperCase(), centerX, 415);

  // Divider line under name
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 240, 440);
  ctx.lineTo(centerX + 240, 440);
  ctx.stroke();

  // Accomplishment Statement
  ctx.font = '18px sans-serif';
  ctx.fillStyle = secondaryText;
  ctx.fillText('for dedicated consistency, focus, and successful 100% completion of', centerX, 485);

  // Goal Name
  ctx.font = 'bold 36px serif';
  ctx.fillStyle = primaryText;
  ctx.fillText(`"${cert.goalName}"`, centerX, 535);

  // Statistics Grid Pill
  const statsY = 620;
  const colWidth = 220;
  
  // Col 1: Duration
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = primaryText;
  ctx.fillText(`${cert.durationDays} Days`, centerX - colWidth, statsY);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = secondaryText;
  ctx.fillText('GOAL DURATION', centerX - colWidth, statsY + 24);

  // Col 2: Total Time
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = primaryText;
  ctx.fillText(formatSecondsToHuman(cert.totalSecondsTracked), centerX, statsY);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = secondaryText;
  ctx.fillText('TOTAL TRACKED TIME', centerX, statsY + 24);

  // Col 3: Completion
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = primaryText;
  ctx.fillText('100%', centerX + colWidth, statsY);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = secondaryText;
  ctx.fillText('COMPLETION RATE', centerX + colWidth, statsY + 24);

  // Signatures and Verification footer
  const footerY = 780;

  // Left side: Date of completion
  ctx.textAlign = 'left';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = primaryText;
  ctx.fillText(formatFullDateLabel(cert.completionDate), 140, footerY);
  ctx.strokeStyle = secondaryText;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(140, footerY + 8);
  ctx.lineTo(340, footerY + 8);
  ctx.stroke();
  ctx.font = '13px sans-serif';
  ctx.fillStyle = secondaryText;
  ctx.fillText('Date of Completion', 140, footerY + 30);

  // Center: Official Verification Seal Text
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = accentColor;
  ctx.fillText(`VERIFIED ID: ${cert.id}`, centerX, footerY + 10);
  ctx.font = '12px monospace';
  ctx.fillStyle = secondaryText;
  ctx.fillText(`CODE: ${cert.verificationCode}`, centerX, footerY + 30);

  // Right side: Authenticated Signature
  ctx.textAlign = 'right';
  ctx.font = 'italic 26px serif';
  ctx.fillStyle = primaryText;
  ctx.fillText('Daily Tracker Board', w - 140, footerY);
  ctx.strokeStyle = secondaryText;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w - 340, footerY + 8);
  ctx.lineTo(w - 140, footerY + 8);
  ctx.stroke();
  ctx.font = '13px sans-serif';
  ctx.fillStyle = secondaryText;
  ctx.fillText('Authorized Verification', w - 140, footerY + 30);

  // Small bottom validation URL
  ctx.textAlign = 'center';
  ctx.font = '11px sans-serif';
  ctx.fillStyle = secondaryText;
  ctx.fillText(`Verify authenticity online at dailytracker.app/verify/${cert.id}`, centerX, h - 80);

  ctx.restore();
}

export function downloadCertificateAsImage(
  cert: Certificate,
  format: 'png' | 'jpeg' = 'png'
): void {
  const canvas = document.createElement('canvas');
  renderCertificateToCanvas(cert, canvas, 2);

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mimeType, 0.95);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${cert.id}-${cert.userName.replace(/\s+/g, '_')}-Certificate.${format}`;
  a.click();
}
