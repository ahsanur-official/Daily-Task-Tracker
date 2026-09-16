import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Flame,
  Award,
  Zap,
  Calendar,
  Layers,
} from 'lucide-react';
import { formatSecondsToHuman } from '../../utils/time';
import { WeeklyRecapCard } from './WeeklyRecapCard';
import { AnimatedRingProgress } from '../common/AnimatedRingProgress';

export const AnalyticsView: React.FC = () => {
  const { analytics, streakInfo, goals, sessions } = useApp();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 w-full max-w-[1400px] mx-auto pb-16"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Personal Analytics
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Measurable insights into your habits, focus consistency, and completion rates.
        </p>
      </div>

      {/* Weekly Recap Card */}
      <WeeklyRecapCard />

      {/* Grid of Key Metrics (Prompt Section 24) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Total Tracked Time
              </span>
            </div>
            <div className="text-3xl font-bold font-mono text-stone-900 dark:text-stone-100">
              {formatSecondsToHuman(analytics.allTimeSeconds)}
            </div>
          </div>
          <span className="text-[11px] text-stone-400 mt-3 block">Lifetime focus recorded</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Completion Rate
              </span>
            </div>
            <div className="text-3xl font-bold font-mono text-stone-900 dark:text-stone-100">
              {analytics.overallCompletionRate}%
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">Daily quota adherence</span>
          </div>

          <AnimatedRingProgress
            progress={analytics.overallCompletionRate}
            size={56}
            strokeWidth={5.5}
            color="#10b981"
            glow={analytics.overallCompletionRate >= 80}
          />
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-orange-500 mb-2">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Streak Record
              </span>
            </div>
            <div className="text-3xl font-bold font-mono text-stone-900 dark:text-stone-100">
              {streakInfo.currentStreak}d{' '}
              <span className="text-sm font-normal text-stone-400">/ {streakInfo.bestStreak}d best</span>
            </div>
          </div>
          <span className="text-[11px] text-stone-400 mt-3 block">Consecutive day streak</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-violet-500 mb-2">
              <Award className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Goals Completed
              </span>
            </div>
            <div className="text-3xl font-bold font-mono text-stone-900 dark:text-stone-100">
              {analytics.completedGoalsCount}
            </div>
          </div>
          <span className="text-[11px] text-stone-400 mt-3 block">
            {analytics.activeGoalsCount} currently active
          </span>
        </motion.div>
      </div>

      {/* Secondary Metrics & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Productivity Rhythm */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4"
        >
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Productivity Rhythm</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 flex items-center justify-between">
              <span className="text-stone-500">Average Daily Time:</span>
              <span className="font-bold font-mono text-stone-900 dark:text-stone-100">
                {formatSecondsToHuman(analytics.averageDailySeconds)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 flex items-center justify-between">
              <span className="text-stone-500">Most Productive Day of Week:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {analytics.mostProductiveDayOfWeek}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 flex items-center justify-between">
              <span className="text-stone-500">Total Completed Time Sessions:</span>
              <span className="font-bold font-mono text-stone-900 dark:text-stone-100">
                {sessions.length} sessions
              </span>
            </div>
          </div>
        </motion.div>

        {/* Goal Execution Breakdown with Animated Rings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4"
        >
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>Goal Distribution</span>
          </h2>

          <div className="space-y-3">
            {goals.map((g) => {
              const goalSessions = sessions.filter((s) => s.goalId === g.id);
              const totalSecs = goalSessions.reduce((a, s) => a + s.durationSeconds, 0);
              const sharePercent = Math.min(
                100,
                Math.round((totalSecs / Math.max(1, analytics.allTimeSeconds)) * 100)
              );

              return (
                <div
                  key={g.id}
                  className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: g.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-stone-800 dark:text-stone-200 text-xs truncate block">
                        {g.title}
                      </span>
                      <span className="font-mono text-[11px] text-stone-400">
                        {formatSecondsToHuman(totalSecs)} focus time
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    <AnimatedRingProgress
                      progress={sharePercent}
                      size={40}
                      strokeWidth={4}
                      color={g.color}
                      showPercentage={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
