import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Flame,
  Calendar as CalendarIcon,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  Check,
  TrendingUp,
  X,
  Award,
} from 'lucide-react';
import { calculateDayProgress } from '../../utils/recovery';
import {
  addDaysToDateString,
  formatSecondsToHuman,
  formatDateLabel,
  formatFullDateLabel,
} from '../../utils/time';
import { DayProgressSummary } from '../../types';

interface StreakHeatmapProps {
  className?: string;
}

type ViewRange = 'past30' | 'currentMonth';

export const StreakHeatmap: React.FC<StreakHeatmapProps> = ({ className = '' }) => {
  const { goals, tasks, sessions, todayDate, streakInfo, setActiveView, setSelectedDate } = useApp();
  const [viewRange, setViewRange] = useState<ViewRange>('past30');
  const [inspectedDate, setInspectedDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Generate days based on selected range
  const daysData = useMemo(() => {
    const dates: string[] = [];

    if (viewRange === 'past30') {
      // Past 30 days ending today
      for (let i = 29; i >= 0; i--) {
        dates.push(addDaysToDateString(todayDate, -i));
      }
    } else {
      // Current calendar month up to end of month
      const [yearStr, monthStr] = todayDate.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr);
      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      for (let d = 1; d <= daysInMonth; d++) {
        dates.push(`${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`);
      }
    }

    return dates.map((dateStr) => {
      const summary = calculateDayProgress(dateStr, goals, tasks, sessions, todayDate);
      const totalTasks = summary.tasks.length;
      const completedTasks = summary.tasks.filter((t) => t.isCompleted).length;
      const isToday = dateStr === todayDate;
      const isFuture = dateStr > todayDate;

      // Determine intensity level (0 to 4)
      let intensity = 0;
      if (!isFuture) {
        if (summary.totalRequiredSeconds === 0 && summary.completedSeconds > 0) {
          // Tracked bonus time with no requirement
          intensity = 2;
        } else if (summary.percentage >= 100) {
          intensity = 4;
        } else if (summary.percentage >= 70) {
          intensity = 3;
        } else if (summary.percentage >= 40) {
          intensity = 2;
        } else if (summary.percentage > 0 || summary.completedSeconds > 0) {
          intensity = 1;
        } else {
          intensity = 0;
        }
      }

      return {
        dateStr,
        summary,
        totalTasks,
        completedTasks,
        percentage: summary.percentage,
        completedSeconds: summary.completedSeconds,
        totalRequiredSeconds: summary.totalRequiredSeconds,
        isCompleted: summary.isCompleted,
        isToday,
        isFuture,
        intensity,
      };
    });
  }, [viewRange, todayDate, goals, tasks, sessions]);

  // Aggregate statistics over this window
  const stats = useMemo(() => {
    const pastOrTodayDays = daysData.filter((d) => !d.isFuture);
    const completedDaysCount = pastOrTodayDays.filter((d) => d.intensity === 4).length;
    const partialDaysCount = pastOrTodayDays.filter((d) => d.intensity >= 1 && d.intensity < 4).length;
    const activeDaysCount = pastOrTodayDays.filter((d) => d.intensity > 0).length;
    const totalFocusSeconds = pastOrTodayDays.reduce((acc, d) => acc + d.completedSeconds, 0);
    const consistencyRate = pastOrTodayDays.length > 0
      ? Math.round((activeDaysCount / pastOrTodayDays.length) * 100)
      : 0;

    return {
      totalDays: pastOrTodayDays.length,
      completedDaysCount,
      partialDaysCount,
      activeDaysCount,
      totalFocusSeconds,
      consistencyRate,
    };
  }, [daysData]);

  // Find inspected day summary
  const inspectedDayData = useMemo(() => {
    if (!inspectedDate) return null;
    return daysData.find((d) => d.dateStr === inspectedDate) || null;
  }, [inspectedDate, daysData]);

  // Weekday abbreviations
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Intensity color styling map
  const getIntensityStyles = (item: (typeof daysData)[0]) => {
    if (item.isFuture) {
      return 'bg-stone-50/50 dark:bg-stone-900/40 border-stone-200/40 dark:border-stone-800/40 text-stone-300 dark:text-stone-700 opacity-50 cursor-not-allowed';
    }

    switch (item.intensity) {
      case 4:
        return 'bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-bold border-emerald-700 dark:border-emerald-400 shadow-xs shadow-emerald-600/20';
      case 3:
        return 'bg-emerald-500/85 hover:bg-emerald-500 dark:bg-emerald-600/90 dark:hover:bg-emerald-500 text-white font-semibold border-emerald-500';
      case 2:
        return 'bg-emerald-300/90 hover:bg-emerald-300 dark:bg-emerald-800/80 dark:hover:bg-emerald-700 text-emerald-950 dark:text-emerald-100 font-medium border-emerald-400/80 dark:border-emerald-700';
      case 1:
        return 'bg-emerald-100/90 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50';
      case 0:
      default:
        return 'bg-stone-100/80 hover:bg-stone-200/70 dark:bg-stone-800/50 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200/60 dark:border-stone-800/60';
    }
  };

  const getDayNumber = (dateString: string) => {
    return Number(dateString.split('-')[2]);
  };

  const getWeekdayIndex = (dateString: string) => {
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  };

  // Compute date range label
  const rangeLabel = useMemo(() => {
    if (daysData.length === 0) return '';
    const firstDate = daysData[0].dateStr;
    const lastDate = daysData[daysData.length - 1].dateStr;
    return `${formatDateLabel(firstDate)} — ${formatDateLabel(lastDate)}`;
  }, [daysData]);

  return (
    <div
      id="streak-heatmap-component"
      className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5 transition-all ${className}`}
    >
      {/* 1. Header: Title, Range Toggle & Overview Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Consistency & Streaks Heatmap
            </h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
            <span>{rangeLabel}</span>
            <span>•</span>
            <span>Color intensity reflects daily task completion percentage</span>
          </p>
        </div>

        {/* Controls & Quick Stats */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Range Segmented Control */}
          <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewRange('past30')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewRange === 'past30'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Past 30 Days
            </button>
            <button
              onClick={() => setViewRange('currentMonth')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewRange === 'currentMonth'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              This Month
            </button>
          </div>

          {/* Jump to Full Calendar Button */}
          <button
            onClick={() => setActiveView('calendar')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Open interactive Consistency Calendar"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Calendar</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards for Streak & Month Performance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric A: Active Streak */}
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800/60">
          <div className="flex items-center justify-between text-stone-400 text-[11px] font-semibold mb-1">
            <span>Current Streak</span>
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 font-mono leading-tight">
            {streakInfo.currentStreak} <span className="text-xs font-normal text-stone-400">days</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Best: {streakInfo.bestStreak}d
          </span>
        </div>

        {/* Metric B: Completed Days */}
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800/60">
          <div className="flex items-center justify-between text-stone-400 text-[11px] font-semibold mb-1">
            <span>100% Target Met</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 font-mono leading-tight">
            {stats.completedDaysCount}{' '}
            <span className="text-xs font-normal text-stone-400">/ {stats.totalDays}d</span>
          </div>
          <span className="text-[10px] text-stone-500 dark:text-stone-400">
            {Math.round((stats.completedDaysCount / Math.max(1, stats.totalDays)) * 100)}% perfect days
          </span>
        </div>

        {/* Metric C: Total Focus Time */}
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800/60">
          <div className="flex items-center justify-between text-stone-400 text-[11px] font-semibold mb-1">
            <span>Tracked Focus</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 font-mono leading-tight truncate">
            {formatSecondsToHuman(stats.totalFocusSeconds)}
          </div>
          <span className="text-[10px] text-stone-500 dark:text-stone-400">Past month total</span>
        </div>

        {/* Metric D: Active Consistency */}
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800/60">
          <div className="flex items-center justify-between text-stone-400 text-[11px] font-semibold mb-1">
            <span>Consistency Rate</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 font-mono leading-tight">
            {stats.consistencyRate}%
          </div>
          <span className="text-[10px] text-stone-500 dark:text-stone-400">
            {stats.activeDaysCount} active days
          </span>
        </div>
      </div>

      {/* 3. Heatmap Grid Layout */}
      <div className="space-y-3">
        {/* Heatmap Matrix: Responsive Grid */}
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[340px]">
            {/* Weekday headers for 7-column calendar representation */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
              {weekdays.map((w, idx) => (
                <div
                  key={w}
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    idx === 0 || idx === 6
                      ? 'text-stone-400 dark:text-stone-500'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Grid Tiles */}
            {/* If viewing calendar month, align the first day to its weekday index */}
            <div className="grid grid-cols-7 gap-2">
              {viewRange === 'currentMonth' &&
                Array.from({ length: getWeekdayIndex(daysData[0]?.dateStr || todayDate) }).map(
                  (_, i) => <div key={`empty-${i}`} className="aspect-square rounded-xl opacity-0" />
                )}

              {daysData.map((item) => {
                const dayNum = getDayNumber(item.dateStr);
                const isSelected = inspectedDate === item.dateStr;
                const isHovered = hoveredDate === item.dateStr;
                const intensityClasses = getIntensityStyles(item);

                return (
                  <div key={item.dateStr} className="relative group">
                    <button
                      type="button"
                      disabled={item.isFuture}
                      onClick={() => {
                        if (!item.isFuture) {
                          setInspectedDate(isSelected ? null : item.dateStr);
                        }
                      }}
                      onMouseEnter={() => setHoveredDate(item.dateStr)}
                      onMouseLeave={() => setHoveredDate(null)}
                      className={`w-full aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center p-1 transition-all duration-200 relative border cursor-pointer ${intensityClasses} ${
                        item.isToday
                          ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-stone-900 font-extrabold'
                          : ''
                      } ${isSelected ? 'scale-105 ring-2 ring-stone-900 dark:ring-stone-100 z-10' : ''} ${
                        isHovered ? 'scale-105 z-10' : ''
                      }`}
                      title={`${formatFullDateLabel(item.dateStr)}: ${item.percentage}% completed (${formatSecondsToHuman(item.completedSeconds)})`}
                    >
                      {/* Day Number */}
                      <span className="text-xs sm:text-sm leading-none">{dayNum}</span>

                      {/* Micro Icon: Checkmark or Flame on high completion */}
                      {item.intensity === 4 && (
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3] mt-0.5" />
                      )}

                      {/* Today Indicator Dot if not 100% yet */}
                      {item.isToday && item.intensity < 4 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5 animate-pulse" />
                      )}
                    </button>

                    {/* Rich Floating Tooltip on Hover (Desktop) */}
                    {isHovered && !inspectedDate && (
                      <div className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 pointer-events-none w-48 p-2.5 rounded-xl bg-stone-900 dark:bg-stone-800 text-white text-xs shadow-xl border border-stone-700/80 animate-in fade-in duration-150">
                        <div className="font-bold border-b border-stone-700/60 pb-1 mb-1 text-[11px] text-stone-300">
                          {formatDateLabel(item.dateStr)} {item.isToday && '(Today)'}
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="text-stone-400">Completion:</span>
                            <span className="font-bold text-emerald-400">{item.percentage}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-stone-400">Time Tracked:</span>
                            <span className="font-mono">{formatSecondsToHuman(item.completedSeconds)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-stone-400">Tasks:</span>
                            <span>
                              {item.completedTasks}/{item.totalTasks} done
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Color Intensity Legend & Quick Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-stone-500 dark:text-stone-400 border-t border-stone-100 dark:border-stone-800">
          {/* Intensity Color Ramp */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-stone-400 mr-1">Completion:</span>
            <span className="text-[10px] text-stone-400">0%</span>
            <div
              className="w-4 h-4 rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              title="0% or Rest"
            />
            <div
              className="w-4 h-4 rounded-md bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900/60"
              title="1% - 39% completed"
            />
            <div
              className="w-4 h-4 rounded-md bg-emerald-300 dark:bg-emerald-800 border border-emerald-400 dark:border-emerald-700"
              title="40% - 69% completed"
            />
            <div
              className="w-4 h-4 rounded-md bg-emerald-500 dark:bg-emerald-600 border border-emerald-500"
              title="70% - 99% completed"
            />
            <div
              className="w-4 h-4 rounded-md bg-emerald-600 dark:bg-emerald-500 border border-emerald-700 shadow-xs"
              title="100% Target Met"
            />
            <span className="text-[10px] text-stone-400 ml-1">100%</span>
          </div>

          {/* Today indicator key */}
          <div className="flex items-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md ring-2 ring-amber-500 inline-block bg-white dark:bg-stone-800" />
              <span>Today</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
              <span>Goal Met</span>
            </span>
          </div>
        </div>
      </div>

      {/* 5. Interactive Inspected Day Details Drawer/Card */}
      {inspectedDayData && (
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700/80 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200/80 dark:border-stone-700">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                {getDayNumber(inspectedDayData.dateStr)}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                  {formatFullDateLabel(inspectedDayData.dateStr)}
                </h4>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  {inspectedDayData.isToday ? 'Today’s Active Record' : 'Historical Progress Entry'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedDate(inspectedDayData.dateStr);
                  setActiveView('calendar');
                }}
                className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Day</span>
                <ChevronRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setInspectedDate(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
                title="Close day details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics for the inspected day */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-700/60">
              <span className="text-[10px] text-stone-400 block">Completion</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {inspectedDayData.percentage}%
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-700/60">
              <span className="text-[10px] text-stone-400 block">Tracked Time</span>
              <span className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono">
                {formatSecondsToHuman(inspectedDayData.completedSeconds)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-700/60">
              <span className="text-[10px] text-stone-400 block">Required Time</span>
              <span className="text-sm font-bold text-stone-600 dark:text-stone-300 font-mono">
                {formatSecondsToHuman(inspectedDayData.totalRequiredSeconds)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-700/60">
              <span className="text-[10px] text-stone-400 block">Tasks Completed</span>
              <span className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono">
                {inspectedDayData.completedTasks} / {inspectedDayData.totalTasks}
              </span>
            </div>
          </div>

          {/* Task Progress List on That Day */}
          {inspectedDayData.summary.tasks.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 block">
                Scheduled Tasks:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {inspectedDayData.summary.tasks.map((task) => (
                  <div
                    key={task.taskId}
                    className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: task.goalColor }}
                        />
                        <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                          {task.taskTitle}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 block truncate ml-3.5">
                        {task.goalTitle}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          task.isCompleted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                        }`}
                      >
                        {formatSecondsToHuman(task.completedSeconds)} /{' '}
                        {formatSecondsToHuman(task.totalRequiredSeconds)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-stone-400">
              No tasks were scheduled for this day.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
