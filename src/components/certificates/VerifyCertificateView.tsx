import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Search, CheckCircle2, XCircle, Award, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { formatSecondsToHuman, formatFullDateLabel } from '../../utils/time';
import { Certificate } from '../../types';

export const VerifyCertificateView: React.FC = () => {
  const { certificates, targetVerifyId, setTargetVerifyId, setActiveView } = useApp();
  const [searchId, setSearchId] = useState(targetVerifyId || '');
  const [searchedCert, setSearchedCert] = useState<Certificate | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (targetVerifyId) {
      setSearchId(targetVerifyId);
      const found = certificates.find((c) => c.id.toLowerCase() === targetVerifyId.toLowerCase());
      setSearchedCert(found || null);
      setHasSearched(true);
    }
  }, [targetVerifyId, certificates]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    const trimmed = searchId.trim().toLowerCase();
    const found = certificates.find((c) => c.id.toLowerCase() === trimmed);
    setSearchedCert(found || null);
    setHasSearched(true);
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
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
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
          className="px-6 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-bold text-sm shadow-xs transition-colors shrink-0"
        >
          Verify
        </button>
      </form>

      {/* Result Display */}
      {hasSearched && (
        <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-200">
          {searchedCert ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border-2 border-emerald-500/40 shadow-xl space-y-6">
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

              {/* Verified Details Grid */}
              <div className="space-y-4 pt-2">
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

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <div>
                    <span className="text-[11px] text-stone-400 font-sans block">Goal Duration</span>
                    <span className="text-sm font-bold font-mono text-stone-800 dark:text-stone-200">
                      {searchedCert.durationDays} Days (100% completed)
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-stone-400 font-sans block">Total Time Tracked</span>
                    <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                      {formatSecondsToHuman(searchedCert.totalSecondsTracked)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-stone-400 font-sans block">Completion Date</span>
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      {formatFullDateLabel(searchedCert.completionDate)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-stone-400 font-sans block">Verification Hash</span>
                    <span className="text-sm font-mono font-bold text-stone-600 dark:text-stone-400">
                      {searchedCert.verificationCode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 text-center text-xs text-stone-400">
                Issued securely by Daily Task & Goal Tracker verification server.
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
