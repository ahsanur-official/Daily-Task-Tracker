import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Target, Plus, Search, Filter, Award, CheckCircle2, Clock, Calendar, ArrowUpRight } from 'lucide-react';
import { Goal, GoalStatus } from '../../types';
import { formatSecondsToHuman, getDaysDifference } from '../../utils/time';
import { evaluateGoalProgress } from '../../utils/recovery';
import { GoalDetailModal } from './GoalDetailModal';

interface GoalsViewProps {
  onOpenCreateGoal: () => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ onOpenCreateGoal }) => {
  const { goals, tasks, sessions, todayDate } = useApp();

  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGoals = goals.filter((g) => {
    if (filterStatus !== 'all' && g.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            Goals ({goals.length})
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Build discipline with structured timeline milestones and daily habits.
          </p>
        </div>

        <button
          onClick={onOpenCreateGoal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-bold text-sm shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Goal</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-800/80 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'completed', label: 'Completed' },
            { id: 'paused', label: 'Paused' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-1 sm:flex-none ${
                filterStatus === tab.id
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 bg-white/40 dark:bg-stone-900/40">
          <Target className="w-10 h-10 mx-auto text-stone-400 mb-3" />
          <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200">
            No goals found
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? `No goals matched your search query "${searchQuery}".`
              : 'You have no goals under this category yet.'}
          </p>
          <button
            onClick={onOpenCreateGoal}
            className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 text-xs font-semibold"
          >
            Create a Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const metrics = evaluateGoalProgress(goal, tasks, sessions);
            const goalTasks = tasks.filter((t) => t.goalId === goal.id);
            const daysSinceStart = Math.max(1, getDaysDifference(goal.startDate, todayDate) + 1);
            const currentDayNumber = Math.min(goal.durationDays, daysSinceStart);

            return (
              <div
                key={goal.id}
                onClick={() => setSelectedGoal(goal)}
                className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: goal.color }}
                      />
                      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                        {goal.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          goal.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                            : goal.status === 'paused'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {goal.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center justify-between">
                    <span className="truncate">{goal.title}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-stone-400" />
                  </h3>

                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                    {goal.description || `${goalTasks.length} daily structured task(s)`}
                  </p>
                </div>

                {/* Progress Bar & Details */}
                <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-mono">
                      Day {currentDayNumber} of {goal.durationDays}
                    </span>
                    <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                      {metrics.percentage}% Completed
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        goal.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, metrics.percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono pt-1">
                    <span>
                      Tracked: <strong>{formatSecondsToHuman(metrics.totalCompletedSeconds)}</strong>
                    </span>
                    <span>
                      Target: <strong>{formatSecondsToHuman(metrics.totalRequiredSeconds)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Detail Modal */}
      <GoalDetailModal goal={selectedGoal} onClose={() => setSelectedGoal(null)} />
    </div>
  );
};
