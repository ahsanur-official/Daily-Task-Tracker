import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Target, Plus, Search, Filter, Award, CheckCircle2, Clock, Calendar, ArrowUpRight, Tag } from 'lucide-react';
import { Goal, GoalStatus } from '../../types';
import { formatSecondsToHuman, getDaysDifference } from '../../utils/time';
import { evaluateGoalProgress } from '../../utils/recovery';
import { GoalDetailModal } from './GoalDetailModal';
import { AnimatedRingProgress } from '../common/AnimatedRingProgress';

interface GoalsViewProps {
  onOpenCreateGoal: () => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ onOpenCreateGoal }) => {
  const { goals, tasks, sessions, todayDate } = useApp();

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'all'>('all');
  const [filterLabel, setFilterLabel] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeSelectedGoal = useMemo(() => {
    if (!selectedGoalId) return null;
    return goals.find((g) => g.id === selectedGoalId) || null;
  }, [selectedGoalId, goals]);

  const uniqueLabels = useMemo(() => {
    const map = new Map<string, { label: string; color: string; count: number }>();
    goals.forEach((g) => {
      if (g.colorLabel) {
        const existing = map.get(g.colorLabel);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(g.colorLabel, {
            label: g.colorLabel,
            color: g.color,
            count: 1,
          });
        }
      }
    });
    return Array.from(map.values());
  }, [goals]);

  const filteredGoals = goals.filter((g) => {
    if (filterStatus !== 'all' && g.status !== filterStatus) return false;
    if (filterLabel !== 'all' && g.colorLabel !== filterLabel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.colorLabel && g.colorLabel.toLowerCase().includes(q)) ||
        (g.description && g.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-bold text-sm shadow-xs transition-colors cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Goal</span>
        </button>
      </motion.div>

      {/* Filter and Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-3"
      >
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
      </motion.div>

      {/* Color Label Filter Pills */}
      {uniqueLabels.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-xs font-semibold text-stone-400 flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3 text-amber-500" />
            <span>Labels:</span>
          </span>
          <button
            type="button"
            onClick={() => setFilterLabel('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterLabel === 'all'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-transparent shadow-2xs'
                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-stone-300'
            }`}
          >
            All Labels ({goals.length})
          </button>
          {uniqueLabels.map((lbl) => (
            <button
              key={lbl.label}
              type="button"
              onClick={() => setFilterLabel(filterLabel === lbl.label ? 'all' : lbl.label)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                filterLabel === lbl.label
                  ? 'border-transparent text-white font-bold shadow-2xs'
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-stone-300'
              }`}
              style={
                filterLabel === lbl.label
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
          <AnimatePresence mode="popLayout">
            {filteredGoals.map((goal, index) => {
              const metrics = evaluateGoalProgress(goal, tasks, sessions);
              const goalTasks = tasks.filter((t) => t.goalId === goal.id);
              const daysSinceStart = Math.max(1, getDaysDifference(goal.startDate, todayDate) + 1);
              const currentDayNumber = Math.min(goal.durationDays, daysSinceStart);

              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.35) }}
                  whileHover={{ y: -3, transition: { duration: 0.18 } }}
                  onClick={() => setSelectedGoalId(goal.id)}
                  className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-400/60 dark:hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: goal.color }}
                        />
                        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                          {goal.category}
                        </span>
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

                  {/* SVG Animated Ring Progress & Details */}
                  <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-stone-500 dark:text-stone-400 font-mono">
                          Day {currentDayNumber} of {goal.durationDays}
                        </span>
                        <span className="text-stone-300 dark:text-stone-700">•</span>
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          {goalTasks.length} daily task{goalTasks.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                        <span>
                          Tracked: <strong className="text-stone-800 dark:text-stone-200">{formatSecondsToHuman(metrics.totalCompletedSeconds)}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Target: <strong className="text-stone-800 dark:text-stone-200">{formatSecondsToHuman(metrics.totalRequiredSeconds)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Smooth SVG Animated Ring Chart */}
                    <div className="shrink-0 flex items-center">
                      <AnimatedRingProgress
                        progress={metrics.percentage}
                        size={64}
                        strokeWidth={6}
                        color={goal.color}
                        glow={goal.status === 'completed'}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Goal Detail Modal */}
      <GoalDetailModal goal={activeSelectedGoal} onClose={() => setSelectedGoalId(null)} />
    </div>
  );
};
