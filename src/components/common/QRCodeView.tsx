import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode as QrIcon } from 'lucide-react';

interface QRCodeViewProps {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
  showDownload?: boolean;
  label?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 140,
  className = '',
  darkColor = '#1c1917',
  lightColor = '#ffffff',
  showDownload = false,
  label,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;

    QRCode.toDataURL(
      value,
      {
        width: size * 2, // 2x for retina sharpness
        margin: 1,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: 'M',
      },
      (err, url) => {
        if (err) {
          setError('Failed to generate QR code');
        } else {
          setDataUrl(url);
          setError(null);
        }
      }
    );
  }, [value, size, darkColor, lightColor]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qr-code-${encodeURIComponent(value.slice(0, 16))}.png`;
    a.click();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-3 text-stone-400 text-xs text-center border border-dashed rounded-xl">
        <QrIcon className="w-5 h-5 mb-1 opacity-50" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className="p-2.5 rounded-2xl bg-white shadow-xs border border-stone-200 dark:border-stone-700 flex items-center justify-center transition-all hover:scale-102"
        style={{ width: size + 20, height: size + 20 }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="Verification QR Code"
            width={size}
            height={size}
            className="rounded-lg block select-none"
          />
        ) : (
          <div
            className="animate-pulse bg-stone-100 dark:bg-stone-800 rounded-lg"
            style={{ width: size, height: size }}
          />
        )}
      </div>

      {label && (
        <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 text-center">
          {label}
        </span>
      )}

      {showDownload && dataUrl && (
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <Download className="w-3 h-3" />
          <span>Save QR Code</span>
        </button>
      )}
    </div>
  );
};
