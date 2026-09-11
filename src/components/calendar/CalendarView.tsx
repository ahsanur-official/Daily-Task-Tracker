import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  Clock,
  RotateCcw,
  X,
  AlertCircle,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react';
import { calculateDayProgress } from '../../utils/recovery';
import {
  formatFullDateLabel,
  formatSecondsToHuman,
  formatDateLabel,
  addDaysToDateString,
  getTodayDateString,
} from '../../utils/time';
import { DayProgressSummary } from '../../types';
import { ScheduleRecommendationsCard } from './ScheduleRecommendationsCard';

export const CalendarView: React.FC = () => {
  const { goals, tasks, sessions, todayDate, user } = useApp();

  // Selected viewing year/month
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    const [y, m] = todayDate.split('-').map(Number);
    return { year: y, month: m }; // 1-indexed month
  });

  const [inspectedDay, setInspectedDay] = useState<DayProgressSummary | null>(() => {
    return calculateDayProgress(todayDate, goals, tasks, sessions, todayDate);
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    setCurrentYearMonth((prev) => {
      if (prev.month === 1) return { year: prev.year - 1, month: 12 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentYearMonth((prev) => {
      if (prev.month === 12) return { year: prev.year + 1, month: 1 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleJumpToToday = () => {
    const [y, m] = todayDate.split('-').map(Number);
    setCurrentYearMonth({ year: y, month: m });
    setInspectedDay(calculateDayProgress(todayDate, goals, tasks, sessions, todayDate));
  };

  // Build grid days for the month
  const { year, month } = currentYearMonth;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDayOfWeek = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sun

  const daySummaries: DayProgressSummary[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const summary = calculateDayProgress(dateStr, goals, tasks, sessions, todayDate);
    daySummaries.push(summary);
  }

  const selectedDateStr = inspectedDay ? inspectedDay.date : todayDate;

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            Consistency Calendar
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Visual record of daily completion, automated deadline scheduling, and streaks.
          </p>
        </div>

        {/* Month Navigation & Jump to Today */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer"
          >
            Jump to Today
          </button>

          <div className="flex items-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-bold text-stone-800 dark:text-stone-200 min-w-[130px] text-center">
              {monthNames[month - 1]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Automated Suggestion & Schedule Recommendations Component */}
      <ScheduleRecommendationsCard selectedDate={selectedDateStr} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Calendar Grid Card */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-stone-400 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank offset cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`offset_${i}`} className="aspect-square rounded-2xl bg-stone-50/50 dark:bg-stone-950/20" />
            ))}

            {daySummaries.map((summary) => {
              const dayNum = Number(summary.date.split('-')[2]);
              const isToday = summary.date === todayDate;
              const isSelected = inspectedDay?.date === summary.date;
              const hasWork = summary.totalRequiredSeconds > 0;
              const isCompleted = summary.isCompleted;
              const isMissed = summary.isMissed;
              const isPartial = summary.isPartiallyCompleted;

              return (
                <button
                  key={summary.date}
                  onClick={() => setInspectedDay(summary)}
                  className={`aspect-square rounded-2xl p-1.5 flex flex-col justify-between items-center transition-all relative group cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-amber-500 shadow-md'
                      : 'hover:bg-stone-100/70 dark:hover:bg-stone-800/60'
                  } ${
                    isToday
                      ? 'border-2 border-stone-900 dark:border-stone-100'
                      : 'border border-stone-100 dark:border-stone-800/60'
                  } ${
                    isCompleted
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
                      : isMissed
                      ? 'bg-red-50/50 dark:bg-red-950/20 text-red-800 dark:text-red-300'
                      : isPartial
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
                      : 'bg-stone-50/40 dark:bg-stone-800/20 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <span className={`text-xs font-semibold ${isToday ? 'font-black underline' : ''}`}>
                    {dayNum}
                  </span>

                  {/* Visual Indicator Icon */}
                  <div className="my-auto">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : summary.recoverySeconds > 0 ? (
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                    ) : isMissed ? (
                      <span className="w-2 h-2 rounded-full bg-red-400 dark:bg-red-500" />
                    ) : hasWork ? (
                      <span className="text-[10px] font-mono text-stone-400">
                        {summary.percentage}%
                      </span>
                    ) : null}
                  </div>

                  {/* Tracked time miniature text */}
                  {summary.completedSeconds > 0 ? (
                    <span className="text-[9px] font-mono text-stone-500 font-semibold truncate">
                      {formatSecondsToHuman(summary.completedSeconds)}
                    </span>
                  ) : (
                    <span className="text-[9px] text-transparent">•</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-around gap-2 text-[11px] text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500" />
              <span>Completed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500" />
              <span>In Progress / Recovery</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-red-400" />
              <span>Missed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md border-2 border-stone-800 dark:border-stone-200" />
              <span>Today</span>
            </span>
          </div>
        </div>

        {/* Day Detail Inspector (Section 16 Specification) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
          {inspectedDay ? (
            <>
              <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                  Daily Summary
                </span>
                <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  {formatFullDateLabel(inspectedDay.date, user?.timeZone)}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      inspectedDay.isCompleted
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : inspectedDay.isMissed
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {inspectedDay.isCompleted
                      ? 'Goal Met ✓'
                      : inspectedDay.isMissed
                      ? 'Missed Target'
                      : 'In Progress'}
                  </span>
                  <span className="text-xs font-mono font-bold text-stone-600 dark:text-stone-300">
                    {inspectedDay.percentage}% Fulfilled
                  </span>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40">
                  <span className="text-stone-500 font-sans">Normal Requirement:</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {formatSecondsToHuman(inspectedDay.normalRequiredSeconds)}
                  </span>
                </div>

                {inspectedDay.recoverySeconds > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 text-amber-900 dark:text-amber-200">
                    <span className="font-sans font-medium flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      Recovery Debt:
                    </span>
                    <span className="font-bold">
                      +{formatSecondsToHuman(inspectedDay.recoverySeconds)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40">
                  <span className="text-stone-500 font-sans">Total Target:</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {formatSecondsToHuman(inspectedDay.totalRequiredSeconds)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200">
                  <span className="font-sans font-medium">Actual Tracked:</span>
                  <span className="font-bold">
                    {formatSecondsToHuman(inspectedDay.completedSeconds)}
                  </span>
                </div>
              </div>

              {/* Tasks On Inspected Day */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                  Scheduled Tasks ({inspectedDay.tasks.length})
                </span>
                {inspectedDay.tasks.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No tasks on this date.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {inspectedDay.tasks.map((tp) => {
                      const taskObj = tasks.find((t) => t.id === tp.taskId);

                      return (
                        <div
                          key={tp.taskId}
                          className="p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-700/60 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                              <span>{tp.taskTitle}</span>
                              {taskObj?.deadlineTime && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  Cutoff {taskObj.deadlineTime}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-400">{tp.goalTitle}</div>
                          </div>
                          <div className="text-right font-mono">
                            <span className={tp.isCompleted ? 'text-emerald-500 font-bold' : 'text-stone-600 dark:text-stone-300'}>
                              {formatSecondsToHuman(tp.completedSeconds)}
                            </span>
                            <span className="text-stone-400 text-[10px] block">
                              / {formatSecondsToHuman(tp.totalRequiredSeconds)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-stone-400 text-xs">
              Select a date on the calendar to inspect its tasks and progress.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

