import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, Trash2, Calendar, Target, Clock, Sparkles } from 'lucide-react';
import { GoalCategory, GoalDurationOption } from '../../types';
import { addDaysToDateString, formatSecondsToHuman } from '../../utils/time';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: GoalCategory[] = [
  'Coding & Tech',
  'Health & Fitness',
  'Learning & Language',
  'Reading & Writing',
  'Mindfulness',
  'Career & Business',
  'Creative & Design',
  'General',
];

const COLORS = [
  '#0284c7', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({ isOpen, onClose }) => {
  const { createGoal, todayDate } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Coding & Tech');
  const [color, setColor] = useState(COLORS[0]);
  const [durationOption, setDurationOption] = useState<GoalDurationOption>('30_days');
  const [customDays, setCustomDays] = useState(21);
  const [startDate, setStartDate] = useState(todayDate);
  const [motivationalQuote, setMotivationalQuote] = useState('');

  // Daily Tasks under this goal
  const [taskList, setTaskList] = useState<
    Array<{ title: string; requiredDurationMinutes: number; description?: string; deadlineTime?: string }>
  >([
    { title: 'Core Practice Session', requiredDurationMinutes: 45, deadlineTime: '18:00' },
  ]);

  if (!isOpen) return null;

  // Calculate duration in days
  const durationDays =
    durationOption === '3_days'
      ? 3
      : durationOption === '7_days'
      ? 7
      : durationOption === '15_days'
      ? 15
      : durationOption === '30_days'
      ? 30
      : Math.max(1, customDays);

  const endDate = addDaysToDateString(startDate, durationDays - 1);

  // Total daily time calculated automatically
  const dailyTotalMinutes = taskList.reduce((acc, t) => acc + (t.requiredDurationMinutes || 0), 0);
  const grandTotalMinutes = dailyTotalMinutes * durationDays;

  const handleAddTaskRow = () => {
    setTaskList((prev) => [
      ...prev,
      { title: '', requiredDurationMinutes: 30, deadlineTime: '' },
    ]);
  };

  const handleRemoveTaskRow = (index: number) => {
    if (taskList.length <= 1) return;
    setTaskList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTaskChange = (
    index: number,
    field: 'title' | 'requiredDurationMinutes' | 'deadlineTime',
    value: any
  ) => {
    setTaskList((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validTasks = taskList
      .filter((t) => t.title.trim().length > 0)
      .map((t) => ({
        title: t.title.trim(),
        requiredDurationMinutes: Math.max(1, t.requiredDurationMinutes || 15),
        description: t.description,
        deadlineTime: t.deadlineTime ? t.deadlineTime.trim() : undefined,
      }));

    if (validTasks.length === 0) {
      validTasks.push({
        title: `${title} Daily Task`,
        requiredDurationMinutes: 30,
      });
    }

    createGoal(
      {
        title: title.trim(),
        description: description.trim(),
        category,
        color,
        iconName: 'Target',
        durationOption,
        durationDays,
        startDate,
        endDate,
        status: 'active',
        motivationalQuote: motivationalQuote.trim() || undefined,
      },
      validTasks
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Create New Goal</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Design a structured timeline with time-tracked daily tasks.
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 1. Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Goal Name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Full-Stack Architecture"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key outcome or motivation for this challenge"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            {/* Category & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GoalCategory)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-stone-900 dark:ring-stone-100' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Duration Preset Options (3d, 7d, 15d, 30d, Custom) */}
          <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              Duration Target
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: '3_days', label: '3 Days' },
                { id: '7_days', label: '7 Days' },
                { id: '15_days', label: '15 Days' },
                { id: '30_days', label: '30 Days' },
                { id: 'custom', label: 'Custom' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDurationOption(opt.id as GoalDurationOption)}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all ${
                    durationOption === opt.id
                      ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300'
                      : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {durationOption === 'custom' && (
              <div className="flex items-center gap-2 pt-2">
                <label className="text-xs text-stone-500">Days count:</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={customDays}
                  onChange={(e) => setCustomDays(Number(e.target.value))}
                  className="w-24 text-sm px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>
            )}

            {/* Date range feedback */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl">
              <span>
                Start: <strong>{startDate}</strong>
              </span>
              <span>→</span>
              <span>
                End (auto-calculated): <strong>{endDate}</strong> ({durationDays} days)
              </span>
            </div>
          </div>

          {/* 3. Daily Tasks Definition */}
          <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Daily Tasks & Required Time
              </label>
              <button
                type="button"
                onClick={handleAddTaskRow}
                className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {taskList.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700"
                >
                  <input
                    type="text"
                    required
                    placeholder="Task name (e.g. Study, Code, Read)"
                    value={task.title}
                    onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                    className="flex-1 text-xs px-3 py-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={task.requiredDurationMinutes}
                      onChange={(e) =>
                        handleTaskChange(index, 'requiredDurationMinutes', Number(e.target.value))
                      }
                      className="w-14 text-xs px-2 py-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-center font-mono"
                    />
                    <span className="text-xs text-stone-500">m</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" title="Optional daily notification deadline">
                    <Clock className="w-3 h-3 text-stone-400" />
                    <input
                      type="time"
                      value={task.deadlineTime || ''}
                      onChange={(e) =>
                        handleTaskChange(index, 'deadlineTime', e.target.value)
                      }
                      className="text-xs px-2 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-stone-800 dark:text-stone-200"
                    />
                  </div>
                  {taskList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTaskRow(index)}
                      className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                      title="Remove task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Calculated targets strip */}
            <div className="flex items-center justify-between text-xs font-medium text-stone-600 dark:text-stone-300 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span>
                Daily Target: <strong>{formatSecondsToHuman(dailyTotalMinutes * 60)}</strong>
              </span>
              <span>•</span>
              <span>
                {durationDays}-Day Target:{' '}
                <strong className="text-amber-700 dark:text-amber-400">
                  {formatSecondsToHuman(grandTotalMinutes * 60)}
                </strong>
              </span>
            </div>
          </div>

          {/* 4. Optional Motivational Quote */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Motivational Quote (Optional)
            </label>
            <input
              type="text"
              value={motivationalQuote}
              onChange={(e) => setMotivationalQuote(e.target.value)}
              placeholder="e.g. Small daily improvements over time lead to stunning results."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 shadow-xs transition-colors"
            >
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
