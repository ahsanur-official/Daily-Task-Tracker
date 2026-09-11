import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Play, Pause, Square, Maximize2 } from 'lucide-react';
import { formatSecondsToDigital } from '../../utils/time';

export const FloatingTimerBar: React.FC = () => {
  const {
    activeTimer,
    pauseTimer,
    resumeTimer,
    stopAndSaveTimer,
    setDistractionFree,
    tasks,
    goals,
  } = useApp();

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeTimer) return;
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

  // Only show if timer exists and NOT in distraction-free mode
  if (!activeTimer || activeTimer.isDistractionFree) return null;

  const currentTask = tasks.find((t) => t.id === activeTimer.taskId);
  const currentGoal = currentTask ? goals.find((g) => g.id === currentTask.goalId) : null;
  const target = activeTimer.targetSeconds;
  const progressPct = target > 0 ? Math.min(100, Math.round((elapsed / target) * 100)) : 0;

  return (
    <div className="fixed bottom-16 md:bottom-6 right-4 md:right-8 z-40 max-w-sm w-full animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-3.5 rounded-2xl bg-stone-900/95 dark:bg-stone-900/95 backdrop-blur-xl border border-stone-800 text-stone-100 shadow-2xl flex items-center justify-between gap-3">
        {/* Left: Info & Progress */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: currentGoal?.color || '#f59e0b' }}
            />
            <span className="text-[11px] font-medium text-stone-400 truncate block">
              {currentGoal?.title}
            </span>
          </div>
          <div className="text-sm font-semibold text-white truncate">
            {currentTask?.title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs font-bold text-amber-400">
              {formatSecondsToDigital(elapsed)}
            </span>
            <span className="text-[11px] text-stone-400 font-mono">
              / {formatSecondsToDigital(target)} ({progressPct}%)
            </span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={pauseTimer}
            disabled={!activeTimer.isRunning}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              activeTimer.isRunning
                ? 'bg-stone-800 hover:bg-stone-700 text-white cursor-pointer shadow-xs'
                : 'bg-stone-800/40 text-stone-600 cursor-not-allowed opacity-50'
            }`}
            title="Pause timer"
          >
            <Pause className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={resumeTimer}
            disabled={activeTimer.isRunning}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              !activeTimer.isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold cursor-pointer shadow-xs animate-pulse ring-1 ring-amber-400'
                : 'bg-stone-800/40 text-stone-600 cursor-not-allowed opacity-50'
            }`}
            title="Resume timer"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>

          <button
            onClick={stopAndSaveTimer}
            className="w-9 h-9 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Save & Stop"
          >
            <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
          </button>

          <button
            onClick={() => setDistractionFree(true)}
            className="w-9 h-9 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Focus Mode"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
