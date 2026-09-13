import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskCalendarView } from './TaskCalendarView';
import { ScheduleRecommendationsCard } from './ScheduleRecommendationsCard';
import { Task } from '../../types';
import {
  Calendar as CalendarIcon,
  Plus,
  Sparkles,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { tasks, goals, todayDate, setActiveView } = useApp();

  // Active selected task for individual calendar inspection
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => {
    return tasks.length > 0 ? tasks[0].id : null;
  });

  const selectedTask = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;
    return tasks.find((t) => t.id === selectedTaskId) || tasks[0];
  }, [tasks, selectedTaskId]);

  const selectedGoal = useMemo(() => {
    if (!selectedTask) return undefined;
    return goals.find((g) => g.id === selectedTask.goalId);
  }, [goals, selectedTask]);

  if (tasks.length === 0) {
    return (
      <div className="space-y-6 w-full max-w-4xl mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <CalendarIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          No Tasks Available Yet
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
          Calendars are tracked individually for each task so you can clearly see continuity and missed days. Create your first goal to get started!
        </p>
        <button
          onClick={() => setActiveView('goals')}
          className="mt-4 px-6 py-3 rounded-2xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 font-bold text-sm shadow-xs hover:bg-stone-800 transition-colors inline-flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create a Goal</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-[1400px] mx-auto pb-16">
      {/* View Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Per-Task Continuity Tracking
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Task Consistency Calendars
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Each task has its own individual calendar showing exact days continued, completed streaks, and missed days.
        </p>
      </div>

      {/* Task Selector Tabs */}
      <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs text-stone-400 font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-stone-400" />
            <span>Select Task to Inspect Calendar ({tasks.length})</span>
          </span>
          <span className="text-[11px] normal-case text-stone-500">
            Click any task to view its continuity
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {tasks.map((task) => {
            const isSelected = selectedTask?.id === task.id;
            const goal = goals.find((g) => g.id === task.goalId);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => setSelectedTaskId(task.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 border-transparent shadow-xs scale-102 font-bold'
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/60 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: goal?.themeColor || '#f59e0b' }}
                />
                <span className="truncate max-w-[160px] sm:max-w-xs">{task.title}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-white/20 text-white dark:text-stone-950 font-bold'
                      : 'bg-stone-200/60 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {task.requiredDurationMinutes}m
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Individual Task Calendar for the selected task */}
      {selectedTask && (
        <div className="animate-in fade-in duration-200">
          <TaskCalendarView
            task={selectedTask}
            goal={selectedGoal}
            onSelectTask={(newTask) => setSelectedTaskId(newTask.id)}
          />
        </div>
      )}

      {/* Automated Suggestion & Schedule Recommendations Component */}
      <div className="pt-6 border-t border-stone-200 dark:border-stone-800">
        <ScheduleRecommendationsCard selectedDate={todayDate} />
      </div>
    </div>
  );
};
