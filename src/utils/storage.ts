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
};

// Seed sample user and data so the app has an inspiring, instantly usable state
export function getInitialSeedData(today: string) {
  const sampleUser: UserProfile = {
    id: 'user_alex_rivera',
    fullName: 'Alex Rivera',
    username: 'alexrivera',
    email: 'alex@dailytracker.app',
    phone: '+1 (555) 234-8901',
    bio: 'Software engineer & lifelong learner. Focused on daily consistency, system architecture, and deep work habits.',
    occupation: 'Senior Software Engineer & Habit Architect',
    companyOrSchool: 'Distributed Systems Labs',
    location: 'San Francisco, CA',
    website: 'https://alexrivera.dev',
    github: 'alexrivera',
    linkedin: 'alex-rivera-tech',
    twitter: 'alexrivera_dev',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    avatarStorageType: 'preset',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
    preferredDailyWorkingHours: 4,
    preferredWorkStartTime: '09:00',
    preferredWorkEndTime: '18:00',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    primaryCategory: 'Coding & Tech',
    theme: 'light',
    accentColor: '#f59e0b',
    notificationsEnabled: true,
    soundEnabled: true,
    createdAt: addDaysToDateString(today, -35),
    accountTier: 'Master Disciplinarian',
    lastLoginAt: new Date().toISOString(),
  };

  const seedRegisteredAccounts = [
    {
      profile: sampleUser,
      passwordHash: 'password123',
    },
    {
      profile: {
        id: 'user_sarah_chen',
        fullName: 'Dr. Sarah Chen',
        username: 'sarahchen',
        email: 'sarah@dailytracker.app',
        phone: '+1 (555) 456-7890',
        bio: 'Biomedical researcher, marathon runner, and science communicator. Devoted to daily progress.',
        occupation: 'Biomedical Scientist & Endurance Runner',
        companyOrSchool: 'BioHealth Institute',
        location: 'Boston, MA',
        website: 'https://sarahchen.bio',
        github: 'schen-research',
        linkedin: 'sarah-chen-phd',
        twitter: 'sarahchen_sci',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
        avatarStorageType: 'preset' as const,
        timeZone: 'America/New_York',
        preferredDailyWorkingHours: 5,
        preferredWorkStartTime: '07:30',
        preferredWorkEndTime: '17:30',
        workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        primaryCategory: 'Health & Fitness' as const,
        theme: 'light' as const,
        accentColor: '#10b981',
        notificationsEnabled: true,
        soundEnabled: true,
        createdAt: addDaysToDateString(today, -45),
        accountTier: 'Pro Practitioner' as const,
        lastLoginAt: new Date().toISOString(),
      },
      passwordHash: 'password123',
    },
    {
      profile: {
        id: 'user_ahsanur_rahaman',
        fullName: 'Ahsanur Rahaman',
        username: 'ahsanur',
        email: 'mdahsanurrahaman2456@gmail.com',
        phone: '+880 1700 000000',
        bio: 'Full-stack developer striving for software craftsmanship, consistent daily progress, and peak focus.',
        occupation: 'Full-Stack Software Engineer',
        companyOrSchool: 'Tech Innovators Studio',
        location: 'Dhaka, Bangladesh',
        website: 'https://github.com/ahsanur',
        github: 'ahsanur',
        linkedin: 'ahsanur-rahaman',
        twitter: 'ahsanur_dev',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        avatarStorageType: 'preset' as const,
        timeZone: 'Asia/Dhaka',
        preferredDailyWorkingHours: 6,
        preferredWorkStartTime: '09:00',
        preferredWorkEndTime: '19:00',
        workingDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
        primaryCategory: 'Coding & Tech' as const,
        theme: 'dark' as const,
        accentColor: '#f59e0b',
        notificationsEnabled: true,
        soundEnabled: true,
        createdAt: addDaysToDateString(today, -60),
        accountTier: 'Master Disciplinarian' as const,
        lastLoginAt: new Date().toISOString(),
      },
      passwordHash: 'password123',
    },
  ];

  // Goal 1: Active 30-Day Goal "Learn High-Performance React"
  const goal1StartDate = addDaysToDateString(today, -12); // Day 13 today
  const goal1EndDate = addDaysToDateString(goal1StartDate, 29);
  const goal1: Goal = {
    id: 'goal_react_mastery',
    userId: sampleUser.id,
    title: 'Modern Full-Stack Architecture',
    description: 'Master clean architecture, performance optimization, and scalable web apps.',
    category: 'Coding & Tech',
    color: '#0284c7', // Sky blue
    iconName: 'Code2',
    durationOption: '30_days',
    durationDays: 30,
    startDate: goal1StartDate,
    endDate: goal1EndDate,
    status: 'active',
    motivationalQuote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    createdAt: goal1StartDate,
  };

  const task1A: Task = {
    id: 'task_react_deep_work',
    goalId: goal1.id,
    userId: sampleUser.id,
    title: 'Core System Implementation',
    description: 'Build production features and clean component patterns.',
    requiredDurationMinutes: 60,
    preferredTime: '10:00',
    deadlineTime: '17:00',
    frequency: 'daily',
    createdAt: goal1StartDate,
  };

  const task1B: Task = {
    id: 'task_react_read',
    goalId: goal1.id,
    userId: sampleUser.id,
    title: 'Read Technical Architecture Docs',
    description: 'Study RFCs and documentation on memory management.',
    requiredDurationMinutes: 30,
    deadlineTime: '19:30',
    frequency: 'daily',
    createdAt: goal1StartDate,
  };

  // Goal 2: Active 15-Day Fitness Goal "Morning High-Intensity Movement"
  const goal2StartDate = addDaysToDateString(today, -6); // Day 7
  const goal2EndDate = addDaysToDateString(goal2StartDate, 14);
  const goal2: Goal = {
    id: 'goal_daily_fitness',
    userId: sampleUser.id,
    title: 'Morning Athletic Conditioning',
    description: 'Build cardio endurance, core strength, and physical resilience.',
    category: 'Health & Fitness',
    color: '#10b981', // Emerald
    iconName: 'Activity',
    durationOption: '15_days',
    durationDays: 15,
    startDate: goal2StartDate,
    endDate: goal2EndDate,
    status: 'active',
    motivationalQuote: 'Discipline equals freedom.',
    createdAt: goal2StartDate,
  };

  const task2A: Task = {
    id: 'task_fitness_session',
    goalId: goal2.id,
    userId: sampleUser.id,
    title: 'Cardio & Strength Workout',
    description: 'Zone 2 running or bodyweight strength circuit.',
    requiredDurationMinutes: 45,
    deadlineTime: '12:00',
    frequency: 'daily',
    createdAt: goal2StartDate,
  };

  // Goal 3: Completed 7-Day Goal "Mindfulness & Deep Meditation"
  const goal3StartDate = addDaysToDateString(today, -20);
  const goal3EndDate = addDaysToDateString(today, -14);
  const certId = generateCertificateId();
  const goal3: Goal = {
    id: 'goal_mindfulness_7d',
    userId: sampleUser.id,
    title: '7 Days of Mindfulness & Clarity',
    description: 'Daily breathwork, silent reflection, and stress reduction.',
    category: 'Mindfulness',
    color: '#8b5cf6', // Violet
    iconName: 'Sparkles',
    durationOption: '7_days',
    durationDays: 7,
    startDate: goal3StartDate,
    endDate: goal3EndDate,
    status: 'completed',
    motivationalQuote: 'Quiet the mind and the soul will speak.',
    createdAt: goal3StartDate,
    completedAt: goal3EndDate,
    certificateId: certId,
  };

  const task3A: Task = {
    id: 'task_meditation',
    goalId: goal3.id,
    userId: sampleUser.id,
    title: 'Vipassana & Box Breathing',
    description: '20 minutes of undistracted sitting practice.',
    requiredDurationMinutes: 20,
    frequency: 'daily',
    createdAt: goal3StartDate,
  };

  // Completed Certificate for Goal 3
  const sampleCertificate: Certificate = {
    id: certId,
    verificationCode: generateVerificationHash(certId, sampleUser.fullName),
    userId: sampleUser.id,
    userName: sampleUser.fullName,
    userAvatar: sampleUser.avatarUrl,
    goalId: goal3.id,
    goalName: goal3.title,
    durationDays: 7,
    totalSecondsTracked: 7 * 20 * 60, // 2h 20m
    startDate: goal3StartDate,
    completionDate: goal3EndDate,
    template: 'classic',
    issuedAt: goal3EndDate,
  };

  // Generate realistic historical sessions:
  // For Goal 1: Completed from day -12 through day -2. Day -1 missed 30m of task1A (so today has recovery!).
  // Today: Task 1A has 25m completed so far!
  const sessions: TimeSession[] = [];

  // Goal 3 sessions (all completed)
  for (let i = -20; i <= -14; i++) {
    const d = addDaysToDateString(today, i);
    sessions.push({
      id: `sess_g3_${i}`,
      taskId: task3A.id,
      goalId: goal3.id,
      userId: sampleUser.id,
      date: d,
      startTimestamp: new Date(d + 'T07:00:00Z').getTime(),
      endTimestamp: new Date(d + 'T07:20:00Z').getTime(),
      durationSeconds: 20 * 60,
      syncStatus: 'synced',
    });
  }

  // Goal 1 & 2 sessions for past days
  for (let i = -12; i <= -1; i++) {
    const d = addDaysToDateString(today, i);

    // Goal 1 Task 1A (60m req):
    // Day -1 (yesterday) user did only 30m, leaving a 30m shortfall for today's recovery!
    const task1Secs = (i === -1) ? 30 * 60 : 60 * 60;
    sessions.push({
      id: `sess_g1_a_${i}`,
      taskId: task1A.id,
      goalId: goal1.id,
      userId: sampleUser.id,
      date: d,
      startTimestamp: new Date(d + 'T10:00:00Z').getTime(),
      endTimestamp: new Date(d + 'T10:00:00Z').getTime() + task1Secs * 1000,
      durationSeconds: task1Secs,
      syncStatus: 'synced',
    });

    // Goal 1 Task 1B (30m req):
    sessions.push({
      id: `sess_g1_b_${i}`,
      taskId: task1B.id,
      goalId: goal1.id,
      userId: sampleUser.id,
      date: d,
      startTimestamp: new Date(d + 'T15:00:00Z').getTime(),
      endTimestamp: new Date(d + 'T15:30:00Z').getTime(),
      durationSeconds: 30 * 60,
      syncStatus: 'synced',
    });

    // Goal 2 Task 2A (if within start date)
    if (i >= -6) {
      sessions.push({
        id: `sess_g2_a_${i}`,
        taskId: task2A.id,
        goalId: goal2.id,
        userId: sampleUser.id,
        date: d,
        startTimestamp: new Date(d + 'T06:30:00Z').getTime(),
        endTimestamp: new Date(d + 'T07:15:00Z').getTime(),
        durationSeconds: 45 * 60,
        syncStatus: 'synced',
      });
    }
  }

  // Today's sessions so far:
  // Completed 30m on Task 1B (done!), and 25m on Task 1A
  sessions.push({
    id: `sess_today_1b`,
    taskId: task1B.id,
    goalId: goal1.id,
    userId: sampleUser.id,
    date: today,
    startTimestamp: new Date(today + 'T09:00:00Z').getTime(),
    endTimestamp: new Date(today + 'T09:30:00Z').getTime(),
    durationSeconds: 30 * 60,
    syncStatus: 'synced',
  });

  sessions.push({
    id: `sess_today_1a`,
    taskId: task1A.id,
    goalId: goal1.id,
    userId: sampleUser.id,
    date: today,
    startTimestamp: new Date(today + 'T11:00:00Z').getTime(),
    endTimestamp: new Date(today + 'T11:25:00Z').getTime(),
    durationSeconds: 25 * 60,
    syncStatus: 'synced',
  });

  return {
    user: sampleUser,
    registeredAccounts: seedRegisteredAccounts,
    goals: [goal1, goal2, goal3],
    tasks: [task1A, task1B, task2A, task3A],
    sessions,
    certificates: [sampleCertificate],
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
