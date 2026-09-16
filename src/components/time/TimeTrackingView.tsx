import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, Calendar, TrendingUp, Download, Play, CheckCircle2, Plus, Tag } from 'lucide-react';
import { formatSecondsToHuman, formatSecondsToDigital, addDaysToDateString } from '../../utils/time';
import { exportSessionsAsCSV } from '../../utils/storage';
import { ManualTimeLogModal } from './ManualTimeLogModal';

export const TimeTrackingView: React.FC = () => {
  const { analytics, sessions, tasks, goals, todayDate } = useApp();
  const [chartViewMode, setChartViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [isManualLogOpen, setIsManualLogOpen] = useState(false);

  // Compute chart bars based on view mode:
  // Day: Last 7 days individually
  // Week: Last 4 weeks
  // Month: Last 6 months
  const chartData: Array<{ label: string; seconds: number; dateStr?: string }> = [];

  if (chartViewMode === 'day') {
    // 7 days
    for (let i = 6; i >= 0; i--) {
      const d = addDaysToDateString(todayDate, -i);
      const daySessions = sessions.filter((s) => s.date === d);
      const totalSecs = daySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
      const dayName = new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short' });
      chartData.push({
        label: i === 0 ? 'Today' : dayName,
        seconds: totalSecs,
        dateStr: d,
      });
    }
  } else if (chartViewMode === 'week') {
    // 4 weeks
    for (let w = 3; w >= 0; w--) {
      const endD = addDaysToDateString(todayDate, -w * 7);
      const startD = addDaysToDateString(endD, -6);
      const weekSessions = sessions.filter((s) => s.date >= startD && s.date <= endD);
      const totalSecs = weekSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
      chartData.push({
        label: w === 0 ? 'This Wk' : `Wk -${w}`,
        seconds: totalSecs,
      });
    }
  } else {
    // 6 months
    const [curYear, curMonth] = todayDate.split('-').map(Number);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 5; m >= 0; m--) {
      let targetMonth = curMonth - m;
      let targetYear = curYear;
      if (targetMonth <= 0) {
        targetMonth += 12;
        targetYear -= 1;
      }
      const monthPrefix = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;
      const monthSessions = sessions.filter((s) => s.date.startsWith(monthPrefix));
      const totalSecs = monthSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
      chartData.push({
        label: monthNames[targetMonth - 1],
        seconds: totalSecs,
      });
    }
  }

  const maxChartSecs = Math.max(3600, ...chartData.map((d) => d.seconds));

  const handleExportCSV = () => {
    exportSessionsAsCSV(sessions, tasks, goals);
  };

  return (
    <div className="space-y-8 w-full max-w-[1400px] mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            Time Tracking
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Audited history of your focused execution and deep work sessions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="open-manual-log-btn"
            type="button"
            onClick={() => setIsManualLogOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log Offline Time</span>
          </button>

          <button
            id="export-csv-btn"
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Core Summary Cards (Prompt Section 14 Specification) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
            Today
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {formatSecondsToHuman(analytics.todaySeconds)}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Live tracked</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
            This Week
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {formatSecondsToHuman(analytics.weekSeconds)}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Past 7 days</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
            This Month
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {formatSecondsToHuman(analytics.monthSeconds)}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Past 30 days</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
            All Time
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {formatSecondsToHuman(analytics.allTimeSeconds)}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Accumulated focus</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Tracked Time Trends
            </h2>
            <p className="text-xs text-stone-500">
              Visual breakdown of time logged across days, weeks, or months.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setChartViewMode(mode)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  chartViewMode === mode
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Minimal Bar Chart */}
        <div className="h-56 flex items-end justify-between gap-3 pt-8 pb-2 px-2">
          {chartData.map((bar, idx) => {
            const heightPct = Math.max(6, Math.round((bar.seconds / maxChartSecs) * 100));
            const isToday = bar.label === 'Today';

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                {/* Tooltip on hover */}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold text-stone-700 dark:text-stone-300 mb-1">
                  {formatSecondsToHuman(bar.seconds)}
                </span>

                <div className="w-full max-w-[48px] bg-stone-100 dark:bg-stone-800 rounded-xl overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className={`w-full rounded-xl transition-all duration-500 ${
                      isToday
                        ? 'bg-amber-500 group-hover:bg-amber-400'
                        : 'bg-stone-800 dark:bg-stone-600 group-hover:bg-amber-500'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>

                <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mt-2 truncate">
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Recorded Time Sessions */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Recorded Time Sessions ({sessions.length})
          </h2>
          <span className="text-xs text-stone-400">Timestamp-accurate records</span>
        </div>

        {sessions.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm">
              No sessions logged yet. Start a task timer on the dashboard or log offline work right now.
            </p>
            <button
              id="empty-log-offline-btn"
              type="button"
              onClick={() => setIsManualLogOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Log First Session</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
            {sessions
              .slice(-12)
              .reverse()
              .map((sess) => {
                const task = tasks.find((t) => t.id === sess.taskId);
                const goal = goals.find((g) => g.id === sess.goalId);

                return (
                  <div
                    key={sess.id}
                    className="py-3 flex items-center justify-between text-xs gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 dark:text-stone-100 truncate">
                            {task?.title || 'Focused Task'}
                          </span>
                          {sess.isOffline && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 shrink-0">
                              Offline
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                          <span>{goal?.title || 'Goal'}</span>
                          <span>•</span>
                          <span>{sess.date}</span>
                          {sess.notes && (
                            <>
                              <span>•</span>
                              <span className="italic truncate max-w-[180px]">{sess.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm">
                        {formatSecondsToHuman(sess.durationSeconds, true)}
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(sess.startTimestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <ManualTimeLogModal
        isOpen={isManualLogOpen}
        onClose={() => setIsManualLogOpen(false)}
      />
    </div>
  );
};
