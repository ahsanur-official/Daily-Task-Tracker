export type GoalDurationOption = '3_days' | '7_days' | '15_days' | '30_days' | 'custom';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

export type GoalCategory = 
  | 'Coding & Tech'
  | 'Health & Fitness'
  | 'Learning & Language'
  | 'Reading & Writing'
  | 'Mindfulness'
  | 'Career & Business'
  | 'Creative & Design'
  | 'General';

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  bio: string;
  occupation?: string;
  companyOrSchool?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  avatarUrl: string;
  avatarStorageType?: 'uploaded_device' | 'url' | 'preset';
  timeZone: string;
  preferredDailyWorkingHours: number; // in hours, e.g. 4
  preferredWorkStartTime: string; // e.g. "09:00"
  preferredWorkEndTime: string; // e.g. "18:00"
  workingDays?: string[]; // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  primaryCategory?: GoalCategory;
  theme: 'light' | 'dark' | 'system';
  accentColor: string; // hex
  notificationsEnabled: boolean;
  timerNotificationsEnabled?: boolean;
  deadlineNotificationsEnabled?: boolean;
  soundEnabled: boolean;
  createdAt: string;
  accountTier?: 'Standard Member' | 'Pro Practitioner' | 'Master Disciplinarian' | 'Grandmaster Elite';
  lastLoginAt?: string;
  isGuest?: boolean;
}

export interface RegisteredUserAccount {
  profile: UserProfile;
  passwordHash: string;
}

export interface Task {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  description?: string;
  requiredDurationMinutes: number; // e.g. 60
  preferredTime?: string; // e.g. "09:00"
  deadlineTime?: string; // e.g. "18:00" (daily deadline)
  frequency: 'daily' | 'weekdays' | 'custom';
  notes?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  color: string;
  colorLabel?: string; // e.g. "Work", "Personal", "Health"
  iconName: string;
  durationOption: GoalDurationOption;
  durationDays: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: GoalStatus;
  motivationalQuote?: string;
  createdAt: string;
  completedAt?: string;
  certificateId?: string;
}

export interface TimeSession {
  id: string;
  taskId: string;
  goalId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startTimestamp: number; // ms
  endTimestamp: number; // ms
  durationSeconds: number;
  notes?: string;
  isOffline?: boolean;
  syncStatus: 'synced' | 'pending';
}

export interface ActiveTimerState {
  taskId: string;
  goalId: string;
  sessionStartTime: number; // ms timestamp when current run started
  accumulatedSecondsBeforeSession: number; // previously recorded seconds for this task today
  targetSeconds: number; // required duration for today in seconds
  isRunning: boolean;
  isDistractionFree: boolean;
}

export interface DayTaskProgress {
  taskId: string;
  goalId: string;
  taskTitle: string;
  goalTitle: string;
  goalColor: string;
  goalColorLabel?: string;
  normalRequiredSeconds: number;
  recoverySeconds: number;
  totalRequiredSeconds: number;
  completedSeconds: number;
  remainingSeconds: number;
  isCompleted: boolean;
  sessionsCount: number;
}

export interface DayProgressSummary {
  date: string; // YYYY-MM-DD
  normalRequiredSeconds: number;
  recoverySeconds: number;
  totalRequiredSeconds: number;
  completedSeconds: number;
  remainingSeconds: number;
  percentage: number;
  isCompleted: boolean;
  isPartiallyCompleted: boolean;
  isMissed: boolean;
  isRecoveryFulfilled: boolean;
  tasks: DayTaskProgress[];
}

export interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate?: string;
  isStreakMaintainedToday: boolean;
}

export interface Certificate {
  id: string; // e.g. DT-2026-X79K9A
  verificationCode: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  goalId: string;
  goalName: string;
  durationDays: number;
  totalSecondsTracked: number;
  startDate: string;
  completionDate: string;
  template: 'classic' | 'modern' | 'onyx' | 'emerald';
  issuedAt: string;
}

export interface SyncQueueItem {
  id: string;
  type?: 'time_session' | 'goal_update' | 'task_update' | 'certificate_issue';
  collection: 'users' | 'goals' | 'tasks' | 'sessions' | 'certificates';
  action: 'set' | 'update' | 'delete';
  docId: string;
  payload?: any;
  createdAt: number;
}

export interface AnalyticsSummary {
  todaySeconds: number;
  weekSeconds: number;
  monthSeconds: number;
  allTimeSeconds: number;
  completedGoalsCount: number;
  activeGoalsCount: number;
  completedTasksTotal: number;
  averageDailySeconds: number;
  overallCompletionRate: number;
  mostProductiveDayOfWeek: string;
}

export interface ScheduleBlockRecommendation {
  id: string;
  taskId: string;
  taskTitle: string;
  goalId: string;
  goalTitle: string;
  goalColor: string;
  category?: GoalCategory;
  startTime: string; // "14:00" (24h)
  endTime: string; // "14:45" (24h)
  durationMinutes: number;
  deadlineTime?: string; // "18:00" (24h)
  preferredTime?: string;
  urgency: 'critical' | 'tight' | 'optimal' | 'flexible';
  urgencyReason: string;
  confidenceScore: number; // 0-100
  bufferMinutesBeforeDeadline: number;
  isApplied?: boolean;
  hasRecoveryDebt?: boolean;
}

export interface ScheduleAnalysisResult {
  date: string;
  totalPendingMinutes: number;
  tasksWithDeadlinesCount: number;
  earliestDeadline?: string;
  recommendations: ScheduleBlockRecommendation[];
  hasConflicts: boolean;
  projectedFinishTime?: string;
  insights: string[];
}

