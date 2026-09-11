import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Calendar,
  Check,
  Zap,
  ArrowRight,
  RotateCcw,
  Info,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  generateScheduleRecommendations,
  formatTime12h,
  timeStrToMinutes,
  minutesToTimeStr,
  SchedulerOptions,
} from '../../utils/scheduler';
import { formatFullDateLabel, formatSecondsToHuman } from '../../utils/time';
import { ScheduleBlockRecommendation } from '../../types';

interface ScheduleRecommendationsCardProps {
  selectedDate: string;
}

export const ScheduleRecommendationsCard: React.FC<ScheduleRecommendationsCardProps> = ({
  selectedDate,
}) => {
  const { goals, tasks, sessions, todayDate, user, updateTask, startTimer, setActiveView } = useApp();

  const [activeTab, setActiveTab] = useState<'blocks' | 'timeline' | 'settings'>('blocks');

  // Tunable scheduler options
  const [options, setOptions] = useState<SchedulerOptions>({
    workStartTime: user?.preferredWorkStartTime || '08:30',
    workEndTime: user?.preferredWorkEndTime || '18:00',
    breakMinutes: 10,
    prioritizeRecovery: true,
  });

  const [appliedBlockIds, setAppliedBlockIds] = useState<Set<string>>(new Set());
  const [bulkApplied, setBulkApplied] = useState(false);

  // Generate automated recommendations
  const analysis = useMemo(() => {
    return generateScheduleRecommendations(
      selectedDate,
      goals,
      tasks,
      sessions,
      todayDate,
      user,
      options
    );
  }, [selectedDate, goals, tasks, sessions, todayDate, user, options]);

  const isToday = selectedDate === todayDate;

  // Handle applying a single recommended time block to a task
  const handleApplyBlock = (rec: ScheduleBlockRecommendation) => {
    updateTask(rec.taskId, {
      preferredTime: rec.startTime,
    });
    setAppliedBlockIds((prev) => new Set(prev).add(rec.id));
  };

  // Bulk apply all recommendations
  const handleApplyAll = () => {
    analysis.recommendations.forEach((rec) => {
      updateTask(rec.taskId, {
        preferredTime: rec.startTime,
      });
    });
    const allIds = new Set(analysis.recommendations.map((r) => r.id));
    setAppliedBlockIds(allIds);
    setBulkApplied(true);
    setTimeout(() => setBulkApplied(false), 3000);
  };

  // Launch focus timer directly from recommendation
  const handleStartTimer = (taskId: string) => {
    startTimer(taskId, true); // Opens fullscreen active timer
  };

  // Hours for timeline view (from min start to max end)
  const timelineStartHour = Math.max(
    6,
    Math.min(8, Math.floor(timeStrToMinutes(options.workStartTime || '08:30') / 60))
  );
  const timelineEndHour = Math.min(
    23,
    Math.max(19, Math.ceil(timeStrToMinutes(options.workEndTime || '18:00') / 60) + 1)
  );
  const totalTimelineMinutes = (timelineEndHour - timelineStartHour) * 60;

  return (
    <div
      id="automated-schedule-card"
      className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Automated Schedule Blocks
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                Deadline Engine
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Analyzes task deadlines, recovery debt, and existing sessions for{' '}
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {formatFullDateLabel(selectedDate, user?.timeZone)}
              </span>
              {isToday && ' (Today)'}.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl shrink-0 self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('blocks')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'blocks'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Recommended ({analysis.recommendations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Day Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title="Schedule Parameters & Work Hours"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider">
            Pending Time
          </span>
          <span className="text-base font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5 block">
            {analysis.totalPendingMinutes > 0
              ? `${Math.floor(analysis.totalPendingMinutes / 60)}h ${analysis.totalPendingMinutes % 60}m`
              : '0m (Done!)'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider">
            Deadlines Analyzed
          </span>
          <span className="text-base font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5 block">
            {analysis.tasksWithDeadlinesCount > 0
              ? `${analysis.tasksWithDeadlinesCount} cutoff(s)`
              : 'End of work day'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider">
            Earliest Deadline
          </span>
          <span className="text-base font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5 block">
            {analysis.earliestDeadline ? formatTime12h(analysis.earliestDeadline) : 'None'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold text-stone-400 block uppercase tracking-wider">
            Target Completion
          </span>
          <span className="text-base font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5 block">
            {analysis.projectedFinishTime
              ? formatTime12h(analysis.projectedFinishTime)
              : 'Ready'}
          </span>
        </div>
      </div>

      {/* Insights Alert Bar */}
      {analysis.insights.length > 0 && (
        <div
          className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
            analysis.hasConflicts
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          {analysis.hasConflicts ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <div className="text-xs space-y-0.5 flex-1">
            {analysis.insights.map((insight, idx) => (
              <p key={idx} className="leading-relaxed">
                {insight}
              </p>
            ))}
          </div>

          {analysis.recommendations.length > 1 && (
            <button
              type="button"
              id="apply-all-schedule-blocks-btn"
              onClick={handleApplyAll}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${
                bulkApplied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 hover:bg-stone-800'
              }`}
            >
              {bulkApplied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Applied All!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Apply All Blocks</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* TAB 1: Recommended Blocks List */}
      {activeTab === 'blocks' && (
        <div className="space-y-3">
          {analysis.recommendations.length === 0 ? (
            <div className="text-center py-10 rounded-2xl bg-stone-50 dark:bg-stone-800/20 border border-dashed border-stone-200 dark:border-stone-800 text-stone-500">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                No Pending Schedule Blocks
              </h4>
              <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">
                All daily requirements on this date are met, or no active tasks are pending.
              </p>
            </div>
          ) : (
            analysis.recommendations.map((rec) => {
              const isApplied = appliedBlockIds.has(rec.id) || rec.preferredTime === rec.startTime;
              const isUrgent = rec.urgency === 'critical';
              const isTight = rec.urgency === 'tight';

              return (
                <div
                  key={rec.id}
                  id={`schedule-rec-${rec.taskId}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    isUrgent
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : isTight
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                      : 'bg-stone-50/50 dark:bg-stone-800/30 border-stone-200/80 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Time & Task Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Time Slot Badge */}
                        <span className="inline-flex items-center gap-1 text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            {formatTime12h(rec.startTime)} – {formatTime12h(rec.endTime)}
                          </span>
                          <span className="text-stone-400 font-normal">
                            ({rec.durationMinutes}m)
                          </span>
                        </span>

                        {/* Urgency Pill */}
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isUrgent
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                              : isTight
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isUrgent
                            ? 'Critical Deadline'
                            : isTight
                            ? 'Tight Cutoff Window'
                            : 'Optimal Time Block'}
                        </span>

                        {/* Recovery Pill if applicable */}
                        {rec.hasRecoveryDebt && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            <span>Streak Recovery</span>
                          </span>
                        )}
                      </div>

                      {/* Task & Goal Titles */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: rec.goalColor }}
                        />
                        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                          {rec.taskTitle}
                        </h4>
                        <span className="text-xs text-stone-400 truncate">
                          • {rec.goalTitle}
                        </span>
                      </div>

                      {/* Recommendation Rationale */}
                      <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                        {rec.urgencyReason}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApplyBlock(rec)}
                        disabled={isApplied}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isApplied
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200'
                        }`}
                        title="Set this recommended time slot as the preferred start time for this task"
                      >
                        {isApplied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Scheduled</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span>Adopt Block</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartTimer(rec.taskId)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                        title="Launch active focus timer for this task"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Timer</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Day Timeline Visualization */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/30 border border-stone-200/80 dark:border-stone-800 overflow-x-auto">
            {/* Timeline Header Hour Markers */}
            <div className="min-w-[650px]">
              <div className="relative h-6 border-b border-stone-200 dark:border-stone-700 mb-3">
                {Array.from({ length: timelineEndHour - timelineStartHour + 1 }).map((_, i) => {
                  const hour = timelineStartHour + i;
                  const leftPercent = (i / (timelineEndHour - timelineStartHour)) * 100;

                  return (
                    <div
                      key={hour}
                      className="absolute top-0 transform -translate-x-1/2 text-[10px] font-mono text-stone-400"
                      style={{ left: `${leftPercent}%` }}
                    >
                      {hour % 12 === 0 ? 12 : hour % 12}
                      {hour >= 12 ? 'p' : 'a'}
                    </div>
                  );
                })}
              </div>

              {/* Timeline Stage with Blocks */}
              <div className="relative h-20 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-1.5 overflow-hidden">
                {/* Background grid lines */}
                {Array.from({ length: timelineEndHour - timelineStartHour }).map((_, i) => {
                  const leftPercent = (i / (timelineEndHour - timelineStartHour)) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-r border-stone-100 dark:border-stone-800/60 pointer-events-none"
                      style={{ left: `${leftPercent}%` }}
                    />
                  );
                })}

                {/* Render Recorded Past Sessions */}
                {sessions
                  .filter((s) => s.date === selectedDate && s.durationSeconds > 60)
                  .map((s) => {
                    const sessionDate = new Date(s.startTimestamp);
                    const sMin = sessionDate.getHours() * 60 + sessionDate.getMinutes();
                    const sDurMin = Math.ceil(s.durationSeconds / 60);

                    const startOffset = sMin - timelineStartHour * 60;
                    const leftPct = Math.max(0, Math.min(100, (startOffset / totalTimelineMinutes) * 100));
                    const widthPct = Math.max(1.5, Math.min(100 - leftPct, (sDurMin / totalTimelineMinutes) * 100));

                    return (
                      <div
                        key={s.id}
                        className="absolute top-1.5 bottom-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-[10px] font-bold text-emerald-800 dark:text-emerald-200 px-1 truncate shadow-2xs"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={`Completed Focus Session: ${formatSecondsToHuman(s.durationSeconds)}`}
                      >
                        ✓ Completed
                      </div>
                    );
                  })}

                {/* Render Recommended Blocks */}
                {analysis.recommendations.map((rec) => {
                  const startMin = timeStrToMinutes(rec.startTime);
                  const durMin = rec.durationMinutes;
                  const startOffset = startMin - timelineStartHour * 60;
                  const leftPct = Math.max(0, Math.min(100, (startOffset / totalTimelineMinutes) * 100));
                  const widthPct = Math.max(2, Math.min(100 - leftPct, (durMin / totalTimelineMinutes) * 100));

                  return (
                    <div
                      key={rec.id}
                      className="absolute top-1.5 bottom-1.5 rounded-lg border-2 border-dashed flex flex-col justify-center px-1.5 truncate shadow-xs transition-all hover:scale-102 hover:z-10 cursor-pointer"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: `${rec.goalColor}20`,
                        borderColor: rec.goalColor,
                      }}
                      onClick={() => handleStartTimer(rec.taskId)}
                      title={`${rec.taskTitle}: ${formatTime12h(rec.startTime)} - ${formatTime12h(rec.endTime)} (${rec.durationMinutes}m). Click to start timer.`}
                    >
                      <span className="text-[10px] font-bold truncate" style={{ color: rec.goalColor }}>
                        {rec.taskTitle}
                      </span>
                      <span className="text-[9px] font-mono text-stone-500 dark:text-stone-400 truncate">
                        {rec.startTime}
                      </span>
                    </div>
                  );
                })}

                {/* Deadline markers */}
                {analysis.recommendations.map((rec) => {
                  if (!rec.deadlineTime) return null;
                  const dMin = timeStrToMinutes(rec.deadlineTime);
                  const dOffset = dMin - timelineStartHour * 60;
                  if (dOffset < 0 || dOffset > totalTimelineMinutes) return null;
                  const leftPct = (dOffset / totalTimelineMinutes) * 100;

                  return (
                    <div
                      key={`dl_${rec.id}`}
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none"
                      style={{ left: `${leftPct}%` }}
                      title={`Deadline: ${formatTime12h(rec.deadlineTime)}`}
                    >
                      <span className="absolute -top-1 transform -translate-x-1/2 bg-rose-500 text-white text-[8px] font-bold px-1 rounded-sm uppercase tracking-wider">
                        Cutoff
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Timeline Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500" />
                <span>Recorded Sessions</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-500/20 border-2 border-dashed border-amber-500" />
                <span>Recommended Focus Blocks</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-3 bg-rose-500 rounded-xs" />
                <span>Task Deadline</span>
              </span>
            </div>
            <span className="text-[11px] text-stone-400 italic">
              Click any recommended block to launch its focus session.
            </span>
          </div>
        </div>
      )}

      {/* TAB 3: Schedule Settings & Tuning */}
      {activeTab === 'settings' && (
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/30 border border-stone-200/80 dark:border-stone-800 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Scheduling Algorithm Preferences
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Configure your daily working window and breathing breaks to tune automated block recommendations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Earliest Work Start
              </label>
              <input
                type="time"
                value={options.workStartTime || '08:30'}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, workStartTime: e.target.value }))
                }
                className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-stone-800 dark:text-stone-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Latest Work Cutoff
              </label>
              <input
                type="time"
                value={options.workEndTime || '18:00'}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, workEndTime: e.target.value }))
                }
                className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-stone-800 dark:text-stone-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Break Buffer Between Blocks
              </label>
              <select
                value={options.breakMinutes || 10}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, breakMinutes: Number(e.target.value) }))
                }
                className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-stone-800 dark:text-stone-200"
              >
                <option value={5}>5 minutes buffer</option>
                <option value={10}>10 minutes buffer</option>
                <option value={15}>15 minutes buffer</option>
                <option value={20}>20 minutes buffer</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="prioritize-recovery-chk"
                checked={options.prioritizeRecovery !== false}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, prioritizeRecovery: e.target.checked }))
                }
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              <label
                htmlFor="prioritize-recovery-chk"
                className="text-xs font-medium text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                Prioritize streak recovery debt blocks before new tasks
              </label>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('blocks')}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer"
            >
              Done & Recalculate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
