import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Target,
  Pause,
  Play,
  Award,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Goal } from '../../types';
import { formatSecondsToHuman, formatFullDateLabel, getDaysDifference } from '../../utils/time';
import { evaluateGoalProgress } from '../../utils/recovery';

interface GoalDetailModalProps {
  goal: Goal | null;
  onClose: () => void;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({ goal, onClose }) => {
  const {
    tasks,
    sessions,
    pauseGoal,
    resumeGoal,
    completeGoal,
    deleteGoal,
    todayDate,
    user,
    setActiveView,
    setTargetVerifyId,
  } = useApp();

  if (!goal) return null;

  const goalTasks = tasks.filter((t) => t.goalId === goal.id);
  const goalSessions = sessions.filter((s) => s.goalId === goal.id);
  const progressMetrics = evaluateGoalProgress(goal, tasks, sessions);

  // Calculate day position: e.g. Day 13 / 30
  const daysSinceStart = Math.max(1, getDaysDifference(goal.startDate, todayDate) + 1);
  const currentDayNumber = Math.min(goal.durationDays, daysSinceStart);

  const isCompleted = goal.status === 'completed';
  const isPaused = goal.status === 'paused';

  const handleTogglePause = () => {
    if (isPaused) {
      resumeGoal(goal.id);
    } else {
      pauseGoal(goal.id);
    }
  };

  const handleFinishAndCertify = () => {
    const cert = completeGoal(goal.id);
    if (cert) {
      onClose();
      setActiveView('certificates');
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this goal and all associated sessions?')) {
      deleteGoal(goal.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: goal.color }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {goal.title}
                </h2>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : isPaused
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300'
                  }`}
                >
                  {goal.status}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {goal.category} • {goal.durationDays} Days challenge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Motivation or Description */}
          {goal.description && (
            <p className="text-sm text-stone-600 dark:text-stone-300">
              {goal.description}
            </p>
          )}

          {goal.motivationalQuote && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs italic text-amber-900 dark:text-amber-200">
              "{goal.motivationalQuote}"
            </div>
          )}

          {/* Key Metrics Grid (Section 15 Specification) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                Timeline Day
              </span>
              <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 mt-1 block">
                {currentDayNumber} / {goal.durationDays}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                Completion
              </span>
              <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                {progressMetrics.percentage}%
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                Tracked Time
              </span>
              <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 mt-1 block">
                {formatSecondsToHuman(progressMetrics.totalCompletedSeconds)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                Remaining
              </span>
              <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 mt-1 block">
                {formatSecondsToHuman(progressMetrics.remainingSeconds)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
              <span>Overall Target Progress</span>
              <span className="font-mono font-semibold text-stone-800 dark:text-stone-200">
                {formatSecondsToHuman(progressMetrics.totalCompletedSeconds)} / {formatSecondsToHuman(progressMetrics.totalRequiredSeconds)}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(100, progressMetrics.percentage)}%` }}
              />
            </div>
          </div>

          {/* Tasks in this Goal */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Daily Task Breakdown ({goalTasks.length})
            </h3>
            <div className="space-y-2">
              {goalTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 text-sm block">
                      {task.title}
                    </span>
                    {task.description && (
                      <span className="text-stone-500 dark:text-stone-400">{task.description}</span>
                    )}
                  </div>
                  <span className="font-mono font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300">
                    {task.requiredDurationMinutes} mins/day
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Recorded Sessions History */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Recent Recorded Sessions ({goalSessions.length})
            </h3>
            {goalSessions.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No recorded sessions yet.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {goalSessions
                  .slice(-6)
                  .reverse()
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/30 text-stone-600 dark:text-stone-400 font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>{s.date}</span>
                      </div>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {formatSecondsToHuman(s.durationSeconds, true)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Actions & Certificate Button */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {!isCompleted && (
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition-colors"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Resume Goal</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Goal</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>

            <div>
              {isCompleted ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setActiveView('certificates');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Award className="w-4 h-4" />
                  <span>View Certificate</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishAndCertify}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Award className="w-4 h-4" />
                  <span>Complete & Generate Certificate</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
