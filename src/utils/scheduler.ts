import { Goal, Task, TimeSession, UserProfile, ScheduleBlockRecommendation, ScheduleAnalysisResult } from '../types';
import { calculateDayProgress } from './recovery';

export interface SchedulerOptions {
  workStartTime?: string; // "09:00"
  workEndTime?: string; // "18:00"
  breakMinutes?: number; // 10
  prioritizeRecovery?: boolean; // true
}

/**
 * Convert "HH:MM" string to minutes from midnight (0 - 1439).
 */
export function timeStrToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 9 * 60; // Default 09:00
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Convert minutes from midnight to "HH:MM" (24h format).
 */
export function minutesToTimeStr(totalMinutes: number): string {
  const bounded = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const hrs = Math.floor(bounded / 60);
  const mins = bounded % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Formats "14:30" into a user-friendly 12-hour string like "2:30 PM".
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr || !timeStr.includes(':')) return timeStr;
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

interface TimeInterval {
  startMin: number;
  endMin: number;
  label?: string;
}

/**
 * Core Automated Scheduling & Deadline Recommendation Engine.
 * Analyzes active tasks, existing sessions, and deadlines to compute optimal non-overlapping focus blocks.
 */
export function generateScheduleRecommendations(
  date: string,
  goals: Goal[],
  tasks: Task[],
  sessions: TimeSession[],
  todayDate: string,
  user: UserProfile | null,
  options: SchedulerOptions = {}
): ScheduleAnalysisResult {
  const workStartMin = timeStrToMinutes(options.workStartTime || user?.preferredWorkStartTime || '09:00');
  const workEndMin = timeStrToMinutes(options.workEndTime || user?.preferredWorkEndTime || '18:00');
  const breakMinutes = options.breakMinutes !== undefined ? options.breakMinutes : 10;
  const isToday = date === todayDate;

  // Determine effective earliest scheduling start for the target date
  let earliestAvailableMin = workStartMin;
  if (isToday) {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    // Start from current time rounded to next 5 minutes or work start, whichever is greater
    const roundedCurrentMin = Math.ceil((currentMin + 2) / 5) * 5;
    if (roundedCurrentMin > earliestAvailableMin && roundedCurrentMin < workEndMin - 15) {
      earliestAvailableMin = roundedCurrentMin;
    }
  }

  // 1. Gather already recorded sessions on this date to treat as occupied blocks
  const daySessions = sessions.filter((s) => s.date === date);
  const occupiedIntervals: TimeInterval[] = [];

  daySessions.forEach((s) => {
    if (s.startTimestamp && s.durationSeconds > 60) {
      const sessionDate = new Date(s.startTimestamp);
      const sStartMin = sessionDate.getHours() * 60 + sessionDate.getMinutes();
      const sEndMin = sStartMin + Math.ceil(s.durationSeconds / 60);
      occupiedIntervals.push({
        startMin: Math.max(0, sStartMin),
        endMin: Math.min(24 * 60, sEndMin),
        label: 'Completed Focus Session',
      });
    }
  });

  // Sort occupied intervals
  occupiedIntervals.sort((a, b) => a.startMin - b.startMin);

  // 2. Compute task progress for the day
  const dayProgress = calculateDayProgress(date, goals, tasks, sessions, todayDate);

  // Filter tasks that need time
  const pendingTasks = dayProgress.tasks
    .filter((tp) => tp.remainingSeconds > 0)
    .map((tp) => {
      const taskObj = tasks.find((t) => t.id === tp.taskId);
      const goalObj = goals.find((g) => g.id === tp.goalId);
      const deadline = taskObj?.deadlineTime || user?.preferredWorkEndTime || '18:00';
      const deadlineMin = timeStrToMinutes(deadline);
      const remainingMin = Math.max(10, Math.ceil(tp.remainingSeconds / 60));
      const hasRecovery = tp.recoverySeconds > 0;
      const preferredMin = taskObj?.preferredTime ? timeStrToMinutes(taskObj.preferredTime) : null;

      return {
        tp,
        taskObj,
        goalObj,
        deadline,
        deadlineMin,
        remainingMin,
        hasRecovery,
        preferredMin,
        headroomMin: deadlineMin - remainingMin, // Buffer if finished right at deadline
      };
    });

  // 3. Sort tasks prioritizing deadlines and recovery debt:
  // - 1st: Tasks with impending deadlines (headroom smallest)
  // - 2nd: Tasks with recovery debt (must not miss streak)
  // - 3rd: Has preferred time
  pendingTasks.sort((a, b) => {
    if (a.hasRecovery && !b.hasRecovery) return -1;
    if (!a.hasRecovery && b.hasRecovery) return 1;
    if (a.deadlineMin !== b.deadlineMin) return a.deadlineMin - b.deadlineMin;
    if (a.preferredMin && !b.preferredMin) return -1;
    if (!a.preferredMin && b.preferredMin) return 1;
    return b.remainingMin - a.remainingMin;
  });

  const recommendations: ScheduleBlockRecommendation[] = [];
  const plannedIntervals: TimeInterval[] = [...occupiedIntervals];
  let hasConflicts = false;
  let earliestDeadlineMin: number | null = null;

  // Helper: check if interval [start, end] overlaps with any occupied interval
  const isOverlap = (start: number, end: number) => {
    return plannedIntervals.some((interval) => {
      return Math.max(start, interval.startMin) < Math.min(end, interval.endMin);
    });
  };

  // Helper: find next contiguous free slot of duration `durMin` starting at or after `startSearchMin`
  const findFreeSlot = (durMin: number, startSearchMin: number, maxEndMin: number) => {
    let cursor = startSearchMin;

    while (cursor + durMin <= maxEndMin) {
      const candidateEnd = cursor + durMin;
      const conflicting = plannedIntervals.find(
        (int) => Math.max(cursor, int.startMin) < Math.min(candidateEnd, int.endMin)
      );

      if (!conflicting) {
        return { start: cursor, end: candidateEnd };
      }

      // Jump cursor to end of conflicting interval + buffer
      cursor = Math.ceil((conflicting.endMin + breakMinutes) / 5) * 5;
    }

    return null;
  };

  // 4. Place each pending task into the schedule
  let currentCursor = earliestAvailableMin;

  pendingTasks.forEach((item) => {
    const { tp, taskObj, goalObj, deadline, deadlineMin, remainingMin, hasRecovery, preferredMin } = item;

    if (earliestDeadlineMin === null || deadlineMin < earliestDeadlineMin) {
      earliestDeadlineMin = deadlineMin;
    }

    let allocatedStart: number;
    let allocatedEnd: number;
    let urgency: 'critical' | 'tight' | 'optimal' | 'flexible' = 'optimal';
    let urgencyReason = '';

    // Check preferred time first if provided and available
    let slotFound = false;
    if (preferredMin && preferredMin >= earliestAvailableMin) {
      if (!isOverlap(preferredMin, preferredMin + remainingMin)) {
        allocatedStart = preferredMin;
        allocatedEnd = preferredMin + remainingMin;
        slotFound = true;
      }
    }

    if (!slotFound) {
      // Find optimal slot before deadline
      const slotBeforeDeadline = findFreeSlot(remainingMin, currentCursor, deadlineMin);

      if (slotBeforeDeadline) {
        allocatedStart = slotBeforeDeadline.start;
        allocatedEnd = slotBeforeDeadline.end;
        slotFound = true;
      } else {
        // Fallback: search anywhere in working hours or slightly extended
        const fallbackSlot = findFreeSlot(remainingMin, currentCursor, workEndMin + 180);
        if (fallbackSlot) {
          allocatedStart = fallbackSlot.start;
          allocatedEnd = fallbackSlot.end;
          slotFound = true;
          hasConflicts = true;
        } else {
          // Absolute fallback
          allocatedStart = currentCursor;
          allocatedEnd = currentCursor + remainingMin;
          hasConflicts = true;
        }
      }
    }

    // Register planned interval with buffer
    plannedIntervals.push({
      startMin: allocatedStart,
      endMin: allocatedEnd + breakMinutes,
      label: tp.taskTitle,
    });
    plannedIntervals.sort((a, b) => a.startMin - b.startMin);

    // Update running cursor
    currentCursor = Math.max(currentCursor, allocatedEnd + breakMinutes);

    // Calculate buffer to deadline
    const bufferMinutesBeforeDeadline = deadlineMin - allocatedEnd;

    // Determine urgency and rationale
    if (allocatedEnd > deadlineMin) {
      urgency = 'critical';
      hasConflicts = true;
      const overBy = allocatedEnd - deadlineMin;
      urgencyReason = `Extends ${overBy}m past deadline (${formatTime12h(deadline)})! Prioritize immediately.`;
    } else if (bufferMinutesBeforeDeadline <= 45) {
      urgency = 'tight';
      urgencyReason = `Starts close to cutoff with only ${bufferMinutesBeforeDeadline}m buffer before ${formatTime12h(deadline)}.`;
    } else if (hasRecovery) {
      urgency = 'optimal';
      urgencyReason = `Includes recovery debt. Scheduled early to safeguard your active streak before ${formatTime12h(deadline)}.`;
    } else if (bufferMinutesBeforeDeadline >= 120) {
      urgency = 'flexible';
      urgencyReason = `Ample ${Math.floor(bufferMinutesBeforeDeadline / 60)}h safety buffer before ${formatTime12h(deadline)} deadline.`;
    } else {
      urgency = 'optimal';
      urgencyReason = `Strategically placed with ${bufferMinutesBeforeDeadline}m buffer ahead of ${formatTime12h(deadline)} deadline.`;
    }

    const confidenceScore = Math.max(
      40,
      Math.min(
        99,
        allocatedEnd <= deadlineMin
          ? 98 - (urgency === 'tight' ? 12 : 0)
          : 60 - Math.min(30, (allocatedEnd - deadlineMin))
      )
    );

    recommendations.push({
      id: `rec_${tp.taskId}_${date}`,
      taskId: tp.taskId,
      taskTitle: tp.taskTitle,
      goalId: tp.goalId,
      goalTitle: tp.goalTitle,
      goalColor: tp.goalColor,
      category: goalObj?.category,
      startTime: minutesToTimeStr(allocatedStart),
      endTime: minutesToTimeStr(allocatedEnd),
      durationMinutes: remainingMin,
      deadlineTime: taskObj?.deadlineTime || (user?.preferredWorkEndTime ?? undefined),
      preferredTime: taskObj?.preferredTime,
      urgency,
      urgencyReason,
      confidenceScore,
      bufferMinutesBeforeDeadline,
      hasRecoveryDebt: hasRecovery,
    });
  });

  // Sort recommendations chronologically by start time
  recommendations.sort((a, b) => timeStrToMinutes(a.startTime) - timeStrToMinutes(b.startTime));

  // Compute insights
  const totalPendingMinutes = pendingTasks.reduce((acc, t) => acc + t.remainingMin, 0);
  const tasksWithDeadlinesCount = pendingTasks.filter((t) => t.taskObj?.deadlineTime).length;
  const latestBlockEndMin = recommendations.length > 0
    ? Math.max(...recommendations.map((r) => timeStrToMinutes(r.endTime)))
    : earliestAvailableMin;

  const insights: string[] = [];

  if (recommendations.length === 0) {
    insights.push('All scheduled targets for this day are 100% completed! Streak is preserved.');
  } else {
    if (hasConflicts) {
      insights.push('Warning: Tight schedule detected. One or more blocks overlap near or past their deadlines.');
    } else {
      insights.push(
        `All ${recommendations.length} pending task blocks fit safely before their deadlines with buffer breaks.`
      );
    }

    if (earliestDeadlineMin !== null) {
      insights.push(
        `Earliest deadline cutoff is at ${formatTime12h(minutesToTimeStr(earliestDeadlineMin))}.`
      );
    }

    if (totalPendingMinutes > 0) {
      insights.push(
        `Total estimated focus requirement: ${Math.floor(totalPendingMinutes / 60)}h ${totalPendingMinutes % 60}m.`
      );
    }

    const recoveryCount = recommendations.filter((r) => r.hasRecoveryDebt).length;
    if (recoveryCount > 0) {
      insights.push(
        `${recoveryCount} task(s) include streak recovery debt and were prioritized first.`
      );
    }
  }

  return {
    date,
    totalPendingMinutes,
    tasksWithDeadlinesCount,
    earliestDeadline: earliestDeadlineMin !== null ? minutesToTimeStr(earliestDeadlineMin) : undefined,
    recommendations,
    hasConflicts,
    projectedFinishTime: recommendations.length > 0 ? minutesToTimeStr(latestBlockEndMin) : undefined,
    insights,
  };
}
