import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Table,
  Users,
  Target,
  Clock,
  HardDriveDownload,
  ArrowDownToLine,
} from 'lucide-react';

export const GoogleSheetsSyncCard: React.FC = () => {
  const {
    sheetsStatus,
    connectAndSyncGoogleSheets,
    disconnectGoogleSheets,
    pullUserProfileFromGoogleSheets,
    isOnline,
    user,
  } = useApp();

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSync = async () => {
    setFeedback(null);
    try {
      await connectAndSyncGoogleSheets();
      setFeedback('Backup saved to Google Sheets successfully!');
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback(err?.message || 'Failed to sync with Google Sheets');
      setTimeout(() => setFeedback(null), 7000);
    }
  };

  const handlePullProfile = async () => {
    setFeedback(null);
    setIsPulling(true);
    try {
      const res = await pullUserProfileFromGoogleSheets();
      setFeedback(res.message);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback(err?.message || 'Failed to fetch details from Google Sheets');
      setTimeout(() => setFeedback(null), 7000);
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div
      className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5 gpu-layer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Google Sheets Cloud Backup
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  sheetsStatus.connected
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                }`}
              >
                {sheetsStatus.connected ? 'Active Backup' : 'Ready to Connect'}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xl">
              Mirror your user account details, goals, daily tasks, and recorded focus sessions directly to a private Google Spreadsheet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {sheetsStatus.spreadsheetUrl && (
            <a
              href={sheetsStatus.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors border border-stone-200 dark:border-stone-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Sheets</span>
            </a>
          )}

          {sheetsStatus.connected && (
            <button
              type="button"
              onClick={handlePullProfile}
              disabled={isPulling || sheetsStatus.isSyncing}
              title="Import profile details updated in your Google Sheet"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors border border-stone-200 dark:border-stone-700 disabled:opacity-50"
            >
              <ArrowDownToLine className={`w-3.5 h-3.5 ${isPulling ? 'animate-bounce' : ''}`} />
              <span>{isPulling ? 'Pulling...' : 'Pull Profile'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSync}
            disabled={sheetsStatus.isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sheetsStatus.isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {sheetsStatus.isSyncing
                ? 'Syncing Sheets...'
                : sheetsStatus.connected
                ? 'Sync to Sheets'
                : 'Connect & Backup'}
            </span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            feedback.includes('successfully')
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
          }`}
        >
          {feedback.includes('successfully') ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <span>{feedback}</span>
        </div>
      )}

      {/* Sheets Content Preview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 space-y-1">
          <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-semibold text-xs">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span>User & Profile Data</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Name, email, daily work targets, current streaks, and tier records.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 space-y-1">
          <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-semibold text-xs">
            <Target className="w-3.5 h-3.5 text-amber-500" />
            <span>Goal Roadmap</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            3/7/15/30-day goals, categories, completion milestones, and dates.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 space-y-1">
          <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-semibold text-xs">
            <Table className="w-3.5 h-3.5 text-blue-500" />
            <span>Daily Tasks</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Task titles, required minutes, deadlines, and schedule preferences.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 space-y-1">
          <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-semibold text-xs">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span>Focus Time Logs</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Recorded timestamps, stopwatch sessions, and sync statuses.
          </p>
        </div>
      </div>

      {/* Connection Details & Metadata Footer */}
      <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-2">
          <HardDriveDownload className="w-3.5 h-3.5 text-stone-400" />
          <span>
            {sheetsStatus.lastSynced
              ? `Last backed up to Google Sheets: ${new Date(sheetsStatus.lastSynced).toLocaleString()}`
              : 'Not yet synchronized to Google Sheets'}
          </span>
        </div>

        {sheetsStatus.connected && (
          <button
            type="button"
            onClick={disconnectGoogleSheets}
            className="text-[11px] text-stone-400 hover:text-red-500 transition-colors underline"
          >
            Disconnect Google Sheet
          </button>
        )}
      </div>
    </div>
  );
};
