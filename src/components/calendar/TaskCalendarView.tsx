import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, Goal, TimeSession } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Calendar as CalendarIcon,
  Play,
  Sparkles,
  Info,
  Check,
  Award,
} from 'lucide-react';
import {
  formatFullDateLabel,
  formatSecondsToHuman,
  formatSecondsToDigital,
  addDaysToDateString,
  getTodayDateString,
} from '../../utils/time';

interface TaskCalendarViewProps {
  task: Task;
  goal?: Goal;
  onSelectTask?: (task: Task) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export type TaskDayStatus =
  | 'continued'
  | 'missed'
  | 'partial'
  | 'today-pending'
  | 'upcoming'
  | 'outside-goal';

export interface TaskDayDetail {
  date: string;
  dayNum: number;
  status: TaskDayStatus;
  requiredSeconds: number;
  completedSeconds: number;
  percentage: number;
  isToday: boolean;
  sessions: TimeSession[];
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  task,
  goal: propGoal,
  onSelectTask,
  onClose,
  isModal = false,
}) => {
  const { goals, tasks, sessions, todayDate, user, startTimer, activeTimer } = useApp();

  // Find goal if not provided
  const goal = useMemo(() => {
    return propGoal || goals.find((g) => g.id === task.goalId);
  }, [propGoal, goals, task.goalId]);

  // Selected year and month for calendar navigation
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    const [y, m] = todayDate.split('-').map(Number);
    return { year: y, month: m };
  });

  const [selectedDate, setSelectedDate] = useState<string>(todayDate);

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
    setSelectedDate(todayDate);
  };

  // Sessions specifically belonging to this task
  const taskSessions = useMemo(() => {
    return sessions.filter((s) => s.taskId === task.id);
  }, [sessions, task.id]);

  const requiredSecondsPerDay = task.requiredDurationMinutes * 60;

  // Calculate task-specific statistics across its entire active lifespan
  const stats = useMemo(() => {
    if (!goal) {
      return {
        totalContinued: 0,
        totalMissed: 0,
        totalPartial: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalSecondsTracked: 0,
        completionRate: 0,
      };
    }

    let cursor = goal.startDate;
    const endLimit = goal.endDate < todayDate ? goal.endDate : todayDate;
    let continuedCount = 0;
    let missedCount = 0;
    let partialCount = 0;
    let currentStreakCount = 0;
    let maxStreak = 0;
    let runningStreak = 0;
    let totalTracked = 0;
    let activePastDays = 0;

    while (cursor <= endLimit) {
      const dayTracked = taskSessions
        .filter((s) => s.date === cursor)
        .reduce((acc, s) => acc + s.durationSeconds, 0);

      totalTracked += dayTracked;

      if (cursor < todayDate) {
        activePastDays++;
        if (dayTracked >= requiredSecondsPerDay) {
          continuedCount++;
          runningStreak++;
          if (runningStreak > maxStreak) maxStreak = runningStreak;
        } else if (dayTracked > 0) {
          partialCount++;
          runningStreak = 0;
        } else {
          missedCount++;
          runningStreak = 0;
        }
      } else if (cursor === todayDate) {
        if (dayTracked >= requiredSecondsPerDay) {
          continuedCount++;
          runningStreak++;
          if (runningStreak > maxStreak) maxStreak = runningStreak;
        }
      }

      cursor = addDaysToDateString(cursor, 1);
    }

    currentStreakCount = runningStreak;

    const rate =
      activePastDays > 0 ? Math.round((continuedCount / activePastDays) * 100) : 0;

    return {
      totalContinued: continuedCount,
      totalMissed: missedCount,
      totalPartial: partialCount,
      currentStreak: currentStreakCount,
      bestStreak: maxStreak,
      totalSecondsTracked: totalTracked,
      completionRate: Math.min(100, rate),
    };
  }, [goal, todayDate, taskSessions, requiredSecondsPerDay]);

  // Build the day grid for the active month
  const { year, month } = currentYearMonth;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDayOfWeek = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  const daysGrid: TaskDayDetail[] = useMemo(() => {
    const list: TaskDayDetail[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const daySessions = taskSessions.filter((s) => s.date === dateStr);
      const completed = daySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
      const isToday = dateStr === todayDate;

      let status: TaskDayStatus = 'outside-goal';

      if (goal && (dateStr < goal.startDate || dateStr > goal.endDate)) {
        status = 'outside-goal';
      } else if (dateStr > todayDate) {
        status = 'upcoming';
      } else if (isToday) {
        if (completed >= requiredSecondsPerDay) {
          status = 'continued';
        } else if (completed > 0) {
          status = 'partial';
        } else {
          status = 'today-pending';
        }
      } else {
        // Past date
        if (completed >= requiredSecondsPerDay) {
          status = 'continued';
        } else if (completed > 0) {
          status = 'partial';
        } else {
          status = 'missed';
        }
      }

      const percentage =
        requiredSecondsPerDay > 0
          ? Math.min(100, Math.round((completed / requiredSecondsPerDay) * 100))
          : 100;

      list.push({
        date: dateStr,
        dayNum: d,
        status,
        requiredSeconds: requiredSecondsPerDay,
        completedSeconds: completed,
        percentage,
        isToday,
        sessions: daySessions,
      });
    }

    return list;
  }, [year, month, daysInMonth, taskSessions, todayDate, goal, requiredSecondsPerDay]);

  // Currently inspected day detail
  const inspectedDayDetail = useMemo(() => {
    return daysGrid.find((d) => d.date === selectedDate) || null;
  }, [daysGrid, selectedDate]);

  const isTimerRunningOnThisTask =
    activeTimer && activeTimer.taskId === task.id && activeTimer.isRunning;

  return (
    <div className="space-y-6 w-full">
      {/* 1. Quick Task Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {goal && (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: goal.themeColor }}
              />
            )}
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              {goal?.title || 'Task Continuity'}
            </span>
            <span className="text-xs text-stone-300 dark:text-stone-600">•</span>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
              {task.requiredDurationMinutes} mins/day
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            {task.title}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Individual task calendar showing continuity history, completed streaks, and missed days.
          </p>
        </div>

        {/* Month Navigation & Jump to Today */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
          >
            Today
          </button>

          <div className="flex items-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-1 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200 min-w-[120px] text-center">
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

      {/* Task Switcher Chips if other tasks exist */}
      {tasks.length > 1 && onSelectTask && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Switch Task Calendar
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {tasks.map((t) => {
              const isCurrent = t.id === task.id;
              const tGoal = goals.find((g) => g.id === t.goalId);
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 shadow-xs'
                      : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: tGoal?.themeColor || '#f59e0b' }}
                  />
                  <span>{t.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Key Continuity Stats for This Task */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Streak */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Current Streak</span>
            <Flame className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-stone-900 dark:text-stone-100">
            {stats.currentStreak} <span className="text-xs font-normal text-stone-400">days</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">
            Best: {stats.bestStreak} days
          </span>
        </div>

        {/* Continued Days */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Continued (Done)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-900 dark:text-emerald-200">
            {stats.totalContinued} <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">days</span>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 block">
            {stats.completionRate}% continuity rate
          </span>
        </div>

        {/* Missed Days */}
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-800 dark:text-rose-300 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Missed Days</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-900 dark:text-rose-200">
            {stats.totalMissed} <span className="text-xs font-normal text-rose-600 dark:text-rose-400">days</span>
          </div>
          <span className="text-[10px] text-rose-700 dark:text-rose-400 mt-0.5 block">
            {stats.totalPartial > 0 ? `+${stats.totalPartial} partial days` : '0 partial days'}
          </span>
        </div>

        {/* Tracked Time */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Time</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold font-mono text-stone-900 dark:text-stone-100">
            {formatSecondsToHuman(stats.totalSecondsTracked)}
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">
            Target: {task.requiredDurationMinutes}m/day
          </span>
        </div>
      </div>

      {/* 3. Monthly Calendar Grid + Day Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
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
              <div
                key={`offset_${i}`}
                className="aspect-square rounded-2xl bg-stone-50/50 dark:bg-stone-950/20"
              />
            ))}

            {daysGrid.map((day) => {
              const isSelected = selectedDate === day.date;
              const isContinued = day.status === 'continued';
              const isMissed = day.status === 'missed';
              const isPartial = day.status === 'partial';
              const isUpcoming = day.status === 'upcoming';
              const isTodayPending = day.status === 'today-pending';
              const isOutside = day.status === 'outside-goal';

              let cellBg = 'bg-stone-50/40 dark:bg-stone-800/20 text-stone-600 dark:text-stone-400';
              let badgeText = '';

              if (isContinued) {
                cellBg = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-900 dark:text-emerald-100';
                badgeText = '✓';
              } else if (isMissed) {
                cellBg = 'bg-rose-500/15 border-rose-500/30 text-rose-900 dark:text-rose-200';
                badgeText = 'Missed';
              } else if (isPartial) {
                cellBg = 'bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200';
                badgeText = 'Part';
              } else if (isTodayPending) {
                cellBg = 'bg-amber-50 dark:bg-stone-800 border-amber-400/50 text-stone-900 dark:text-stone-100';
                badgeText = 'Today';
              } else if (isOutside) {
                cellBg = 'opacity-30 bg-stone-100/30 dark:bg-stone-950/20 text-stone-400';
              }

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`aspect-square rounded-2xl p-1.5 flex flex-col justify-between items-center transition-all relative group cursor-pointer border ${
                    isSelected
                      ? 'ring-2 ring-amber-500 shadow-md z-10'
                      : 'hover:scale-102 hover:shadow-2xs'
                  } ${day.isToday ? 'border-2 border-stone-900 dark:border-stone-100' : 'border-stone-200/60 dark:border-stone-800/60'} ${cellBg}`}
                >
                  <div className="w-full flex items-center justify-between px-0.5">
                    <span
                      className={`text-xs font-semibold ${
                        day.isToday ? 'font-black underline' : ''
                      }`}
                    >
                      {day.dayNum}
                    </span>
                    {day.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </div>

                  {/* Status Indicator Icon / Text */}
                  <div className="my-auto flex flex-col items-center">
                    {isContinued && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                    {isMissed && (
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    )}
                    {isPartial && (
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    )}
                    {isTodayPending && (
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </div>

                  {/* Tracked Time footer or percentage */}
                  <div className="text-[9px] font-mono leading-none">
                    {day.completedSeconds > 0 ? (
                      <span className="font-bold">
                        {formatSecondsToHuman(day.completedSeconds)}
                      </span>
                    ) : isMissed ? (
                      <span className="font-bold text-rose-600 dark:text-rose-400">0m</span>
                    ) : (
                      <span className="opacity-0">•</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Calendar Color Legend */}
          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-around gap-2 text-[11px] text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">Continued (Done)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-500" />
              <span className="font-semibold text-rose-700 dark:text-rose-300">Missed Day</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500" />
              <span className="font-semibold text-amber-700 dark:text-amber-300">Partial</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md border-2 border-stone-800 dark:border-stone-200" />
              <span>Today</span>
            </span>
          </div>
        </div>

        {/* Selected Day Inspector */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
          {inspectedDayDetail ? (
            <>
              <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Inspected Date Details
                </span>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {formatFullDateLabel(inspectedDayDetail.date, user?.timeZone)}
                </h3>

                {/* Status Banner */}
                <div className="mt-3">
                  {inspectedDayDetail.status === 'continued' && (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Continued Streak ✓ (Task 100% Completed)</span>
                    </div>
                  )}

                  {inspectedDayDetail.status === 'missed' && (
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>Missed Task (0 minutes logged on this day)</span>
                    </div>
                  )}

                  {inspectedDayDetail.status === 'partial' && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Partially Completed ({inspectedDayDetail.percentage}% of quota)</span>
                    </div>
                  )}

                  {inspectedDayDetail.status === 'today-pending' && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Scheduled for Today — Ready to track</span>
                    </div>
                  )}

                  {inspectedDayDetail.status === 'upcoming' && (
                    <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-medium flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>Upcoming scheduled date</span>
                    </div>
                  )}

                  {inspectedDayDetail.status === 'outside-goal' && (
                    <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-500 text-xs font-medium">
                      Date is outside this goal's active challenge timeline.
                    </div>
                  )}
                </div>
              </div>

              {/* Time Breakdown for this Day */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400">Target Required:</span>
                  <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                    {formatSecondsToHuman(inspectedDayDetail.requiredSeconds)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400">Completed Time:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatSecondsToHuman(inspectedDayDetail.completedSeconds)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      inspectedDayDetail.status === 'continued'
                        ? 'bg-emerald-500'
                        : inspectedDayDetail.status === 'missed'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${inspectedDayDetail.percentage}%` }}
                  />
                </div>
              </div>

              {/* Recorded Sessions on this Date */}
              <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                  Logged Sessions ({inspectedDayDetail.sessions.length})
                </span>

                {inspectedDayDetail.sessions.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">
                    No time tracking sessions recorded for this task on this date.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {inspectedDayDetail.sessions.map((session, idx) => (
                      <div
                        key={session.id}
                        className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700/60 text-xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-mono font-bold text-[10px]">
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-stone-800 dark:text-stone-200 block">
                              {formatSecondsToHuman(session.durationSeconds)}
                            </span>
                            {session.notes && (
                              <span className="text-[11px] text-stone-500 dark:text-stone-400 block truncate max-w-[140px]">
                                {session.notes}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                          Verified ✓
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button: Start Focus Timer if today */}
              {inspectedDayDetail.isToday && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => startTimer(task.id, task.requiredDurationMinutes * 60)}
                    disabled={isTimerRunningOnThisTask}
                    className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                      isTimerRunningOnThisTask
                        ? 'bg-emerald-500 text-white cursor-not-allowed opacity-80'
                        : 'bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {isTimerRunningOnThisTask ? 'Session in Progress' : 'Start Focus Timer'}
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-stone-400 italic">Select a day to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
};
