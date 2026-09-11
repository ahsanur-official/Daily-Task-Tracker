import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  X,
  Play,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ToastItem {
  id: string;
  title: string;
  body: string;
  type?: 'timer_complete' | 'deadline_reached' | 'system';
  taskId?: string;
  timestamp: number;
}

export const NotificationToasts: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { startTimer, setActiveView } = useApp();

  useEffect(() => {
    const handleNotificationEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (!customEvent.detail) return;

      const newToast: ToastItem = {
        ...customEvent.detail,
        id: customEvent.detail.id || `toast-${Date.now()}`,
        timestamp: Date.now(),
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 3)]); // Keep max 4 toasts

      // Auto dismiss after 8 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 8000);
    };

    window.addEventListener('app-notification-event', handleNotificationEvent);
    return () => {
      window.removeEventListener('app-notification-event', handleNotificationEvent);
    };
  }, []);

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleActionClick = (toast: ToastItem) => {
    if (toast.taskId) {
      startTimer(toast.taskId, false);
      setActiveView('dashboard');
    }
    handleDismiss(toast.id);
  };

  if (toasts.length === 0) return null;

  return (
    <div
      id="notification-toast-container"
      className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isTimer = toast.type === 'timer_complete';
        const isDeadline = toast.type === 'deadline_reached';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
              isTimer
                ? 'bg-stone-900/95 text-white border-emerald-500/40 dark:border-emerald-500/50 ring-1 ring-emerald-500/20'
                : isDeadline
                ? 'bg-stone-900/95 text-white border-amber-500/40 dark:border-amber-500/50 ring-1 ring-amber-500/20'
                : 'bg-stone-900/95 text-white border-stone-700'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon badge */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isTimer
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isDeadline
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-stone-800 text-stone-300'
                }`}
              >
                {isTimer ? (
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                ) : isDeadline ? (
                  <Clock className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold truncate text-white">
                    {toast.title}
                  </h4>
                  <button
                    onClick={() => handleDismiss(toast.id)}
                    className="text-stone-400 hover:text-stone-200 transition-colors cursor-pointer p-0.5"
                    title="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  {toast.body}
                </p>

                {/* Quick Action Button for Deadline or Timer */}
                {isDeadline && toast.taskId && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => handleActionClick(toast)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start Timer Now</span>
                    </button>
                    <button
                      onClick={() => handleDismiss(toast.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
