import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Download, Printer, ShieldCheck, Check, Sparkles, Copy, QrCode as QrIcon, ExternalLink } from 'lucide-react';
import { Certificate } from '../../types';
import { renderCertificateToCanvas, downloadCertificateAsImage, getCertificateVerifyUrl } from '../../utils/certificate';
import { formatSecondsToHuman, formatFullDateLabel } from '../../utils/time';
import { QRCodeView } from '../common/QRCodeView';

interface CertificateModalProps {
  certificate: Certificate | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, onClose }) => {
  const { setActiveView, setTargetVerifyId } = useApp();
  const [activeTemplate, setActiveTemplate] = useState<Certificate['template']>(
    certificate?.template || 'classic'
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrPanel, setShowQrPanel] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!certificate || !canvasRef.current) return;
    const certWithTemplate: Certificate = {
      ...certificate,
      template: activeTemplate,
    };
    renderCertificateToCanvas(certWithTemplate, canvasRef.current, 1.5);
  }, [certificate, activeTemplate]);

  if (!certificate) return null;

  const verifyUrl = getCertificateVerifyUrl(certificate.id);

  const handleDownload = (format: 'png' | 'jpeg') => {
    const certWithTemplate: Certificate = {
      ...certificate,
      template: activeTemplate,
    };
    downloadCertificateAsImage(certWithTemplate, format);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyVerifyLink = () => {
    navigator.clipboard.writeText(verifyUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleGoToVerification = () => {
    setTargetVerifyId(certificate.id);
    onClose();
    setActiveView('verify');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-4xl shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Top Controls Bar */}
        <div className="p-4 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                Official Certificate of Achievement
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                ID: {certificate.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle QR code quick view */}
            <button
              onClick={() => setShowQrPanel(!showQrPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                showQrPanel
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <QrIcon className="w-3.5 h-3.5" />
              <span>{showQrPanel ? 'Hide QR' : 'Scan QR'}</span>
            </button>

            {/* Template Selector */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-semibold">
              {(['classic', 'modern', 'onyx', 'emerald'] as const).map((tmpl) => (
                <button
                  key={tmpl}
                  onClick={() => setActiveTemplate(tmpl)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                    activeTemplate === tmpl
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  {tmpl}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* QR Code Quick Panel Banner if open */}
        {showQrPanel && (
          <div className="p-4 bg-amber-500/10 dark:bg-stone-800/60 border-b border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-4">
              <QRCodeView
                value={verifyUrl}
                size={90}
                showDownload={false}
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Instant Verification QR Code</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 max-w-sm">
                  Scan with your mobile camera to instantly verify this certificate on the registry.
                </p>
                <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400 truncate max-w-xs sm:max-w-md">
                  {verifyUrl}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyVerifyLink}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold shadow-2xs hover:bg-stone-50 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>

              <button
                onClick={handleGoToVerification}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 text-xs font-bold shadow-2xs hover:bg-stone-800 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Verification</span>
              </button>
            </div>
          </div>
        )}

        {/* Certificate Display Area */}
        <div className="p-4 sm:p-6 bg-stone-100/50 dark:bg-stone-950/50 flex flex-col items-center justify-center overflow-x-auto">
          {/* Printable Element for window.print() */}
          <div id="printable-certificate" className="hidden print:block w-full text-center">
            <h1 style={{ fontSize: '32pt', fontWeight: 'bold' }}>CERTIFICATE OF ACHIEVEMENT</h1>
            <p style={{ fontSize: '16pt', marginTop: '16pt' }}>This certificate is proudly awarded to</p>
            <h2 style={{ fontSize: '28pt', fontWeight: 'bold', textDecoration: 'underline', marginTop: '8pt' }}>
              {certificate.userName}
            </h2>
            <p style={{ fontSize: '16pt', marginTop: '16pt' }}>
              for successful 100% completion of
            </p>
            <h3 style={{ fontSize: '24pt', fontWeight: 'bold', marginTop: '8pt' }}>
              "{certificate.goalName}"
            </h3>
            <p style={{ fontSize: '14pt', marginTop: '16pt' }}>
              Duration: {certificate.durationDays} Days • Total Time Tracked: {formatSecondsToHuman(certificate.totalSecondsTracked)}
            </p>
            <p style={{ fontSize: '12pt', marginTop: '24pt' }}>
              Date: {formatFullDateLabel(certificate.completionDate)} • Certificate ID: {certificate.id} • Verification: {certificate.verificationCode}
            </p>
          </div>

          {/* Canvas Preview */}
          <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-xl border border-stone-200 dark:border-stone-800 bg-white">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 sm:p-6 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleGoToVerification}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verify Legitimacy</span>
            </button>

            <button
              onClick={handleCopyVerifyLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied Link' : 'Share Verification Link'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={() => handleDownload('png')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG (with QR)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

