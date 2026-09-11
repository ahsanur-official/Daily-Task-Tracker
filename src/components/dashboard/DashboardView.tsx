import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  getTimeGreeting,
  formatFullDateLabel,
  formatSecondsToHuman,
  formatSecondsToDigital,
} from '../../utils/time';
import { DailyQuote } from './DailyQuote';
import { StreakHeatmap } from './StreakHeatmap';

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
  } = useApp();

  const [activeTaskNotesId, setActiveTaskNotesId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

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

  return (
    <div className="space-y-8 w-full max-w-[1400px] mx-auto pb-16">
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

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateGoal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-amber-500 hover:bg-stone-800 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-bold text-sm shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Goal</span>
          </button>
        </div>
      </div>

      {/* Daily Motivational Quote */}
      <DailyQuote todayDate={todayDate} />

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
                <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 truncate">
                  • {activeTimerGoal.title}
                </span>
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
        <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs relative overflow-hidden">
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

          <div className="flex items-baseline justify-between mb-2">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-mono">
              {formatSecondsToHuman(todayProgress.completedSeconds)}{' '}
              <span className="text-xl sm:text-2xl font-normal text-stone-400">
                / {formatSecondsToHuman(todayProgress.totalRequiredSeconds)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {todayProgress.percentage}%
              </span>
              <span className="text-xs text-stone-400 block">Completed</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden my-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDayFullyCompleted ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, todayProgress.percentage)}%` }}
            />
          </div>

          {/* Subtext Breakdown: Normal vs Recovery */}
          <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800/80">
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

            <div className="flex items-center gap-3 my-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40 flex items-center justify-center">
                <Flame className="w-7 h-7 text-orange-500 fill-orange-500" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono leading-none">
                  {streakInfo.currentStreak}{' '}
                  <span className="text-base font-medium text-stone-500">days</span>
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {streakInfo.isStreakMaintainedToday
                    ? 'Extended today ✓'
                    : 'Complete today to maintain'}
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

      {/* 3. Streaks & Consistency Heatmap (Past Month Progress) */}
      <StreakHeatmap />

      {/* 4. Today's Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Today's Tasks ({todayProgress.tasks.length})
          </h2>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {todayProgress.tasks.filter((t) => t.isCompleted).length} of{' '}
            {todayProgress.tasks.length} finished
          </span>
        </div>

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
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {todayProgress.tasks.map((tp) => {
              const isTimerActiveOnThisTask = activeTimer && activeTimer.taskId === tp.taskId;
              const isTimerRunningOnThisTask =
                isTimerActiveOnThisTask && activeTimer.isRunning;
              const isTimerPausedOnThisTask =
                isTimerActiveOnThisTask && !activeTimer.isRunning;

              const taskObj = tasks.find((t) => t.id === tp.taskId);

              return (
                <div
                  key={tp.taskId}
                  className={`p-5 rounded-2xl border transition-all ${
                    tp.isCompleted
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40'
                      : isTimerActiveOnThisTask
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600/60 ring-2 ring-amber-500/20'
                      : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Task Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: tp.goalColor }}
                        />
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400 truncate">
                          {tp.goalTitle}
                        </span>
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
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
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
                      <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400 mt-2 font-mono">
                        <span>
                          Required: <strong>{formatSecondsToHuman(tp.totalRequiredSeconds)}</strong>
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

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Notes toggle button */}
                      <button
                        onClick={() =>
                          setActiveTaskNotesId(activeTaskNotesId === tp.taskId ? null : tp.taskId)
                        }
                        className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Task Notes"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>

                      {/* Timer Button Controls */}
                      {tp.isCompleted ? (
                        <div className="px-4 py-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Goal Met</span>
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
                        <button
                          onClick={() => startTimer(tp.taskId, false)}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-95"
                          title="Start Timer for this task"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Timer</span>
                        </button>
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Active Goals Overview Strip */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Active Goals ({goals.filter((g) => g.status === 'active').length})
          </h2>
          <button
            onClick={() => setActiveView('goals')}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals
            .filter((g) => g.status === 'active')
            .map((goal) => {
              const goalTasks = tasks.filter((t) => t.goalId === goal.id);
              const goalSessions = sessions.filter((s) => s.goalId === goal.id);
              const trackedSecs = goalSessions.reduce((a, s) => a + s.durationSeconds, 0);
              const dailyReqSecs = goalTasks.reduce((a, t) => a + t.requiredDurationMinutes * 60, 0);
              const totalGoalReqSecs = dailyReqSecs * goal.durationDays;
              const pct = totalGoalReqSecs > 0 ? Math.min(100, Math.round((trackedSecs / totalGoalReqSecs) * 100)) : 0;

              return (
                <div
                  key={goal.id}
                  onClick={() => setActiveView('goals')}
                  className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-all cursor-pointer shadow-xs group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: goal.color }}
                    />
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                      {goal.durationDays} Days
                    </span>
                  </div>

                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                    {goal.title}
                  </h3>

                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                    {goal.description || `${goalTasks.length} daily tasks`}
                  </p>

                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-mono">
                      {formatSecondsToHuman(trackedSecs)} / {formatSecondsToHuman(totalGoalReqSecs)}
                    </span>
                    <span className="font-bold font-mono text-stone-900 dark:text-stone-100">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
