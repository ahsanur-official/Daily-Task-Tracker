import { Goal, Task, TimeSession, DayProgressSummary, DayTaskProgress, StreakInfo } from '../types';
import { getDaysDifference, addDaysToDateString, isDatePast } from './time';

/**
 * Calculates date-specific progress for a specific day, factoring in
 * normal daily task requirements and carried-over missed-day recovery balances.
 */
export function calculateDayProgress(
  targetDate: string,
  goals: Goal[],
  tasks: Task[],
  sessions: TimeSession[],
  todayDate: string
): DayProgressSummary {
  // Find all active goals that span across targetDate
  const activeGoalsOnDate = goals.filter((g) => {
    if (g.status === 'archived') return false;
    // If goal is active or completed, check if date falls between start and end date
    return targetDate >= g.startDate && targetDate <= g.endDate;
  });

  const taskProgressList: DayTaskProgress[] = [];

  let dayNormalRequiredSeconds = 0;
  let dayRecoverySeconds = 0;
  let dayCompletedSeconds = 0;

  for (const goal of activeGoalsOnDate) {
    const goalTasks = tasks.filter((t) => t.goalId === goal.id);

    for (const task of goalTasks) {
      const normalReqSeconds = task.requiredDurationMinutes * 60;
      
      // Calculate how much was missed from previous days for this task (up to targetDate - 1)
      let taskMissedRecoverySeconds = 0;

      // Only compute recovery for past missed days within this goal's lifespan
      if (targetDate >= goal.startDate) {
        let cursorDate = goal.startDate;
        
        while (cursorDate < targetDate) {
          // Check if task applied on cursorDate
          const taskRequiredOnDate = normalReqSeconds;
          // Completed on cursorDate
          const completedOnCursor = sessions
            .filter((s) => s.taskId === task.id && s.date === cursorDate)
            .reduce((acc, s) => acc + s.durationSeconds, 0);

          const shortfall = Math.max(0, taskRequiredOnDate - completedOnCursor);
          taskMissedRecoverySeconds += shortfall;

          cursorDate = addDaysToDateString(cursorDate, 1);
        }
      }

      // Check how much recovery has already been paid off between goal start and targetDate - 1:
      // In our model, on any day prior to targetDate, any completed time beyond that day's normal requirement
      // pays down the accumulated past debt!
      let priorSurplus = 0;
      let cursorDate2 = goal.startDate;
      while (cursorDate2 < targetDate) {
        const completedOnCursor = sessions
          .filter((s) => s.taskId === task.id && s.date === cursorDate2)
          .reduce((acc, s) => acc + s.durationSeconds, 0);
        const normalReq = normalReqSeconds;
        if (completedOnCursor > normalReq) {
          priorSurplus += (completedOnCursor - normalReq);
        }
        cursorDate2 = addDaysToDateString(cursorDate2, 1);
      }

      const netRecoveryRequired = Math.max(0, taskMissedRecoverySeconds - priorSurplus);

      // Sessions completed on targetDate
      const taskSessionsOnDate = sessions.filter(
        (s) => s.taskId === task.id && s.date === targetDate
      );
      const taskCompletedSeconds = taskSessionsOnDate.reduce((acc, s) => acc + s.durationSeconds, 0);

      const totalReq = normalReqSeconds + netRecoveryRequired;
      const remaining = Math.max(0, totalReq - taskCompletedSeconds);
      const isCompleted = totalReq > 0 ? taskCompletedSeconds >= totalReq : true;

      dayNormalRequiredSeconds += normalReqSeconds;
      dayRecoverySeconds += netRecoveryRequired;
      dayCompletedSeconds += taskCompletedSeconds;

      taskProgressList.push({
        taskId: task.id,
        goalId: goal.id,
        taskTitle: task.title,
        goalTitle: goal.title,
        goalColor: goal.color,
        goalColorLabel: goal.colorLabel,
        normalRequiredSeconds: normalReqSeconds,
        recoverySeconds: netRecoveryRequired,
        totalRequiredSeconds: totalReq,
        completedSeconds: taskCompletedSeconds,
        remainingSeconds: remaining,
        isCompleted,
        sessionsCount: taskSessionsOnDate.length,
      });
    }
  }

  const dayTotalRequiredSeconds = dayNormalRequiredSeconds + dayRecoverySeconds;
  const dayRemainingSeconds = Math.max(0, dayTotalRequiredSeconds - dayCompletedSeconds);
  const percentage = dayTotalRequiredSeconds > 0
    ? Math.min(100, Math.round((dayCompletedSeconds / dayTotalRequiredSeconds) * 100))
    : 0;

  const isCompleted = dayTotalRequiredSeconds > 0 && dayCompletedSeconds >= dayTotalRequiredSeconds;
  const isPartiallyCompleted = dayCompletedSeconds > 0 && !isCompleted;
  const isPast = isDatePast(targetDate, todayDate);
  const isMissed = isPast && !isCompleted;
  const isRecoveryFulfilled = dayRecoverySeconds > 0 && isCompleted;

  return {
    date: targetDate,
    normalRequiredSeconds: dayNormalRequiredSeconds,
    recoverySeconds: dayRecoverySeconds,
    totalRequiredSeconds: dayTotalRequiredSeconds,
    completedSeconds: dayCompletedSeconds,
    remainingSeconds: dayRemainingSeconds,
    percentage,
    isCompleted,
    isPartiallyCompleted,
    isMissed,
    isRecoveryFulfilled,
    tasks: taskProgressList,
  };
}

