import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  FileText,
  Check,
  X,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatSecondsToHuman } from '../../utils/time';

interface ManualTimeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTaskId?: string;
}

const PRESET_MINUTES = [15, 25, 30, 45, 60, 90, 120];

export const ManualTimeLogModal: React.FC<ManualTimeLogModalProps> = ({
  isOpen,
  onClose,
  initialTaskId,
}) => {
  const { tasks, goals, todayDate, logManualSession } = useApp();

  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialTaskId || '');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('30');
  const [sessionDate, setSessionDate] = useState<string>(todayDate);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update selected task when initialTaskId changes
  useEffect(() => {
    if (initialTaskId) {
      setSelectedTaskId(initialTaskId);
    } else if (tasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [initialTaskId, tasks, selectedTaskId]);

  useEffect(() => {
    setSessionDate(todayDate);
    setError(null);
    setSuccessMessage(null);
  }, [isOpen, todayDate]);

  if (!isOpen) return null;

  const currentTask = tasks.find((t) => t.id === selectedTaskId);
  const currentGoal = currentTask ? goals.find((g) => g.id === currentTask.goalId) : null;

  const handlePresetClick = (mins: number) => {
    setDurationMinutes(mins);
    setCustomMinutesInput(mins.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomMinutesInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setDurationMinutes(parsed);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTaskId) {
      setError('Please select a task to log time for.');
      return;
    }

    if (durationMinutes <= 0) {
      setError('Please enter a duration greater than 0 minutes.');
      return;
    }

    setIsSubmitting(true);
    try {
      await logManualSession(
        selectedTaskId,
        durationMinutes,
        sessionDate,
        notes.trim() || undefined
      );

      setSuccessMessage(
        `Logged ${formatSecondsToHuman(durationMinutes * 60)} for "${currentTask?.title}"!`
      );

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage(null);
        onClose();
      }, 1100);
    } catch (err: any) {
      setError(err?.message || 'Failed to record manual session.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="manual-time-log-dialog"
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Log Offline Focus Time
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Record work completed offline or away from the timer
              </p>
            </div>
          </div>
          <button
            id="close-manual-log-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {successMessage ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <p className="text-sm font-bold">{successMessage}</p>
              <p className="text-xs text-stone-400">Streak and progress updated live</p>
            </div>
          ) : (
            <>
              {/* Task Selector */}
              <div className="space-y-1.5">
                <label
                  htmlFor="manual-log-task-select"
                  className="text-xs font-semibold text-stone-700 dark:text-stone-300"
                >
                  Associated Task
                </label>
                {tasks.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    No active tasks found. Create a goal first to log time.
                  </p>
                ) : (
                  <select
                    id="manual-log-task-select"
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    {tasks.map((task) => {
                      const goal = goals.find((g) => g.id === task.goalId);
                      return (
                        <option key={task.id} value={task.id}>
                          {task.title} {goal ? `(${goal.title})` : ''}
                        </option>
                      );
                    })}
                  </select>
                )}
                {currentGoal && (
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: currentGoal.color }}
                    />
                    <span className="text-xs text-stone-500 dark:text-stone-400 truncate">
                      Goal: <strong className="text-stone-700 dark:text-stone-300">{currentGoal.title}</strong>
                    </span>
                    {currentGoal.colorLabel && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 inline-flex items-center gap-1"
                        style={{
                          backgroundColor: `${currentGoal.color}18`,
                          borderColor: `${currentGoal.color}40`,
                          color: currentGoal.color,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: currentGoal.color }}
                        />
                        <span>{currentGoal.colorLabel}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Duration Presets & Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                  <span>Session Duration</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                    {formatSecondsToHuman(durationMinutes * 60)}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_MINUTES.map((mins) => {
                    const isSelected = durationMinutes === mins;
                    return (
                      <button
                        key={mins}
                        id={`duration-preset-${mins}`}
                        type="button"
                        onClick={() => handlePresetClick(mins)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-xs font-bold'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                      >
                        {mins}m
                      </button>
                    );
                  })}
                </div>

                {/* Custom Minutes Input */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-stone-500 dark:text-stone-400">Custom minutes:</span>
                  <input
                    id="manual-duration-custom-input"
                    type="number"
                    min="1"
                    max="1440"
                    value={customMinutesInput}
                    onChange={handleCustomChange}
                    className="w-28 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-center"
                  />
                  <span className="text-xs text-stone-400 font-mono">min</span>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-1.5">
                <label
                  htmlFor="manual-session-date-input"
                  className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>Date Completed</span>
                </label>
                <input
                  id="manual-session-date-input"
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  max={todayDate}
                  className="w-full px-3.5 py-2 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Session Notes */}
              <div className="space-y-1.5">
                <label
                  htmlFor="manual-session-notes-input"
                  className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  <span>Session Notes (Optional)</span>
                </label>
                <input
                  id="manual-session-notes-input"
                  type="text"
                  placeholder="e.g. Read chapter 4 offline, sketched wireframes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  id="cancel-manual-log-btn"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="submit-manual-log-btn"
                  type="submit"
                  disabled={isSubmitting || tasks.length === 0}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Recording...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Log {formatSecondsToHuman(durationMinutes * 60)}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
