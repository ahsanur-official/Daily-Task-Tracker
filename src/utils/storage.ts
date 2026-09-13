import { Goal, Task, TimeSession, UserProfile, Certificate, SyncQueueItem } from '../types';
import { getTodayDateString, addDaysToDateString, generateCertificateId, generateVerificationHash } from './time';

const STORAGE_KEYS = {
  USER_PROFILE: 'dt_user_profile',
  REGISTERED_USERS: 'dt_registered_users',
  AUTH_TOKEN: 'dt_auth_token',
  GOALS: 'dt_goals',
  TASKS: 'dt_tasks',
  SESSIONS: 'dt_sessions',
  CERTIFICATES: 'dt_certificates',
  ACTIVE_TIMER: 'dt_active_timer',
  SYNC_QUEUE: 'dt_sync_queue',
  SETTINGS: 'dt_settings',
  THEME_PREFERENCE: 'dt_theme_preference',
  SIDEBAR_COLLAPSED: 'dt_sidebar_collapsed',
};

// Clean initial empty state - Real data is persisted in Firebase Firestore
export function getInitialSeedData(_today?: string) {
  return {
    user: null as UserProfile | null,
    registeredAccounts: [] as any[],
    goals: [] as Goal[],
    tasks: [] as Task[],
    sessions: [] as TimeSession[],
    certificates: [] as Certificate[],
  };
}

// Storage Helpers
export function loadFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to persist to localStorage for key ${key}:`, err);
  }
}

export { STORAGE_KEYS };

// Data Export Functions
export function exportDataAsJSON(data: {
  user: UserProfile | null;
  goals: Goal[];
  tasks: Task[];
  sessions: TimeSession[];
  certificates: Certificate[];
}) {
  const exportPayload = {
    application: 'Daily Task & Goal Tracker',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    ...data,
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `daily-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSessionsAsCSV(sessions: TimeSession[], tasks: Task[], goals: Goal[]) {
  const taskMap = new Map(tasks.map((t) => [t.id, t.title]));
  const goalMap = new Map(goals.map((g) => [g.id, g.title]));

  const headers = ['Session ID', 'Date', 'Goal', 'Task', 'Duration (Minutes)', 'Duration (Seconds)', 'Start Time', 'End Time', 'Status'];
  const rows = sessions.map((s) => [
    s.id,
    s.date,
    `"${(goalMap.get(s.goalId) || 'Unknown').replace(/"/g, '""')}"`,
    `"${(taskMap.get(s.taskId) || 'Unknown').replace(/"/g, '""')}"`,
    Math.round(s.durationSeconds / 60),
    s.durationSeconds,
    new Date(s.startTimestamp).toISOString(),
    new Date(s.endTimestamp).toISOString(),
    s.syncStatus,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `time-sessions-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
