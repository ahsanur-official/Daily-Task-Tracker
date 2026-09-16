import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedRingProgress } from '../common/AnimatedRingProgress';
import { useApp } from '../../context/AppContext';
import {
  Flame,
  Play,
  Pause,
  Square,
  Maximize2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Plus,
  Calendar,
  Sparkles,
  RotateCcw,
  BookOpen,
  Sun,
  Sunrise,
  Sunset,
  LayoutList,
  SlidersHorizontal,
  Tag,
} from 'lucide-react';
import {
  getTimeGreeting,
  formatFullDateLabel,
  formatSecondsToHuman,
  formatSecondsToDigital,
} from '../../utils/time';
import { Motivation } from './Motivation';
import { StreakHeatmap } from './StreakHeatmap';
import { TaskCalendarModal } from '../calendar/TaskCalendarModal';
import { ManualTimeLogModal } from '../time/ManualTimeLogModal';
import { Task } from '../../types';

interface DashboardViewProps {
  onOpenCreateGoal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenCreateGoal }) => {
  const {
    user,
    todayDate,
    todayProgress,
    streakInfo,
    activeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopAndSaveTimer,
    setDistractionFree,
    goals,
    tasks,
    sessions,
    setActiveView,
    updateTask,
    completeTaskToday,
    triggerStreakCelebrationNotification,
  } = useApp();

  const [quickCompletingTaskId, setQuickCompletingTaskId] = useState<string | null>(null);
  const [activeTaskNotesId, setActiveTaskNotesId] = useState<string | null>(null);
  const [selectedTaskForCalendar, setSelectedTaskForCalendar] = useState<Task | null>(null);
  const [selectedTaskForManualLog, setSelectedTaskForManualLog] = useState<string | null>(null);
  const [isManualLogModalOpen, setIsManualLogModalOpen] = useState(false);
  const [taskBucket, setTaskBucket] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [colorLabelFilter, setColorLabelFilter] = useState<string | 'all'>('all');
  const [isCompactDensity, setIsCompactDensity] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    if (!activeTimer) {
      setElapsed(0);
      return;
    }
    const update = () => {
      const running = activeTimer.isRunning
        ? Math.floor((Date.now() - activeTimer.sessionStartTime) / 1000)
        : 0;
      setElapsed(activeTimer.accumulatedSecondsBeforeSession + Math.max(0, running));
    };
    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const greeting = getTimeGreeting();
  const firstName = user?.fullName?.split(' ')[0] || 'Friend';

  const isDayFullyCompleted = todayProgress.isCompleted;

  const activeTimerTask = activeTimer ? tasks.find((t) => t.id === activeTimer.taskId) : null;
  const activeTimerGoal = activeTimerTask ? goals.find((g) => g.id === activeTimerTask.goalId) : null;

  const availableColorLabels = useMemo(() => {
    const map = new Map<string, { label: string; color: string; count: number }>();
    todayProgress.tasks.forEach((tp) => {
      if (tp.goalColorLabel) {
        const existing = map.get(tp.goalColorLabel);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(tp.goalColorLabel, {
            label: tp.goalColorLabel,
            color: tp.goalColor,
            count: 1,
          });
        }
      }
    });
    return Array.from(map.values());
  }, [todayProgress.tasks]);

  const getTaskBucket = (taskObj?: Task): 'morning' | 'afternoon' | 'evening' => {
    const timeStr = taskObj?.preferredTime || taskObj?.deadlineTime;
    if (!timeStr) return 'morning';
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (isNaN(hour)) return 'morning';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const morningTasks = todayProgress.tasks.filter((tp) => {
    const t = tasks.find((item) => item.id === tp.taskId);
    return getTaskBucket(t) === 'morning';
  });

  const afternoonTasks = todayProgress.tasks.filter((tp) => {
    const t = tasks.find((item) => item.id === tp.taskId);
    return getTaskBucket(t) === 'afternoon';
  });

  const eveningTasks = todayProgress.tasks.filter((tp) => {
    const t = tasks.find((item) => item.id === tp.taskId);
    return getTaskBucket(t) === 'evening';
  });

  const filteredTasks = todayProgress.tasks.filter((tp) => {
    if (taskBucket !== 'all') {
      const t = tasks.find((item) => item.id === tp.taskId);
      if (getTaskBucket(t) !== taskBucket) return false;
    }
    if (colorLabelFilter !== 'all') {
      if (tp.goalColorLabel !== colorLabelFilter) return false;
    }
    return true;
  });

  return (
    <div className={`space-y-8 w-full max-w-[1400px] mx-auto pb-16 ${isCompactDensity ? 'compact-mode space-y-5' : ''}`}>
      {/* 1. Header & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stone-400" />
            <span>{formatFullDateLabel(todayDate, user?.timeZone)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile/Desktop Density Toggle */}
          <button
            id="density-toggle-btn"
            type="button"
            onClick={() => setIsCompactDensity(!isCompactDensity)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
            title={isCompactDensity ? 'Switch to Comfortable spacing' : 'Switch to Compact view'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">{isCompactDensity ? 'Compact View' : 'Comfortable'}</span>
          </button>

          {/* Quick Manual Log Button */}
          <button
            id="quick-log-offline-btn"
            type="button"
            onClick={() => {
              setSelectedTaskForManualLog(tasks[0]?.id || null);
              setIsManualLogModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Log offline focused time"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">+ Log Offline</span>
          </button>

          <button
            onClick={onOpenCreateGoal}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-stone-900 dark:bg-amber-500 hover:bg-stone-800 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Goal</span>
          </button>
        </div>
      </div>

      {/* Daily Motivation & Productivity Quote */}
      <Motivation todayDate={todayDate} />

      {/* Active Focus Session Hero Banner (When timer is running or paused) */}
      {activeTimer && activeTimerTask && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-500/10 dark:via-stone-900 dark:to-stone-900 border-2 border-amber-500/30 dark:border-amber-500/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 animate-in slide-in-from-top-3 duration-300">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                activeTimer.isRunning
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${activeTimer.isRunning ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                {activeTimer.isRunning ? 'Session Live' : 'Session Paused'}
              </span>
              {activeTimerGoal && (
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 truncate">
                    • {activeTimerGoal.title}
                  </span>
                  {activeTimerGoal.colorLabel && (
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 inline-flex items-center gap-1"
                      style={{
                        backgroundColor: `${activeTimerGoal.color}18`,
                        borderColor: `${activeTimerGoal.color}40`,
                        color: activeTimerGoal.color,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: activeTimerGoal.color }} />
                      <span>{activeTimerGoal.colorLabel}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-50 truncate">
              {activeTimerTask.title}
            </h2>
            <div className="flex items-center gap-4 text-xs font-mono text-stone-500 dark:text-stone-400">
              <span>Elapsed: <strong className="text-stone-900 dark:text-stone-100 font-bold">{formatSecondsToDigital(elapsed)}</strong></span>
              <span>•</span>
              <span>Target: <strong>{formatSecondsToDigital(activeTimer.targetSeconds)}</strong></span>
            </div>
          </div>

          {/* Banner Controls: Big Pause & Resume Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={pauseTimer}
              disabled={!activeTimer.isRunning}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs ${
                activeTimer.isRunning
                  ? 'bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white cursor-pointer active:scale-95'
                  : 'bg-stone-200/80 dark:bg-stone-800/50 text-stone-400 dark:text-stone-500 cursor-not-allowed opacity-60'
              }`}
              title="Pause Timer"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </button>

            <button
              onClick={resumeTimer}
              disabled={activeTimer.isRunning}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs ${
                !activeTimer.isRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 cursor-pointer active:scale-95 ring-2 ring-amber-400/50 animate-pulse'
                  : 'bg-stone-200/80 dark:bg-stone-800/50 text-stone-400 dark:text-stone-500 cursor-not-allowed opacity-60'
              }`}
              title="Resume Timer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume</span>
            </button>

            <button
              onClick={stopAndSaveTimer}
              className="px-4 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Save session and finish"
            >
              <Square className="w-3.5 h-3.5 fill-current text-rose-500" />
              <span>Finish</span>
            </button>

            <button
              onClick={() => setDistractionFree(true)}
              className="p-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
              title="Open Fullscreen Focus Mode"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Today's Key Metrics Card (Matching Prompt Specification) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Today's Time Progress */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Today's Target
                </span>
              </div>
              {todayProgress.recoverySeconds > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <RotateCcw className="w-3 h-3" />
                  Includes Recovery
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-mono">
                  {formatSecondsToHuman(todayProgress.completedSeconds)}{' '}
                  <span className="text-xl sm:text-2xl font-normal text-stone-400">
                    / {formatSecondsToHuman(todayProgress.totalRequiredSeconds)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      isDayFullyCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {isDayFullyCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                    <span>{isDayFullyCompleted ? 'Day Completed' : 'In Progress'}</span>
                  </span>
                </div>
              </div>

              {/* Animated SVG Ring Chart */}
              <div className="shrink-0 flex items-center">
                <AnimatedRingProgress
                  progress={todayProgress.percentage}
                  size={76}
                  strokeWidth={7}
                  color={isDayFullyCompleted ? '#10b981' : '#f59e0b'}
                  glow={isDayFullyCompleted}
                />
              </div>
            </div>
          </div>

          {/* Subtext Breakdown: Normal vs Recovery */}
          <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-3 border-t border-stone-100 dark:border-stone-800/80">
            <div className="flex items-center gap-4">
              <span>
                Normal:{' '}
                <strong className="text-stone-700 dark:text-stone-300">
                  {formatSecondsToHuman(todayProgress.normalRequiredSeconds)}
                </strong>
              </span>
              {todayProgress.recoverySeconds > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Recovery:{' '}
                  <strong>+{formatSecondsToHuman(todayProgress.recoverySeconds)}</strong>
                </span>
              )}
            </div>

            <div>
              {todayProgress.remainingSeconds > 0 ? (
                <span>
                  Remaining:{' '}
                  <strong className="text-stone-800 dark:text-stone-200">
                    {formatSecondsToHuman(todayProgress.remainingSeconds)}
                  </strong>
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All targets met today!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 2: Streak Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Streak
              </span>
              <span className="text-xs text-stone-400">Best: {streakInfo.bestStreak}d</span>
            </div>

            <div className="flex items-center gap-3.5 my-2">
              <button
                type="button"
                onClick={() => triggerStreakCelebrationNotification()}
                title={
                  streakInfo.isStreakMaintainedToday
                    ? 'Streak extended today! Click to view celebratory animation'
                    : 'Click to preview streak celebration'
                }
                className={`relative w-13 h-13 rounded-2xl flex items-center justify-center transition-all cursor-pointer group ${
                  streakInfo.isStreakMaintainedToday
                    ? 'bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-rose-500/10 border-2 border-orange-500/40 shadow-md shadow-orange-500/20 hover:scale-105 active:scale-95'
                    : 'bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40 hover:bg-orange-100/60 dark:hover:bg-orange-950/60'
                }`}
              >
                {streakInfo.isStreakMaintainedToday && (
                  <motion.div
                    animate={{
                      scale: [1, 1.25, 1],
                      opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 rounded-2xl bg-orange-500/20 blur-[3px] pointer-events-none"
                  />
                )}
                <motion.div
                  animate={
                    streakInfo.isStreakMaintainedToday
                      ? {
                          scale: [1, 1.15, 1, 1.1, 1],
                          rotate: [0, -4, 4, -2, 0],
                        }
                      : { scale: 1 }
                  }
                  transition={{
                    duration: 2.2,
                    repeat: streakInfo.isStreakMaintainedToday ? Infinity : 0,
                    ease: 'easeInOut',
                  }}
                >
                  <Flame
                    className={`w-7 h-7 transition-colors ${
                      streakInfo.isStreakMaintainedToday
                        ? 'text-orange-500 fill-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                        : 'text-orange-400 group-hover:text-orange-500'
                    }`}
                  />
                </motion.div>
                {streakInfo.isStreakMaintainedToday && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                  </span>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono leading-none">
                    {streakInfo.currentStreak}
                  </span>
                  <span className="text-base font-medium text-stone-500">days</span>
                </div>
                <div className="text-xs font-semibold mt-1">
                  {streakInfo.isStreakMaintainedToday ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                      Extended today ✓
                    </span>
                  ) : (
                    <span className="text-stone-500 dark:text-stone-400">
                      Complete today to extend
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveView('calendar')}
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors"
          >
            <span>View Consistency Calendar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recovery Notice banner if user has carried-over debt */}
      {todayProgress.recoverySeconds > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block text-sm mb-0.5">Missed Time Recovery Active</span>
            <span>
              You have{' '}
              <strong className="font-bold">{formatSecondsToHuman(todayProgress.recoverySeconds)}</strong> of
              uncompleted work from earlier this week added to today's schedule. Completing your full quota today will clear this balance and protect your streak!
            </span>
          </div>
        </div>
      )}

      {/* 3. Streaks & Consistency Heatmap (Collapsible to keep Dashboard clean) */}
      <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowHeatmap((prev) => !prev)}
          className="w-full p-4 sm:px-5 flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50/80 dark:hover:bg-stone-800/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="font-bold text-stone-900 dark:text-stone-100">Consistency Heatmap & History</span>
              <span className="text-[11px] text-stone-400 block sm:inline sm:ml-2">
                {streakInfo.currentStreak} day streak • Click to {showHeatmap ? 'collapse' : 'view full 30-day grid'}
              </span>
            </div>
          </div>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 shrink-0">
            <span>{showHeatmap ? 'Hide' : 'Show'}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${showHeatmap ? 'rotate-90' : ''}`} />
          </span>
        </button>

        {showHeatmap && (
          <div className="p-4 sm:p-5 border-t border-stone-200/60 dark:border-stone-800 animate-in fade-in duration-200">
            <StreakHeatmap />
          </div>
        )}
      </div>

      {/* 4. Today's Tasks Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Today's Tasks ({todayProgress.tasks.length})
            </h2>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {todayProgress.tasks.filter((t) => t.isCompleted).length} of{' '}
              {todayProgress.tasks.length} finished
            </span>
          </div>

          {/* Time-of-Day Buckets Navigation */}
          {todayProgress.tasks.length > 0 && (
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-2xl overflow-x-auto text-xs font-semibold">
              <button
                id="bucket-all-btn"
                type="button"
                onClick={() => setTaskBucket('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  taskBucket === 'all'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                All ({todayProgress.tasks.length})
              </button>
              <button
                id="bucket-morning-btn"
                type="button"
                onClick={() => setTaskBucket('morning')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  taskBucket === 'morning'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                <span>Morning ({morningTasks.length})</span>
              </button>
              <button
                id="bucket-afternoon-btn"
                type="button"
                onClick={() => setTaskBucket('afternoon')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  taskBucket === 'afternoon'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-orange-500" />
                <span>Afternoon ({afternoonTasks.length})</span>
              </button>
              <button
                id="bucket-evening-btn"
                type="button"
                onClick={() => setTaskBucket('evening')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  taskBucket === 'evening'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Sunset className="w-3.5 h-3.5 text-indigo-500" />
                <span>Evening ({eveningTasks.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Color Label Category Filter Pills */}
        {availableColorLabels.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-xs font-semibold text-stone-400 flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3 text-amber-500" />
              <span>Category:</span>
            </span>
            <button
              id="label-filter-all-btn"
              type="button"
              onClick={() => setColorLabelFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                colorLabelFilter === 'all'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-transparent shadow-2xs font-bold'
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-stone-300'
              }`}
            >
              All Labels ({todayProgress.tasks.length})
            </button>
            {availableColorLabels.map((lbl) => (
              <button
                key={lbl.label}
                id={`label-filter-${lbl.label.toLowerCase().replace(/\s+/g, '-')}-btn`}
                type="button"
                onClick={() => setColorLabelFilter(colorLabelFilter === lbl.label ? 'all' : lbl.label)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  colorLabelFilter === lbl.label
                    ? 'border-transparent text-white font-bold shadow-2xs'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-stone-300'
                }`}
                style={
                  colorLabelFilter === lbl.label
                    ? { backgroundColor: lbl.color }
                    : undefined
                }
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: lbl.color }}
                />
                <span>{lbl.label}</span>
                <span className="text-[10px] opacity-75">({lbl.count})</span>
              </button>
            ))}
          </div>
        )}

        {todayProgress.tasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-white/40 dark:bg-stone-900/40">
            <Sparkles className="w-8 h-8 mx-auto text-amber-500 mb-3" />
            <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200">
              No tasks scheduled for today
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1 mb-4">
              Create a goal to automatically generate your daily structured tasks and habit schedule.
            </p>
            <button
              onClick={onOpenCreateGoal}
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 text-xs font-semibold shadow-xs"
            >
              Start With One Goal
            </button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-500 text-xs">
            No tasks scheduled matching the current filters{taskBucket !== 'all' ? ` (${taskBucket} bucket)` : ''}{colorLabelFilter !== 'all' ? ` ("${colorLabelFilter}" label)` : ''}.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((tp, idx) => {
                const isTimerActiveOnThisTask = activeTimer && activeTimer.taskId === tp.taskId;
                const isTimerRunningOnThisTask =
                  isTimerActiveOnThisTask && activeTimer.isRunning;
                const isTimerPausedOnThisTask =
                  isTimerActiveOnThisTask && !activeTimer.isRunning;

                const taskObj = tasks.find((t) => t.id === tp.taskId);
                const taskProgressPercent = tp.isCompleted
                  ? 100
                  : Math.min(100, Math.round((tp.completedSeconds / Math.max(1, tp.totalRequiredSeconds)) * 100));

                return (
                  <motion.div
                    key={tp.taskId}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.28, delay: Math.min(idx * 0.04, 0.25) }}
                    className={`rounded-2xl border transition-all ${
                      isCompactDensity ? 'p-3.5 sm:p-4' : 'p-5'
                    } ${
                      tp.isCompleted
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40'
                        : isTimerActiveOnThisTask
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600/60 ring-2 ring-amber-500/20'
                        : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Task Meta & Progress Ring */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* Task Real-time SVG Ring Progress */}
                        <div className="shrink-0">
                          <AnimatedRingProgress
                            progress={taskProgressPercent}
                            size={44}
                            strokeWidth={4.5}
                            color={tp.goalColor}
                            glow={tp.isCompleted}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: tp.goalColor }}
                            />
                            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 truncate">
                              {tp.goalTitle}
                            </span>
                            {/* Custom Color Label Badge */}
                            {tp.goalColorLabel && (
                              <span
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 inline-flex items-center gap-1"
                                style={{
                                  backgroundColor: `${tp.goalColor}18`,
                                  borderColor: `${tp.goalColor}40`,
                                  color: tp.goalColor,
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: tp.goalColor }}
                                />
                                <span>{tp.goalColorLabel}</span>
                              </span>
                            )}
                            {tp.recoverySeconds > 0 && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                +{formatSecondsToHuman(tp.recoverySeconds)} Recovery
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                              {tp.taskTitle}
                            </h3>
                            {tp.isCompleted && (
                              <div className="inline-flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Completed
                                </span>
                                {streakInfo.isStreakMaintainedToday && (
                                  <span
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 dark:text-orange-300 bg-orange-100/90 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 px-2 py-0.5 rounded-full"
                                    title="Task contributed to extending today's streak"
                                  >
                                    <Flame className="w-3 h-3 text-orange-500 fill-orange-500 animate-pulse" />
                                    <span>Streak Active</span>
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Deadline Indicator Pill */}
                            {taskObj?.deadlineTime && (
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  !tp.isCompleted &&
                                  new Date().toTimeString().slice(0, 5) >= taskObj.deadlineTime
                                    ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                                    : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700'
                                }`}
                                title={`Task deadline: ${taskObj.deadlineTime}`}
                              >
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span>
                                  {!tp.isCompleted &&
                                  new Date().toTimeString().slice(0, 5) >= taskObj.deadlineTime
                                    ? `Overdue (${taskObj.deadlineTime})`
                                    : `Due ${taskObj.deadlineTime}`}
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Time Duration Row */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400 mt-2 font-mono">
                            <span>
                              Target: <strong>{formatSecondsToHuman(tp.totalRequiredSeconds)}</strong>
                            </span>
                            <span>•</span>
                            <span className="text-stone-800 dark:text-stone-200">
                              Tracked: <strong>{formatSecondsToHuman(tp.completedSeconds)}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Remaining: <strong>{formatSecondsToHuman(tp.remainingSeconds)}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Individual Task Calendar button */}
                      <button
                        onClick={() => setSelectedTaskForCalendar(taskObj || null)}
                        className="p-2 rounded-xl text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                        title="View Individual Task Continuity Calendar & Missed Days"
                      >
                        <Calendar className="w-4 h-4 text-amber-500" />
                      </button>

                      {/* Notes toggle button */}
                      <button
                        onClick={() =>
                          setActiveTaskNotesId(activeTaskNotesId === tp.taskId ? null : tp.taskId)
                        }
                        className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        title="Task Notes"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>

                      {/* Timer Button Controls */}
                      {tp.isCompleted ? (
                        <div className="flex items-center gap-1.5">
                          <div className="px-3.5 py-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Goal Met</span>
                          </div>
                          {streakInfo.isStreakMaintainedToday && (
                            <button
                              type="button"
                              onClick={() => triggerStreakCelebrationNotification(streakInfo.currentStreak, tp.taskTitle)}
                              className="px-2.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:hover:bg-orange-900/60 border border-orange-200/80 dark:border-orange-900/60 text-orange-700 dark:text-orange-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95"
                              title="Click to view streak celebration animation for this task"
                            >
                              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                              <span className="hidden sm:inline">Streak</span>
                            </button>
                          )}
                        </div>
                      ) : isTimerActiveOnThisTask ? (
                        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-amber-500/10 dark:bg-stone-800/90 border border-amber-400/40 dark:border-amber-500/30 shadow-xs">
                          {/* Live Ticking Time */}
                          <div className="px-2.5 py-1 text-xs font-mono font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isTimerRunningOnThisTask ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                            <span>{formatSecondsToDigital(elapsed)}</span>
                          </div>

                          {/* Pause button */}
                          <button
                            onClick={pauseTimer}
                            disabled={!isTimerRunningOnThisTask}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                              isTimerRunningOnThisTask
                                ? 'bg-stone-900 hover:bg-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600 text-white shadow-xs cursor-pointer active:scale-95'
                                : 'bg-stone-200/80 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed opacity-50'
                            }`}
                            title="Pause timer"
                          >
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pause</span>
                          </button>

                          {/* Resume button */}
                          <button
                            onClick={resumeTimer}
                            disabled={isTimerRunningOnThisTask}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                              isTimerPausedOnThisTask
                                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-xs cursor-pointer active:scale-95 ring-2 ring-amber-400/50 animate-pulse'
                                : 'bg-stone-200/80 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed opacity-50'
                            }`}
                            title="Resume timer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Resume</span>
                          </button>

                          {/* Finish & Save button */}
                          <button
                            onClick={stopAndSaveTimer}
                            className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-700/60 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Finish session and save"
                          >
                            <Square className="w-3.5 h-3.5 fill-current text-rose-500" />
                            <span className="hidden sm:inline">Stop</span>
                          </button>

                          {/* Focus mode button */}
                          <button
                            onClick={() => setDistractionFree(true)}
                            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 transition-colors cursor-pointer"
                            title="Open Fullscreen Focus Mode"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={async () => {
                              setQuickCompletingTaskId(tp.taskId);
                              try {
                                await completeTaskToday(tp.taskId);
                              } finally {
                                setQuickCompletingTaskId(null);
                              }
                            }}
                            disabled={quickCompletingTaskId === tp.taskId}
                            className="px-3 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-95"
                            title="Quick mark task as completed today (extends streak!)"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{quickCompletingTaskId === tp.taskId ? 'Completing...' : 'Mark Done'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTaskForManualLog(tp.taskId);
                              setIsManualLogModalOpen(true);
                            }}
                            className="p-2 sm:px-3 sm:py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Log offline focused session for this task"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span className="hidden sm:inline">Offline</span>
                          </button>

                          <button
                            onClick={() => startTimer(tp.taskId, false)}
                            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-95"
                            title="Start Timer for this task"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Start Timer</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task Notes & Deadline Settings Drawer */}
                  {activeTaskNotesId === tp.taskId && taskObj && (
                    <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800/80 animate-in fade-in space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                        <div>
                          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Daily Deadline Cutoff</span>
                          </label>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            Triggers a browser notification when this time arrives if task is not completed.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="time"
                            value={taskObj.deadlineTime || ''}
                            onChange={(e) =>
                              updateTask(taskObj.id, {
                                deadlineTime: e.target.value || undefined,
                              })
                            }
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                          />
                          {taskObj.deadlineTime && (
                            <button
                              type="button"
                              onClick={() => updateTask(taskObj.id, { deadlineTime: undefined })}
                              className="text-[11px] text-stone-400 hover:text-rose-500 font-medium cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1 block">
                          Task Notes & Learnings
                        </label>
                        <textarea
                          value={taskObj.notes || ''}
                          onChange={(e) => updateTask(taskObj.id, { notes: e.target.value })}
                          placeholder="Write quick notes, links, or learnings for this task..."
                          className="w-full text-xs p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 resize-none h-20"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 5. Active Goals Quick Status Bar */}
      {goals.filter((g) => g.status === 'active').length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5 overflow-hidden shrink-0">
              {goals
                .filter((g) => g.status === 'active')
                .slice(0, 4)
                .map((goal) => (
                  <span
                    key={goal.id}
                    className="inline-block w-4 h-4 rounded-full ring-2 ring-white dark:ring-stone-900"
                    style={{ backgroundColor: goal.color }}
                    title={goal.title}
                  />
                ))}
            </div>
            <div>
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                {goals.filter((g) => g.status === 'active').length} Active Long-term {goals.filter((g) => g.status === 'active').length === 1 ? 'Goal' : 'Goals'}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                Manage milestones, view completion rates, or generate certificates in Goals.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('goals')}
            className="self-end sm:self-center flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 cursor-pointer shrink-0"
          >
            <span>Open Goals</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Individual Task Calendar Modal */}
      {selectedTaskForCalendar && (
        <TaskCalendarModal
          task={selectedTaskForCalendar}
          onClose={() => setSelectedTaskForCalendar(null)}
        />
      )}

      {/* Manual Time Log Modal */}
      <ManualTimeLogModal
        isOpen={isManualLogModalOpen}
        initialTaskId={selectedTaskForManualLog || undefined}
        onClose={() => {
          setIsManualLogModalOpen(false);
          setSelectedTaskForManualLog(null);
        }}
      />
    </div>
  );
};
