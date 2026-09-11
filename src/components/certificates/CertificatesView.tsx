import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Award, ShieldCheck, Download, Calendar, Clock, Eye, Sparkles } from 'lucide-react';
import { Certificate } from '../../types';
import { formatSecondsToHuman, formatFullDateLabel } from '../../utils/time';
import { CertificateModal } from './CertificateModal';

export const CertificatesView: React.FC = () => {
  const { certificates, setActiveView } = useApp();
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            Earned Certificates ({certificates.length})
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Verified proof of completed goals, tracked hours, and daily consistency.
          </p>
        </div>

        <button
          onClick={() => setActiveView('verify')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-xs transition-colors shadow-xs"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Verify Any Certificate</span>
        </button>
      </div>

      {certificates.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 bg-white/40 dark:bg-stone-900/40">
          <Award className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200">
            No certificates earned yet
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            Complete all daily tasks across a goal's timeline to unlock an official verified Certificate of Achievement.
          </p>
          <button
            onClick={() => setActiveView('goals')}
            className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 text-xs font-semibold"
          >
            Explore Goals
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              onClick={() => setSelectedCert(cert)}
              className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Decorative Corner Ribbon */}
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/10 rounded-full flex items-end justify-start p-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900">
                    {cert.id}
                  </span>
                  <span className="text-xs text-stone-400">
                    {cert.durationDays} Days Goal
                  </span>
                </div>

                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {cert.goalName}
                </h3>

                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Awarded to <strong className="text-stone-700 dark:text-stone-300">{cert.userName}</strong>
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800/80 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40">
                    <span className="text-[10px] text-stone-400 uppercase font-sans block">Total Time</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {formatSecondsToHuman(cert.totalSecondsTracked)}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40">
                    <span className="text-[10px] text-stone-400 uppercase font-sans block">Completed</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">100% Fulfilled</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-stone-400">
                    Issued on {formatFullDateLabel(cert.completionDate)}
                  </span>
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1 group-hover:underline">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View & Export</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Viewer Modal */}
      <CertificateModal certificate={selectedCert} onClose={() => setSelectedCert(null)} />
    </div>
  );
};
