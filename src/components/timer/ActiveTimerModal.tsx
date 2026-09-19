import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Play, Pause, Square, Minimize2, CheckCircle2, Flame, Bell, X } from 'lucide-react';
import { formatSecondsToDigital, formatSecondsToHuman } from '../../utils/time';
import { ModalPortal } from '../common/ModalPortal';

export const ActiveTimerModal: React.FC = () => {
  const {
    activeTimer,
    pauseTimer,
    resumeTimer,
    stopAndSaveTimer,
    setDistractionFree,
    tasks,
    goals,
  } = useApp();

  const [currentElapsed, setCurrentElapsed] = useState(0);

  // Escape key closes distraction free mode
  useEffect(() => {
    if (!activeTimer?.isDistractionFree) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDistractionFree(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTimer?.isDistractionFree, setDistractionFree]);

  // Live timestamp-based calculation for ultra-smooth UI display
  useEffect(() => {
    if (!activeTimer) return;

    const update = () => {
      const runningSlice = activeTimer.isRunning
        ? Math.floor((Date.now() - activeTimer.sessionStartTime) / 1000)
        : 0;
      setCurrentElapsed(activeTimer.accumulatedSecondsBeforeSession + Math.max(0, runningSlice));
    };

    update();
    const timer = setInterval(update, 200);
    return () => clearInterval(timer);
  }, [activeTimer]);

  if (!activeTimer || !activeTimer.isDistractionFree) return null;

  const currentTask = tasks.find((t) => t.id === activeTimer.taskId);
  const currentGoal = currentTask ? goals.find((g) => g.id === currentTask.goalId) : null;

  const target = activeTimer.targetSeconds;
  const remaining = Math.max(0, target - currentElapsed);
  const progressPct = target > 0 ? Math.min(100, Math.round((currentElapsed / target) * 100)) : 0;
  const isCompleted = target > 0 && currentElapsed >= target;

  // SVG Circular progress ring calculations
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <ModalPortal isOpen={!!activeTimer?.isDistractionFree}>
      <div className="fixed inset-0 z-[100] bg-stone-950/90 dark:bg-stone-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 md:p-10 text-stone-100 animate-in fade-in duration-300">
        {/* Top Bar: Distraction-free controls */}
      <div className="w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentGoal?.color || '#f59e0b' }}
          />
          <span className="text-sm font-semibold uppercase tracking-wider text-stone-400">
            {currentGoal?.title || 'Active Goal'}
          </span>
          {currentGoal?.colorLabel && (
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 inline-flex items-center gap-1"
              style={{
                backgroundColor: `${currentGoal.color}25`,
                borderColor: `${currentGoal.color}55`,
                color: currentGoal.color,
              }}
            >
              <span>{currentGoal.colorLabel}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDistractionFree(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 text-stone-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Exit Focus</span>
          </button>
          <button
            type="button"
            onClick={() => setDistractionFree(false)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-300 hover:text-white bg-stone-800/90 hover:bg-stone-700/90 border border-stone-700/70 transition-colors cursor-pointer shadow-xs shrink-0"
            aria-label="Close focus timer modal"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Main Focus Center */}
      <div className="flex flex-col items-center text-center max-w-xl w-full my-auto">
        <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
          {currentGoal?.color && (
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: currentGoal.color }}
            />
          )}
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            {currentGoal?.title || currentTask?.title || 'Focus Session'}
          </h2>
          {currentGoal?.colorLabel && (
            <span
              className="px-2 py-0.5 rounded text-xs font-bold border shrink-0 inline-flex items-center gap-1"
              style={{
                backgroundColor: `${currentGoal.color}25`,
                borderColor: `${currentGoal.color}55`,
                color: currentGoal.color,
              }}
            >
              <span>{currentGoal.colorLabel}</span>
            </span>
          )}
        </div>

        {currentTask?.title && currentTask.title !== currentGoal?.title && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800 text-xs text-stone-300 font-medium mb-3">
            <span>Task: {currentTask.title}</span>
          </div>
        )}
        
        {currentGoal?.motivationalQuote && (
          <p className="text-sm text-stone-400 italic mb-8 max-w-md">
            "{currentGoal.motivationalQuote}"
          </p>
        )}

        {/* Progress Circle & Digits */}
        <div className="relative flex items-center justify-center my-4">
          <svg width="340" height="340" className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="170"
              cy="170"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              className="text-stone-800"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="170"
              cy="170"
              r={radius}
              stroke={isCompleted ? '#10b981' : currentGoal?.color || '#f59e0b'}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-300 ease-linear"
            />
          </svg>

          {/* Center Digits */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isCompleted ? (
              <div className="flex flex-col items-center animate-in zoom-in-95">
                <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-2" />
                <span className="text-xl font-bold text-emerald-400">Target Reached!</span>
                <span className="text-xs text-stone-400 mt-1">
                  {formatSecondsToHuman(currentElapsed)} tracked today
                </span>
              </div>
            ) : (
              <>
                <div className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-white">
                  {formatSecondsToDigital(currentElapsed)}
                </div>
                <div className="text-xs font-medium text-stone-400 mt-2 uppercase tracking-widest">
                  OF {formatSecondsToDigital(target)}
                </div>
                <div className="mt-3 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs font-semibold text-amber-400 font-mono">
                  {progressPct}% COMPLETE
                </div>
              </>
            )}
          </div>
        </div>

        {/* Remaining or Overtime subtext */}
        <div className="mt-6 text-sm text-stone-400">
          {!isCompleted ? (
            <span>
              <strong className="text-stone-200">{formatSecondsToHuman(remaining, true)}</strong> remaining to fulfill today's requirement
            </span>
          ) : (
            <span className="text-emerald-400 font-medium">
              Daily quota complete. Great job showing up today!
            </span>
          )}
        </div>

        {/* Timer Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
          <button
            onClick={pauseTimer}
            disabled={!activeTimer.isRunning}
            className={`px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-lg ${
              activeTimer.isRunning
                ? 'bg-stone-800 hover:bg-stone-700 text-white cursor-pointer active:scale-95'
                : 'bg-stone-900/60 text-stone-600 border border-stone-800/80 cursor-not-allowed opacity-50'
            }`}
            title="Pause timer"
          >
            <Pause className="w-5 h-5 fill-current" />
            <span>Pause</span>
          </button>

          <button
            onClick={resumeTimer}
            disabled={activeTimer.isRunning}
            className={`px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center gap-2.5 transition-all shadow-lg ${
              !activeTimer.isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 cursor-pointer active:scale-95 ring-2 ring-amber-400/50 animate-pulse'
                : 'bg-stone-900/60 text-stone-600 border border-stone-800/80 cursor-not-allowed opacity-50'
            }`}
            title="Resume timer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Resume</span>
          </button>

          <button
            onClick={stopAndSaveTimer}
            className="px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white font-medium text-sm sm:text-base flex items-center gap-2 transition-all cursor-pointer"
            title="Save session and close timer"
          >
            <Square className="w-4 h-4 fill-current text-rose-500" />
            <span>Finish Session</span>
          </button>
        </div>
      </div>

      {/* Bottom info: session indicator */}
      <div className="w-full max-w-md flex items-center justify-center gap-6 text-xs text-stone-500 py-2">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${activeTimer.isRunning ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
          <span>{activeTimer.isRunning ? 'Recording Live (Timestamp-accurate)' : 'Paused'}</span>
        </span>
        <span>•</span>
        <span>Sessions are autosaved locally</span>
      </div>
    </div>
    </ModalPortal>
  );
};