/**
 * Calculates current streak and best streak across user's history
 */
export function calculateStreaks(
  goals: Goal[],
  tasks: Task[],
  sessions: TimeSession[],
  todayDate: string
): StreakInfo {
  if (goals.length === 0 || tasks.length === 0) {
    return { currentStreak: 0, bestStreak: 0, isStreakMaintainedToday: false };
  }

  // Find earliest goal start date
  const earliestDate = goals.reduce(
    (min, g) => (g.startDate < min ? g.startDate : min),
    todayDate
  );

  const totalDays = Math.max(1, getDaysDifference(earliestDate, todayDate) + 1);

  // Check daily completion backwards from today or yesterday
  const dailyStatusMap: Record<string, boolean> = {};

  let checkDate = earliestDate;
  while (checkDate <= todayDate) {
    const summary = calculateDayProgress(checkDate, goals, tasks, sessions, todayDate);
    // If there were tasks required on that day, did the user complete them?
    if (summary.totalRequiredSeconds > 0) {
      dailyStatusMap[checkDate] = summary.isCompleted;
    } else {
      // If no tasks required on that day (e.g. before any goal started), ignore
      dailyStatusMap[checkDate] = false;
    }
    checkDate = addDaysToDateString(checkDate, 1);
  }

  const isStreakMaintainedToday = dailyStatusMap[todayDate] === true;

  // Calculate current streak
  let currentStreak = 0;
  let cursor = isStreakMaintainedToday ? todayDate : addDaysToDateString(todayDate, -1);

  while (cursor >= earliestDate) {
    if (dailyStatusMap[cursor] === true) {
      currentStreak++;
      cursor = addDaysToDateString(cursor, -1);
    } else {
      break;
    }
  }

  // Calculate best streak
  let bestStreak = 0;
  let runningStreak = 0;
  let forwardCursor = earliestDate;

  while (forwardCursor <= todayDate) {
    if (dailyStatusMap[forwardCursor] === true) {
      runningStreak++;
      if (runningStreak > bestStreak) {
        bestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
    forwardCursor = addDaysToDateString(forwardCursor, 1);
  }

  if (currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  return {
    currentStreak,
    bestStreak,
    isStreakMaintainedToday,
    lastActiveDate: isStreakMaintainedToday ? todayDate : undefined,
  };
}

/**
 * Checks if a goal is 100% fulfilled across all its days.
 * Returns progress metrics for the goal.
 */
export function evaluateGoalProgress(
  goal: Goal,
  tasks: Task[],
  sessions: TimeSession[]
) {
  const goalTasks = tasks.filter((t) => t.goalId === goal.id);
  const dailyTargetSeconds = goalTasks.reduce(
    (acc, t) => acc + t.requiredDurationMinutes * 60,
    0
  );

  const totalRequiredSeconds = dailyTargetSeconds * goal.durationDays;

  const goalSessions = sessions.filter((s) => s.goalId === goal.id);
  const totalCompletedSeconds = goalSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

  // Count fulfilled days
  let fulfilledDaysCount = 0;
  let cursorDate = goal.startDate;
  for (let i = 0; i < goal.durationDays; i++) {
    const daySessions = goalSessions.filter((s) => s.date === cursorDate);
    const daySeconds = daySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    if (daySeconds >= dailyTargetSeconds && dailyTargetSeconds > 0) {
      fulfilledDaysCount++;
    }
    cursorDate = addDaysToDateString(cursorDate, 1);
  }

  const isFulfilled =
    fulfilledDaysCount >= goal.durationDays ||
    (totalRequiredSeconds > 0 && totalCompletedSeconds >= totalRequiredSeconds);

  const percentage = totalRequiredSeconds > 0
    ? Math.min(100, Math.round((totalCompletedSeconds / totalRequiredSeconds) * 100))
    : 0;

  return {
    dailyTargetSeconds,
    totalRequiredSeconds,
    totalCompletedSeconds,
    remainingSeconds: Math.max(0, totalRequiredSeconds - totalCompletedSeconds),
    fulfilledDaysCount,
    durationDays: goal.durationDays,
    percentage,
    isFulfilled,
  };
}
