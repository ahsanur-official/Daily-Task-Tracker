import React, { useState, useEffect } from 'react';
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
  Lock,
  Bell,
  BellRing,
} from 'lucide-react';
import { Goal, Task } from '../../types';
import { formatSecondsToHuman, formatFullDateLabel, getDaysDifference } from '../../utils/time';
import { evaluateGoalProgress } from '../../utils/recovery';
import { TaskCalendarModal } from '../calendar/TaskCalendarModal';
import { ModalPortal } from '../common/ModalPortal';
import { AnimatedRingProgress } from '../common/AnimatedRingProgress';
import { motion } from 'motion/react';

interface GoalDetailModalProps {
  goal: Goal | null;
  onClose: () => void;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({ goal, onClose }) => {
  const {
    tasks,
    sessions,
    updateGoal,
    pauseGoal,
    resumeGoal,
    completeGoal,
    deleteGoal,
    todayDate,
    user,
    setActiveView,
    setTargetVerifyId,
    triggerGoalReminderAlert,
    notificationPermission,
    requestNotificationAccess,
  } = useApp();

  const [selectedTaskForCalendar, setSelectedTaskForCalendar] = useState<Task | null>(null);
  const [reminderTestSent, setReminderTestSent] = useState(false);

  if (!goal) return null;

  const goalTasks = tasks.filter((t) => t.goalId === goal.id);
  const goalSessions = sessions.filter((s) => s.goalId === goal.id);
  const progressMetrics = evaluateGoalProgress(goal, tasks, sessions);

  // Calculate day position: e.g. Day 13 / 30
  const daysSinceStart = Math.max(1, getDaysDifference(goal.startDate, todayDate) + 1);
  const currentDayNumber = Math.min(goal.durationDays, daysSinceStart);

  const isCompleted = goal.status === 'completed';
  const isPaused = goal.status === 'paused';
  const isFullyFulfilled = progressMetrics.isFulfilled || progressMetrics.percentage >= 100;

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleTogglePause = () => {
    if (isPaused) {
      resumeGoal(goal.id);
    } else {
      pauseGoal(goal.id);
    }
  };

  const handleFinishAndCertify = () => {
    if (!isFullyFulfilled) {
      alert(
        `Course/Goal not complete yet! You have completed ${progressMetrics.fulfilledDaysCount} of ${goal.durationDays} days (${progressMetrics.percentage}%). Complete 100% of all required daily tasks to receive your official certificate.`
      );
      return;
    }
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
    <ModalPortal isOpen={!!goal}>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer"
        role="dialog"
        aria-modal="true"
        aria-label="Goal Details Modal"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 cursor-default"
        >
          {/* Mandatory, Always-Visible 'X' Close Button in Top-Right Corner */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-10 h-10 rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-950 dark:text-stone-400 dark:hover:text-white bg-white/95 hover:bg-stone-100 dark:bg-stone-800/95 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-all shrink-0 cursor-pointer shadow-xs"
            aria-label="Close goal details modal"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Header */}
          <div className="shrink-0 p-5 sm:p-6 pr-16 sm:pr-20 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: goal.color }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
                    {goal.title}
                  </h2>
                  {goal.colorLabel && (
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 inline-flex items-center gap-1"
                      style={{
                        backgroundColor: `${goal.color}18`,
                        borderColor: `${goal.color}40`,
                        color: goal.color,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
                      <span>{goal.colorLabel}</span>
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
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
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
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

          {/* Hero Goal Completion Progress Card with Animated SVG Ring */}
          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/80 flex flex-col sm:flex-row items-center gap-6">
            <div className="shrink-0 flex flex-col items-center">
              <AnimatedRingProgress
                progress={progressMetrics.percentage}
                size={96}
                strokeWidth={8}
                color={goal.color}
                glow={isCompleted}
                subtitle="Goal"
              />
              <span className="text-[11px] font-mono font-bold text-stone-500 dark:text-stone-400 mt-1">
                {isCompleted ? 'Target Achieved' : `${progressMetrics.percentage}% Completed`}
              </span>
            </div>

            <div className="flex-1 w-full grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-700/60">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Timeline Day
                </span>
                <span className="text-lg font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5 block">
                  {currentDayNumber} <span className="text-xs font-normal text-stone-400">/ {goal.durationDays}d</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-700/60">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Status
                </span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5 block capitalize">
                  {goal.status}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-700/60">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Tracked Time
                </span>
                <span className="text-base font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5 block">
                  {formatSecondsToHuman(progressMetrics.totalCompletedSeconds)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-700/60">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Remaining
                </span>
                <span className="text-base font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5 block">
                  {formatSecondsToHuman(progressMetrics.remainingSeconds)}
                </span>
              </div>
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
                  className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 text-sm block">
                      {task.title}
                    </span>
                    {task.description && (
                      <span className="text-stone-500 dark:text-stone-400 block mt-0.5">{task.description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300">
                      {task.requiredDurationMinutes} mins/day
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTaskForCalendar(task)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 font-semibold transition-colors cursor-pointer"
                      title="View Task Calendar (Continuity & Missed Days)"
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>Calendar</span>
                    </button>
                  </div>
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

          {/* Daily Notification Reminder Settings (Notifications API) */}
          <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Daily Notification Reminder
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Alerts you to complete your daily tasks for this goal
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!goal.reminderEnabled && notificationPermission !== 'granted') {
                    requestNotificationAccess();
                  }
                  updateGoal(goal.id, {
                    reminderEnabled: !goal.reminderEnabled,
                    reminderTime: goal.reminderTime || '09:00',
                  });
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  goal.reminderEnabled ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                }`}
                role="switch"
                aria-checked={goal.reminderEnabled}
                title="Toggle daily reminder"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    goal.reminderEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {goal.reminderEnabled && (
              <div className="pt-2 border-t border-amber-500/15 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Reminder Time:
                  </span>
                  <input
                    type="time"
                    value={goal.reminderTime || '09:00'}
                    onChange={(e) => updateGoal(goal.id, { reminderTime: e.target.value })}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono shadow-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (notificationPermission !== 'granted') {
                        requestNotificationAccess().then(() => {
                          triggerGoalReminderAlert(goal);
                          setReminderTestSent(true);
                          setTimeout(() => setReminderTestSent(false), 3000);
                        });
                      } else {
                        triggerGoalReminderAlert(goal);
                        setReminderTestSent(true);
                        setTimeout(() => setReminderTestSent(false), 3000);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 hover:bg-amber-500/10 text-stone-700 dark:text-stone-300 hover:text-amber-600 border border-stone-200 dark:border-stone-700 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <BellRing className="w-3.5 h-3.5 text-amber-500" />
                    <span>{reminderTestSent ? 'Reminder Alert Sent!' : 'Test Daily Alert'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions & Certificate Button */}
          <div className="shrink-0 p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-900/50">
            <div className="flex items-center gap-2">
              {!isCompleted && (
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition-colors cursor-pointer"
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
                className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>View Certificate</span>
                </button>
              ) : isFullyFulfilled ? (
                <button
                  type="button"
                  onClick={handleFinishAndCertify}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ring-2 ring-emerald-500/30 animate-pulse"
                >
                  <Award className="w-4 h-4" />
                  <span>Claim & Generate Certificate (100% Done!)</span>
                </button>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 text-xs font-semibold flex items-center gap-2 cursor-not-allowed border border-stone-200 dark:border-stone-700 opacity-80"
                    title="You must complete 100% of all required daily tasks to receive your certificate."
                  >
                    <Lock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Certificate Locked ({progressMetrics.fulfilledDaysCount}/{goal.durationDays} Days • {progressMetrics.percentage}%)</span>
                  </button>
                  <span className="text-[10px] text-stone-400">
                    Complete all {goal.durationDays} days to unlock certificate
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Task Calendar Modal */}
      {selectedTaskForCalendar && (
        <TaskCalendarModal
          task={selectedTaskForCalendar}
          goal={goal}
          onClose={() => setSelectedTaskForCalendar(null)}
        />
      )}
    </div>
    </ModalPortal>
  );
};
