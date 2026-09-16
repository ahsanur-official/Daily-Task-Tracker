import React, { useState } from 'react';
import {
  CalendarRange,
  TrendingUp,
  Sparkles,
  Award,
  Copy,
  Check,
  Flame,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatSecondsToHuman } from '../../utils/time';

export const WeeklyRecapCard: React.FC = () => {
  const { sessions, goals, streakInfo, todayDate } = useApp();
  const [copied, setCopied] = useState(false);

  // Calculate past 7 days dates
  const today = new Date(todayDate || new Date().toISOString().split('T')[0]);
  const past7Days: string[] = [];
  const previous7Days: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    past7Days.push(d.toISOString().split('T')[0]);
  }

  for (let i = 13; i >= 7; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    previous7Days.push(d.toISOString().split('T')[0]);
  }

  // Filter sessions
  const thisWeekSessions = sessions.filter((s) => past7Days.includes(s.date));
  const prevWeekSessions = sessions.filter((s) => previous7Days.includes(s.date));

  const thisWeekSeconds = thisWeekSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const prevWeekSeconds = prevWeekSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

  // Percentage change
  let trendPercent = 0;
  if (prevWeekSeconds > 0) {
    trendPercent = Math.round(((thisWeekSeconds - prevWeekSeconds) / prevWeekSeconds) * 100);
  } else if (thisWeekSeconds > 0) {
    trendPercent = 100;
  }

  // Daily totals for past 7 days
  const dailyBreakdown = past7Days.map((dateStr) => {
    const dayDate = new Date(dateStr + 'T12:00:00Z');
    const dayLabel = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
    const daySeconds = thisWeekSessions
      .filter((s) => s.date === dateStr)
      .reduce((acc, s) => acc + s.durationSeconds, 0);
    return {
      date: dateStr,
      dayLabel,
      seconds: daySeconds,
      isToday: dateStr === todayDate,
    };
  });

  const maxDaySeconds = Math.max(1, ...dailyBreakdown.map((d) => d.seconds));

  // Best day
  const bestDay = [...dailyBreakdown].sort((a, b) => b.seconds - a.seconds)[0];

  // Top goal this week
  const goalMap = new Map<string, number>();
  thisWeekSessions.forEach((s) => {
    goalMap.set(s.goalId, (goalMap.get(s.goalId) || 0) + s.durationSeconds);
  });

  let topGoalId: string | null = null;
  let topGoalSeconds = 0;
  goalMap.forEach((secs, gid) => {
    if (secs > topGoalSeconds) {
      topGoalSeconds = secs;
      topGoalId = gid;
    }
  });

  const topGoal = topGoalId ? goals.find((g) => g.id === topGoalId) : null;

  const handleCopyRecap = () => {
    const summaryText = `📊 My Weekly Focus Recap (${past7Days[0]} to ${past7Days[6]}):
⏱️ Total Focus: ${formatSecondsToHuman(thisWeekSeconds)}
🔥 Active Streak: ${streakInfo.currentStreak} days
🌟 Best Focus Day: ${bestDay?.seconds > 0 ? `${bestDay.dayLabel} (${formatSecondsToHuman(bestDay.seconds)})` : 'N/A'}
🎯 Top Habit: ${topGoal ? `${topGoal.title} (${formatSecondsToHuman(topGoalSeconds)})` : 'None yet'}
✨ Tracked with Daily Task Tracker`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      id="weekly-recap-card"
      className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:via-stone-900 dark:to-stone-900 border border-amber-500/20 dark:border-amber-500/30 shadow-sm space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Weekly Productivity Recap</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-wider">
                Last 7 Days
              </span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {past7Days[0]} &rarr; {past7Days[6]}
            </p>
          </div>
        </div>

        <button
          id="copy-weekly-recap-btn"
          type="button"
          onClick={handleCopyRecap}
          className="px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-500 text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-2 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-stone-400" />
              <span>Share / Copy Recap</span>
            </>
          )}
        </button>
      </div>

      {/* Primary Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Week Focus</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {formatSecondsToHuman(thisWeekSeconds)}
          </div>
          <span className="text-[11px] font-semibold text-stone-400">
            {trendPercent >= 0 ? `+${trendPercent}%` : `${trendPercent}%`} vs prev week
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Streak</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {streakInfo.currentStreak}d
          </div>
          <span className="text-[11px] font-semibold text-stone-400">
            {streakInfo.isStreakAtRiskToday ? 'At risk today' : 'Safe & protected'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Best Day</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 truncate">
            {bestDay && bestDay.seconds > 0 ? bestDay.dayLabel : 'None yet'}
          </div>
          <span className="text-[11px] font-semibold text-stone-400">
            {bestDay && bestDay.seconds > 0 ? formatSecondsToHuman(bestDay.seconds) : 'No time logged'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <Award className="w-3.5 h-3.5 text-violet-500" />
            <span>Lead Goal</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 truncate">
            {topGoal ? topGoal.title : 'None yet'}
          </div>
          <span className="text-[11px] font-semibold text-stone-400">
            {topGoalSeconds > 0 ? formatSecondsToHuman(topGoalSeconds) : '0 hours'}
          </span>
        </div>
      </div>

      {/* 7-Day Visual Rhythm Bar Chart */}
      <div className="p-5 rounded-2xl bg-white/80 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-stone-700 dark:text-stone-300">
            7-Day Rhythm Breakdown
          </span>
          <span className="text-stone-400 text-[11px]">
            Peak: {formatSecondsToHuman(maxDaySeconds)}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2 items-end h-28">
          {dailyBreakdown.map((day) => {
            const barHeightPercent = Math.max(8, (day.seconds / maxDaySeconds) * 100);
            return (
              <div key={day.date} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] font-mono text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {day.seconds > 0 ? formatSecondsToHuman(day.seconds) : '0'}
                </span>
                <div className="w-full h-16 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-end overflow-hidden p-1">
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ${
                      day.isToday
                        ? 'bg-amber-500 shadow-xs'
                        : day.seconds > 0
                        ? 'bg-amber-400/80 dark:bg-amber-500/70'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${day.seconds > 0 ? barHeightPercent : 0}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-semibold ${
                    day.isToday
                      ? 'text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
