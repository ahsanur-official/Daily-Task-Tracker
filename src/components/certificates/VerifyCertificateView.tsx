import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Search, CheckCircle2, XCircle, Award, Calendar, Clock, ArrowLeft, Copy, Check, Share2 } from 'lucide-react';
import { formatSecondsToHuman, formatFullDateLabel } from '../../utils/time';
import { Certificate } from '../../types';
import { QRCodeView } from '../common/QRCodeView';
import { getCertificateVerifyUrl } from '../../utils/certificate';

export const VerifyCertificateView: React.FC = () => {
  const { certificates, targetVerifyId, setTargetVerifyId, setActiveView, fetchCertificateForVerification } = useApp();
  const [searchId, setSearchId] = useState(targetVerifyId || '');
  const [searchedCert, setSearchedCert] = useState<Certificate | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (targetVerifyId) {
      setSearchId(targetVerifyId);
      const found = certificates.find((c) => c.id.toLowerCase() === targetVerifyId.toLowerCase());
      if (found) {
        setSearchedCert(found);
        setHasSearched(true);
      } else {
        fetchCertificateForVerification(targetVerifyId).then((cert) => {
          setSearchedCert(cert);
          setHasSearched(true);
        });
      }
    }
  }, [targetVerifyId, certificates, fetchCertificateForVerification]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setIsVerifying(true);
    const trimmed = searchId.trim();
    const found = certificates.find((c) => c.id.toLowerCase() === trimmed.toLowerCase());
    if (found) {
      setSearchedCert(found);
    } else {
      const remote = await fetchCertificateForVerification(trimmed);
      setSearchedCert(remote);
    }
    setHasSearched(true);
    setIsVerifying(false);
  };

  const handleCopyLink = () => {
    if (!searchedCert) return;
    const url = getCertificateVerifyUrl(searchedCert.id);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-16">
      {/* Back button */}
      <div>
        <button
          onClick={() => {
            setTargetVerifyId(null);
            setActiveView('certificates');
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Certificates</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Official Certificate Verification Registry
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
          Verify the authenticity, legitimacy, and verified time metrics of certificates issued by the Daily Task & Goal Tracker platform.
        </p>
      </div>

      {/* Verification Search Bar */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Enter Certificate ID (e.g. DT-2026-X89F2M)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full text-sm font-mono pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
        <button
          type="submit"
          disabled={isVerifying}
          className="px-6 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-bold text-sm shadow-xs transition-colors shrink-0 disabled:opacity-60 cursor-pointer"
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      {/* Result Display */}
      {hasSearched && (
        <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-200">
          {searchedCert ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border-2 border-emerald-500/40 shadow-xl space-y-6">
              {/* Authentic Pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Certificate Valid & Verified ✓</span>
                </div>
                <span className="text-xs font-mono font-bold text-stone-400">
                  {searchedCert.id}
                </span>
              </div>

              {/* Verified Details Grid + QR Code */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-stone-400 tracking-wider block">
                      Certified Recipient
                    </span>
                    <div className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                      {searchedCert.userName}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase font-bold text-stone-400 tracking-wider block">
                      Fulfilled Goal Challenge
                    </span>
                    <div className="text-lg font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                      "{searchedCert.goalName}"
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <div>
                      <span className="text-[11px] text-stone-400 font-sans block">Goal Duration</span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-stone-800 dark:text-stone-200">
                        {searchedCert.durationDays} Days (100% completed)
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-stone-400 font-sans block">Total Time Tracked</span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                        {formatSecondsToHuman(searchedCert.totalSecondsTracked)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-stone-400 font-sans block">Completion Date</span>
                      <span className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200">
                        {formatFullDateLabel(searchedCert.completionDate)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-stone-400 font-sans block">Verification Hash</span>
                      <span className="text-xs sm:text-sm font-mono font-bold text-stone-600 dark:text-stone-400 truncate block">
                        {searchedCert.verificationCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code Column */}
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/80 shrink-0">
                  <QRCodeView
                    value={getCertificateVerifyUrl(searchedCert.id)}
                    size={110}
                    showDownload={true}
                    label="Verification QR"
                  />
                  <span className="text-[10px] text-stone-400 text-center mt-1">
                    Scan with phone camera
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-stone-400 text-[11px]">
                  Cryptographically registered on Daily Task & Goal Tracker.
                </span>

                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold cursor-pointer transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-red-200 dark:border-red-900/40 shadow-xs text-center space-y-3">
              <XCircle className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Certificate Record Not Found
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                No issued certificate was found matching ID <strong className="font-mono">{searchId}</strong>. Please verify the ID format and try again.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

