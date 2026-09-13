import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, CheckCircle, X, Share, PlusSquare, ArrowUpRight } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner' | 'settings';
  className?: string;
  collapsed?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
  collapsed = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already installed as PWA in standalone window, don't show prompt in header
  if (isInstalled && variant !== 'settings') {
    return null;
  }

  if (isInstalled && variant === 'settings') {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
        <CheckCircle className="w-4 h-4 text-emerald-500" />
        <span>Installed as App (Standalone Mode Active)</span>
      </div>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        // If dismissed or need manual guidance, open guide
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${className}`}
          title="Install as App on your device"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleClick}
          title={collapsed ? 'Install App (Optional)' : 'Install as application (Optional)'}
          className={`w-full h-10 rounded-xl border border-stone-200/80 dark:border-stone-800 hover:border-amber-500/50 bg-stone-50/60 dark:bg-stone-850/60 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white font-medium text-xs flex items-center transition-colors cursor-pointer group overflow-hidden ${
            collapsed ? 'justify-center px-0' : 'justify-between px-3'
          } ${className}`}
        >
          <div className="flex items-center min-w-0">
            <Download className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${
                collapsed
                  ? 'opacity-0 max-w-0 -translate-x-2 pointer-events-none ml-0'
                  : 'opacity-100 max-w-28 translate-x-0 ml-2.5'
              }`}
            >
              Install App
            </span>
          </div>
          <span
            className={`text-[10px] text-stone-400 dark:text-stone-500 font-normal transition-all duration-200 ease-out whitespace-nowrap overflow-hidden ${
              collapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-16'
            }`}
          >
            Optional
          </span>
        </button>
      )}

      {variant === 'settings' && (
        <button
          type="button"
          onClick={handleClick}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-colors cursor-pointer shadow-xs ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Install App on this Device</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Install as Standalone App
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Work offline, enjoy instant load times, and access timers straight from your home screen or dock.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Install Now</span>
          </button>
        </div>
      )}

      {/* Guide Modal for iOS Safari and Unsupported Desktop contexts */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src="/pwa-192x192.png" alt="App Icon" className="w-10 h-10 rounded-xl shadow-xs" />
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Install Daily Task Tracker
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Fast, offline-first application for your device
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-950 dark:text-stone-400 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer shrink-0 shadow-xs"
                aria-label="Close modal"
                title="Close modal (Esc)"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 bg-stone-50 dark:bg-stone-950/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300">
                <p className="font-semibold text-stone-900 dark:text-stone-100">
                  How to install on iPhone & iPad:
                </p>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                    1
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Tap the Safari</span>
                    <strong className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 rounded font-semibold text-stone-900 dark:text-stone-100">
                      <Share className="w-3 h-3" /> Share
                    </strong>
                    <span>button at the bottom of the screen.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                    2
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Scroll down and select</span>
                    <strong className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 rounded font-semibold text-stone-900 dark:text-stone-100">
                      <PlusSquare className="w-3 h-3" /> Add to Home Screen
                    </strong>
                    <span>.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                    3
                  </span>
                  <span>Tap <strong>Add</strong> in the top right corner. The app will appear on your Home Screen!</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-stone-50 dark:bg-stone-950/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300">
                <p className="font-semibold text-stone-900 dark:text-stone-100">
                  Direct Installation Options:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    <strong>Chrome / Edge / Brave:</strong> Look for the <strong>Install</strong> icon (<Download className="w-3 h-3 inline text-amber-500" />) in the right side of the URL address bar or browser menu.
                  </li>
                  <li>
                    <strong>Android:</strong> Tap browser menu (⋮) and tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.
                  </li>
                  <li>
                    <strong>Full Window Mode:</strong> Open the application directly in a fresh tab for native installation triggers.
                  </li>
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.open(window.location.href, '_blank')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <span>Open in New Tab</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
