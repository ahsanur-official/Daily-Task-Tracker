import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserProfile,
  RegisteredUserAccount,
  Goal,
  Task,
  TimeSession,
  ActiveTimerState,
  DayProgressSummary,
  StreakInfo,
  Certificate,
  SyncQueueItem,
  AnalyticsSummary,
} from '../types';
import {
  STORAGE_KEYS,
  loadFromLocalStorage,
  saveToLocalStorage,
  getInitialSeedData,
} from '../utils/storage';
import {
  getTodayDateString,
  generateRandomId,
  generateCertificateId,
  generateVerificationHash,
  addDaysToDateString,
} from '../utils/time';
import { calculateDayProgress, calculateStreaks, evaluateGoalProgress } from '../utils/recovery';
import {
  notifyTimerSessionComplete,
  notifyTaskDeadlineReached,
  requestNotificationPermission,
  getNotificationPermission,
  sendTestNotification,
  NotificationPermissionStatus,
} from '../utils/notifications';

// Audio chime generator using Web Audio API for timer completion
function playCompletionChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    // Smooth pleasant chord (C5 - E5 - G5 - C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.85);
    });
  } catch {
    // AudioContext blocked or not supported
  }
}

interface AppContextType {
  user: UserProfile | null;
  isOnline: boolean;
  activeView: 'dashboard' | 'goals' | 'calendar' | 'time' | 'certificates' | 'analytics' | 'profile' | 'settings' | 'verify';
  setActiveView: (view: any) => void;
  targetVerifyId: string | null;
  setTargetVerifyId: (id: string | null) => void;
  
  // Auth & Accounts
  registeredAccounts: RegisteredUserAccount[];
  login: (emailOrUsername: string, pass: string) => { success: boolean; message?: string };
  signup: (
    fullNameOrData: string | any,
    username?: string,
    email?: string,
    pass?: string
  ) => { success: boolean; message?: string };
  switchAccount: (userId: string) => boolean;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  deleteAccount: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  openAuthModal: (tab?: 'login' | 'register' | 'switch') => void;
  authModalTab: 'login' | 'register' | 'switch';
  setAuthModalTab: (tab: 'login' | 'register' | 'switch') => void;

  // Goals
  goals: Goal[];
  createGoal: (
    goalData: Omit<Goal, 'id' | 'createdAt' | 'userId'>,
    tasksData: Array<{ title: string; requiredDurationMinutes: number; description?: string }>
  ) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  pauseGoal: (id: string) => void;
  resumeGoal: (id: string) => void;
  completeGoal: (id: string) => Certificate | null;
  deleteGoal: (id: string) => void;

  // Tasks
  tasks: Task[];
  createTask: (data: Omit<Task, 'id' | 'createdAt' | 'userId'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Time & Timer
  sessions: TimeSession[];
  activeTimer: ActiveTimerState | null;
  startTimer: (taskId: string, isDistractionFree?: boolean) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopAndSaveTimer: () => void;
  cancelTimer: () => void;
  setDistractionFree: (df: boolean) => void;
  getTaskCurrentSecondsToday: (taskId: string) => number;

  // Progress & Streaks
  todayDate: string;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  todayProgress: DayProgressSummary;
  selectedDayProgress: DayProgressSummary;
  streakInfo: StreakInfo;
  analytics: AnalyticsSummary;

  // Certificates
  certificates: Certificate[];
  issueCertificate: (goalId: string, template?: Certificate['template']) => Certificate | null;
  getCertificateById: (id: string) => Certificate | undefined;
  celebratingGoal: Goal | null;
  setCelebratingGoal: (g: Goal | null) => void;

  // Sync
  syncQueue: SyncQueueItem[];
  isSyncing: boolean;
  syncNow: () => void;

  // Notifications
  notificationPermission: NotificationPermissionStatus;
  requestNotificationAccess: () => Promise<NotificationPermissionStatus>;
  sendTestNotificationAlert: () => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [todayDate, setTodayDate] = useState<string>(() => getTodayDateString());
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [activeView, setActiveView] = useState<'dashboard' | 'goals' | 'calendar' | 'time' | 'certificates' | 'analytics' | 'profile' | 'settings' | 'verify'>('dashboard');
  const [targetVerifyId, setTargetVerifyId] = useState<string | null>(null);
  const [celebratingGoal, setCelebratingGoal] = useState<Goal | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionStatus>(() =>
    getNotificationPermission()
  );

  const requestNotificationAccess = useCallback(async () => {
    const result = await requestNotificationPermission();
    setNotificationPermission(result);
    return result;
  }, []);

  const sendTestNotificationAlert = useCallback(() => {
    return sendTestNotification();
  }, []);

  // Load or seed initial data
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = loadFromLocalStorage<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null);
    if (saved) return saved;
    const seed = getInitialSeedData(getTodayDateString());
    saveToLocalStorage(STORAGE_KEYS.USER_PROFILE, seed.user);
    return seed.user;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = loadFromLocalStorage<Goal[] | null>(STORAGE_KEYS.GOALS, null);
    if (saved) return saved;
    const seed = getInitialSeedData(getTodayDateString());
    saveToLocalStorage(STORAGE_KEYS.GOALS, seed.goals);
    return seed.goals;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = loadFromLocalStorage<Task[] | null>(STORAGE_KEYS.TASKS, null);
    if (saved) return saved;
    const seed = getInitialSeedData(getTodayDateString());
    saveToLocalStorage(STORAGE_KEYS.TASKS, seed.tasks);
    return seed.tasks;
  });

  const [sessions, setSessions] = useState<TimeSession[]>(() => {
    const saved = loadFromLocalStorage<TimeSession[] | null>(STORAGE_KEYS.SESSIONS, null);
    if (saved) return saved;
    const seed = getInitialSeedData(getTodayDateString());
    saveToLocalStorage(STORAGE_KEYS.SESSIONS, seed.sessions);
    return seed.sessions;
  });

  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    const saved = loadFromLocalStorage<Certificate[] | null>(STORAGE_KEYS.CERTIFICATES, null);
    if (saved) return saved;
    const seed = getInitialSeedData(getTodayDateString());
    saveToLocalStorage(STORAGE_KEYS.CERTIFICATES, seed.certificates);
    return seed.certificates;
  });

  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(() => {
    return loadFromLocalStorage<ActiveTimerState | null>(STORAGE_KEYS.ACTIVE_TIMER, null);
  });

  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    return loadFromLocalStorage<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
  });

  // Auth & Multi-Account States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'switch'>('login');

  const openAuthModal = useCallback((tab: 'login' | 'register' | 'switch' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredUserAccount[]>(() => {
    const saved = loadFromLocalStorage<RegisteredUserAccount[] | null>(STORAGE_KEYS.REGISTERED_USERS, null);
    if (saved && saved.length > 0) return saved;
    const seed = getInitialSeedData(getTodayDateString());
    if (seed.registeredAccounts && seed.registeredAccounts.length > 0) {
      saveToLocalStorage(STORAGE_KEYS.REGISTERED_USERS, seed.registeredAccounts);
      return seed.registeredAccounts;
    }
    return [];
  });

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.REGISTERED_USERS, registeredAccounts);
  }, [registeredAccounts]);

  // Keep todayDate updated with timezone
  useEffect(() => {
    const tz = user?.timeZone;
    const currentToday = getTodayDateString(tz);
    setTodayDate(currentToday);
    
    // Interval to refresh date string at midnight
    const interval = setInterval(() => {
      const nowToday = getTodayDateString(tz);
      setTodayDate(nowToday);
    }, 60000);
    return () => clearInterval(interval);
  }, [user?.timeZone]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync effect when coming online
  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      syncNow();
    }
  }, [isOnline, syncQueue.length]);

  // Dark mode theme effect
  useEffect(() => {
    const theme = user?.theme || 'light';
    const root = document.documentElement;
    const body = document.body;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
        body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
      }
    };

    if (theme === 'dark') {
      applyTheme(true);
    } else if (theme === 'light') {
      applyTheme(false);
    } else {
      // system
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mql.matches);
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }
  }, [user?.theme]);

  // Persistence triggers
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.USER_PROFILE, user);
  }, [user]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.GOALS, goals);
  }, [goals]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.TASKS, tasks);
  }, [tasks]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.SESSIONS, sessions);
  }, [sessions]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.CERTIFICATES, certificates);
  }, [certificates]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.ACTIVE_TIMER, activeTimer);
  }, [activeTimer]);

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.SYNC_QUEUE, syncQueue);
  }, [syncQueue]);

  // High precision timer tick & auto-stop calculation
  useEffect(() => {
    if (!activeTimer || !activeTimer.isRunning) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - activeTimer.sessionStartTime) / 1000);
      const totalNow = activeTimer.accumulatedSecondsBeforeSession + elapsed;

      // Check if target completed
      if (activeTimer.targetSeconds > 0 && totalNow >= activeTimer.targetSeconds) {
        // Auto-stop and save!
        if (user?.soundEnabled) {
          playCompletionChime();
        }
        // Native browser & in-app notification when timer completes
        if (user?.notificationsEnabled !== false && user?.timerNotificationsEnabled !== false) {
          const taskObj = tasks.find((t) => t.id === activeTimer.taskId);
          notifyTimerSessionComplete(
            taskObj?.title || 'Focus Task',
            Math.round(activeTimer.targetSeconds / 60)
          );
        }
        stopAndSaveTimer();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [activeTimer, user?.soundEnabled, user?.notificationsEnabled, user?.timerNotificationsEnabled, tasks]);

  // Periodic deadline monitor: triggers notification when an uncompleted task reaches its deadline
  const notifiedDeadlinesRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkDeadlines = () => {
      if (user?.notificationsEnabled === false) return;
      if (user?.deadlineNotificationsEnabled === false) return;

      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const [curH, curM] = currentTimeStr.split(':').map(Number);
      const curTotalMin = curH * 60 + curM;

      // Compute today's tasks
      const daySummary = calculateDayProgress(todayDate, goals, tasks, sessions, todayDate);

      daySummary.tasks.forEach((t) => {
        if (t.isCompleted) return;

        const taskObj = tasks.find((item) => item.id === t.taskId);
        if (!taskObj) return;

        // Use custom task deadline or fallback to user preferred work end time
        const deadline = taskObj.deadlineTime || user?.preferredWorkEndTime;
        if (!deadline || !deadline.includes(':')) return;

        const [deadH, deadM] = deadline.split(':').map(Number);
        const deadTotalMin = deadH * 60 + deadM;

        // Alert if current time is within [deadTotalMin, deadTotalMin + 45]
        if (curTotalMin >= deadTotalMin && curTotalMin <= deadTotalMin + 45) {
          const notificationKey = `${t.taskId}_${todayDate}_${deadline}`;
          if (!notifiedDeadlinesRef.current.has(notificationKey)) {
            notifiedDeadlinesRef.current.add(notificationKey);
            notifyTaskDeadlineReached(taskObj.title, deadline, taskObj.id);
          }
        }
      });
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 15000);
    return () => clearInterval(interval);
  }, [
    goals,
    tasks,
    sessions,
    todayDate,
    user?.notificationsEnabled,
    user?.deadlineNotificationsEnabled,
    user?.preferredWorkEndTime,
  ]);

  // Helper to compute seconds already recorded today for a task
  const getTaskCurrentSecondsToday = useCallback(
    (taskId: string): number => {
      const todaySessions = sessions.filter((s) => s.taskId === taskId && s.date === todayDate);
      const pastSeconds = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);

      if (activeTimer && activeTimer.taskId === taskId) {
        if (activeTimer.isRunning) {
          const currentSessionElapsed = Math.floor((Date.now() - activeTimer.sessionStartTime) / 1000);
          return pastSeconds + Math.max(0, currentSessionElapsed);
        }
      }
      return pastSeconds;
    },
    [sessions, todayDate, activeTimer]
  );

  // Timer actions
  const startTimer = useCallback(
    (taskId: string, isDistractionFree = false) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // If another timer is running, save it first
      if (activeTimer && activeTimer.taskId !== taskId) {
        stopAndSaveTimer();
      }

      // Calculate already completed seconds today
      const alreadyCompleted = sessions
        .filter((s) => s.taskId === taskId && s.date === todayDate)
        .reduce((acc, s) => acc + s.durationSeconds, 0);

      // Target seconds
      const targetSeconds = task.requiredDurationMinutes * 60;

      const newTimer: ActiveTimerState = {
        taskId,
        goalId: task.goalId,
        sessionStartTime: Date.now(),
        accumulatedSecondsBeforeSession: alreadyCompleted,
        targetSeconds,
        isRunning: true,
        isDistractionFree,
      };

      setActiveTimer(newTimer);
    },
    [tasks, activeTimer, sessions, todayDate]
  );

  const pauseTimer = useCallback(() => {
    if (!activeTimer || !activeTimer.isRunning) return;
    const elapsedSession = Math.floor((Date.now() - activeTimer.sessionStartTime) / 1000);

    if (elapsedSession > 0) {
      // Save completed slice to sessions
      const newSession: TimeSession = {
        id: generateRandomId('sess'),
        taskId: activeTimer.taskId,
        goalId: activeTimer.goalId,
        userId: user?.id || 'guest',
        date: todayDate,
        startTimestamp: activeTimer.sessionStartTime,
        endTimestamp: Date.now(),
        durationSeconds: elapsedSession,
        isOffline: !isOnline,
        syncStatus: isOnline ? 'synced' : 'pending',
      };

      setSessions((prev) => [...prev, newSession]);

      if (!isOnline) {
        setSyncQueue((prev) => [
          ...prev,
          {
            id: generateRandomId('sync'),
            type: 'time_session',
            payload: newSession,
            createdAt: Date.now(),
          },
        ]);
      }
    }

    setActiveTimer((prev) =>
      prev
        ? {
            ...prev,
            isRunning: false,
            accumulatedSecondsBeforeSession: prev.accumulatedSecondsBeforeSession + Math.max(0, elapsedSession),
          }
        : null
    );
  }, [activeTimer, user?.id, todayDate, isOnline]);

  const resumeTimer = useCallback(() => {
    if (!activeTimer || activeTimer.isRunning) return;
    setActiveTimer((prev) =>
      prev
        ? {
            ...prev,
            sessionStartTime: Date.now(),
            isRunning: true,
          }
        : null
    );
  }, [activeTimer]);

  const stopAndSaveTimer = useCallback(() => {
    if (!activeTimer) return;
    const elapsedSession = activeTimer.isRunning
      ? Math.floor((Date.now() - activeTimer.sessionStartTime) / 1000)
      : 0;

    if (elapsedSession > 0) {
      const newSession: TimeSession = {
        id: generateRandomId('sess'),
        taskId: activeTimer.taskId,
        goalId: activeTimer.goalId,
        userId: user?.id || 'guest',
        date: todayDate,
        startTimestamp: activeTimer.sessionStartTime,
        endTimestamp: Date.now(),
        durationSeconds: elapsedSession,
        isOffline: !isOnline,
        syncStatus: isOnline ? 'synced' : 'pending',
      };

      setSessions((prev) => [...prev, newSession]);

      if (!isOnline) {
        setSyncQueue((prev) => [
          ...prev,
          {
            id: generateRandomId('sync'),
            type: 'time_session',
            payload: newSession,
            createdAt: Date.now(),
          },
        ]);
      }
    }

    setActiveTimer(null);
  }, [activeTimer, user?.id, todayDate, isOnline]);

  const cancelTimer = useCallback(() => {
    setActiveTimer(null);
  }, []);

  const setDistractionFree = useCallback((df: boolean) => {
    setActiveTimer((prev) => (prev ? { ...prev, isDistractionFree: df } : null));
  }, []);

  // Goal & Task operations
  const createGoal = useCallback(
    (
      goalData: Omit<Goal, 'id' | 'createdAt' | 'userId'>,
      tasksData: Array<{
        title: string;
        requiredDurationMinutes: number;
        description?: string;
        deadlineTime?: string;
      }>
    ): Goal => {
      const goalId = generateRandomId('goal');
      const newGoal: Goal = {
        ...goalData,
        id: goalId,
        userId: user?.id || 'guest',
        createdAt: todayDate,
        status: 'active',
      };

      const newTasks: Task[] = tasksData.map((t) => ({
        id: generateRandomId('task'),
        goalId: goalId,
        userId: user?.id || 'guest',
        title: t.title,
        description: t.description || '',
        requiredDurationMinutes: t.requiredDurationMinutes,
        deadlineTime: t.deadlineTime || undefined,
        frequency: 'daily',
        createdAt: todayDate,
      }));

      setGoals((prev) => [newGoal, ...prev]);
      setTasks((prev) => [...prev, ...newTasks]);

      return newGoal;
    },
    [user?.id, todayDate]
  );

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  }, []);

  const pauseGoal = useCallback((id: string) => {
    // If timer is on a task in this goal, stop it
    if (activeTimer && activeTimer.goalId === id) {
      stopAndSaveTimer();
    }
    updateGoal(id, { status: 'paused' });
  }, [activeTimer, stopAndSaveTimer, updateGoal]);

  const resumeGoal = useCallback((id: string) => {
    updateGoal(id, { status: 'active' });
  }, [updateGoal]);

  const completeGoal = useCallback(
    (id: string): Certificate | null => {
      const goal = goals.find((g) => g.id === id);
      if (!goal) return null;

      const certId = generateCertificateId();
      const goalSessions = sessions.filter((s) => s.goalId === id);
      const totalTrackedSeconds = goalSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

      const cert: Certificate = {
        id: certId,
        verificationCode: generateVerificationHash(certId, user?.fullName || 'Productivity User'),
        userId: user?.id || 'guest',
        userName: user?.fullName || 'Productivity User',
        userAvatar: user?.avatarUrl,
        goalId: goal.id,
        goalName: goal.title,
        durationDays: goal.durationDays,
        totalSecondsTracked: totalTrackedSeconds,
        startDate: goal.startDate,
        completionDate: todayDate,
        template: 'classic',
        issuedAt: new Date().toISOString(),
      };

      setCertificates((prev) => [cert, ...prev]);
      updateGoal(id, {
        status: 'completed',
        completedAt: todayDate,
        certificateId: certId,
      });

      setCelebratingGoal(goal);
      return cert;
    },
    [goals, sessions, user, todayDate, updateGoal]
  );

  const deleteGoal = useCallback((id: string) => {
    if (activeTimer && activeTimer.goalId === id) {
      cancelTimer();
    }
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setTasks((prev) => prev.filter((t) => t.goalId !== id));
    setSessions((prev) => prev.filter((s) => s.goalId !== id));
  }, [activeTimer, cancelTimer]);

  const createTask = useCallback(
    (data: Omit<Task, 'id' | 'createdAt' | 'userId'>): Task => {
      const newTask: Task = {
        ...data,
        id: generateRandomId('task'),
        userId: user?.id || 'guest',
        createdAt: todayDate,
      };
      setTasks((prev) => [...prev, newTask]);
      return newTask;
    },
    [user?.id, todayDate]
  );

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const deleteTask = useCallback((id: string) => {
    if (activeTimer && activeTimer.taskId === id) {
      cancelTimer();
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSessions((prev) => prev.filter((s) => s.taskId !== id));
  }, [activeTimer, cancelTimer]);

  // Certificates
  const issueCertificate = useCallback(
    (goalId: string, template: Certificate['template'] = 'classic'): Certificate | null => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return null;

      const certId = generateCertificateId();
      const goalSessions = sessions.filter((s) => s.goalId === goalId);
      const totalTrackedSeconds = goalSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

      const cert: Certificate = {
        id: certId,
        verificationCode: generateVerificationHash(certId, user?.fullName || 'Productivity User'),
        userId: user?.id || 'guest',
        userName: user?.fullName || 'Productivity User',
        userAvatar: user?.avatarUrl,
        goalId: goal.id,
        goalName: goal.title,
        durationDays: goal.durationDays,
        totalSecondsTracked: totalTrackedSeconds,
        startDate: goal.startDate,
        completionDate: todayDate,
        template,
        issuedAt: new Date().toISOString(),
      };

      setCertificates((prev) => [cert, ...prev]);
      updateGoal(goalId, { certificateId: certId, status: 'completed', completedAt: todayDate });
      return cert;
    },
    [goals, sessions, user, todayDate, updateGoal]
  );

  const getCertificateById = useCallback(
    (id: string): Certificate | undefined => {
      return certificates.find((c) => c.id.toLowerCase() === id.toLowerCase());
    },
    [certificates]
  );

  // Sync queue runner
  const syncNow = useCallback(() => {
    if (syncQueue.length === 0) return;
    setIsSyncing(true);

    // Simulate backend sync with latency
    setTimeout(() => {
      setSessions((prev) =>
        prev.map((s) => (s.syncStatus === 'pending' ? { ...s, syncStatus: 'synced' } : s))
      );
      setSyncQueue([]);
      setIsSyncing(false);
    }, 600);
  }, [syncQueue]);

  // Auth & Multi-Account operations
  const login = useCallback(
    (emailOrUsername: string, pass: string): { success: boolean; message?: string } => {
      const term = emailOrUsername.trim().toLowerCase();
      if (!term) {
        return { success: false, message: 'Please enter your email or username.' };
      }

      // Look up account in registered accounts
      const found = registeredAccounts.find(
        (acc) =>
          acc.profile.email.toLowerCase() === term ||
          acc.profile.username.toLowerCase() === term
      );

      if (found) {
        if (pass && found.passwordHash && found.passwordHash !== pass) {
          return { success: false, message: 'Invalid password. Please verify and try again.' };
        }
        const updatedProfile: UserProfile = {
          ...found.profile,
          lastLoginAt: new Date().toISOString(),
        };
        setUser(updatedProfile);
        setRegisteredAccounts((prev) =>
          prev.map((acc) => (acc.profile.id === found.profile.id ? { ...acc, profile: updatedProfile } : acc))
        );
        setIsAuthModalOpen(false);
        return { success: true };
      }

      return {
        success: false,
        message: 'No registered account found matching that email or username. Please create an account or select a demo user.',
      };
    },
    [registeredAccounts]
  );

  const signup = useCallback(
    (
      fullNameOrData: string | any,
      username?: string,
      email?: string,
      pass?: string
    ): { success: boolean; message?: string } => {
      let data: any = {};
      if (typeof fullNameOrData === 'object' && fullNameOrData !== null) {
        data = fullNameOrData;
      } else {
        data = {
          fullName: fullNameOrData,
          username: username || '',
          email: email || '',
          password: pass || 'password123',
        };
      }

      const cleanFullName = (data.fullName || '').trim();
      const cleanEmail = (data.email || '').trim().toLowerCase();
      const cleanUsername = (data.username || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');

      if (!cleanFullName) {
        return { success: false, message: 'Full Name is required.' };
      }
      if (!cleanUsername) {
        return { success: false, message: 'A unique username is required.' };
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, message: 'A valid email address is required.' };
      }

      // Check if email or username already taken
      const alreadyTaken = registeredAccounts.some(
        (acc) =>
          acc.profile.email.toLowerCase() === cleanEmail ||
          acc.profile.username.toLowerCase() === cleanUsername
      );

      if (alreadyTaken) {
        return { success: false, message: 'An account with this email or username already exists. Please sign in.' };
      }

      const newId = generateRandomId('user');
      const newProfile: UserProfile = {
        id: newId,
        fullName: cleanFullName,
        username: cleanUsername,
        email: cleanEmail,
        phone: data.phone?.trim() || undefined,
        bio: data.bio?.trim() || 'Discipline over motivation. Committed to daily deliberate progress.',
        occupation: data.occupation?.trim() || 'Productivity Practitioner',
        companyOrSchool: data.companyOrSchool?.trim() || undefined,
        location: data.location?.trim() || 'Global',
        website: data.website?.trim() || undefined,
        github: data.github?.trim() || undefined,
        linkedin: data.linkedin?.trim() || undefined,
        twitter: data.twitter?.trim() || undefined,
        avatarUrl:
          data.avatarUrl ||
          `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80`,
        avatarStorageType: data.avatarStorageType || 'preset',
        timeZone: data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        preferredDailyWorkingHours: Number(data.preferredDailyWorkingHours) || 4,
        preferredWorkStartTime: data.preferredWorkStartTime || '09:00',
        preferredWorkEndTime: data.preferredWorkEndTime || '18:00',
        workingDays: data.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        primaryCategory: data.primaryCategory || 'General',
        theme: 'light',
        accentColor: '#f59e0b',
        notificationsEnabled: true,
        soundEnabled: true,
        createdAt: todayDate,
        accountTier: 'Standard Member',
        lastLoginAt: new Date().toISOString(),
      };

      const newAccount: RegisteredUserAccount = {
        profile: newProfile,
        passwordHash: data.password || 'password123',
      };

      setRegisteredAccounts((prev) => [newAccount, ...prev]);
      setUser(newProfile);
      setIsAuthModalOpen(false);
      return { success: true };
    },
    [registeredAccounts, todayDate]
  );

  const switchAccount = useCallback(
    (userId: string): boolean => {
      const found = registeredAccounts.find((acc) => acc.profile.id === userId);
      if (found) {
        const updatedProfile = {
          ...found.profile,
          lastLoginAt: new Date().toISOString(),
        };
        setUser(updatedProfile);
        setRegisteredAccounts((prev) =>
          prev.map((acc) => (acc.profile.id === userId ? { ...acc, profile: updatedProfile } : acc))
        );
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    },
    [registeredAccounts]
  );

  const logout = useCallback(() => {
    setUser(null);
    setAuthModalTab('login');
    setIsAuthModalOpen(true);
  }, []);

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      setRegisteredAccounts((accounts) =>
        accounts.map((acc) => (acc.profile.id === prev.id ? { ...acc, profile: updated } : acc))
      );
      return updated;
    });
  }, []);

  const deleteAccount = useCallback(() => {
    setUser(null);
    setGoals([]);
    setTasks([]);
    setSessions([]);
    setCertificates([]);
    setActiveTimer(null);
    localStorage.clear();
  }, []);

  // Compute Day Progress & Streaks
  const todayProgress = useMemo(() => {
    return calculateDayProgress(todayDate, goals, tasks, sessions, todayDate);
  }, [todayDate, goals, tasks, sessions]);

  const selectedDayProgress = useMemo(() => {
    return calculateDayProgress(selectedDate, goals, tasks, sessions, todayDate);
  }, [selectedDate, goals, tasks, sessions, todayDate]);

  const streakInfo = useMemo(() => {
    return calculateStreaks(goals, tasks, sessions, todayDate);
  }, [goals, tasks, sessions, todayDate]);

  // Analytics
  const analytics = useMemo<AnalyticsSummary>(() => {
    const todaySessions = sessions.filter((s) => s.date === todayDate);
    const todaySeconds = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    // Week seconds (last 7 days)
    const weekStart = addDaysToDateString(todayDate, -6);
    const weekSessions = sessions.filter((s) => s.date >= weekStart && s.date <= todayDate);
    const weekSeconds = weekSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    // Month seconds (last 30 days)
    const monthStart = addDaysToDateString(todayDate, -29);
    const monthSessions = sessions.filter((s) => s.date >= monthStart && s.date <= todayDate);
    const monthSeconds = monthSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    const allTimeSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    // Unique days tracked
    const uniqueDays = new Set(sessions.map((s) => s.date)).size;
    const averageDailySeconds = uniqueDays > 0 ? Math.round(allTimeSeconds / uniqueDays) : 0;

    const completedGoalsCount = goals.filter((g) => g.status === 'completed').length;
    const activeGoalsCount = goals.filter((g) => g.status === 'active').length;

    // Day of week breakdown
    const dayTotals: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    sessions.forEach((s) => {
      const [y, m, d] = s.date.split('-').map(Number);
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      dayTotals[dow] += s.durationSeconds;
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let maxDayIdx = 1;
    let maxVal = 0;
    Object.entries(dayTotals).forEach(([dowStr, total]) => {
      if (total > maxVal) {
        maxVal = total;
        maxDayIdx = Number(dowStr);
      }
    });

    const overallCompletionRate = todayProgress.totalRequiredSeconds > 0
      ? Math.min(100, Math.round((todayProgress.completedSeconds / todayProgress.totalRequiredSeconds) * 100))
      : 100;

    return {
      todaySeconds,
      weekSeconds,
      monthSeconds,
      allTimeSeconds,
      completedGoalsCount,
      activeGoalsCount,
      completedTasksTotal: sessions.length,
      averageDailySeconds,
      overallCompletionRate,
      mostProductiveDayOfWeek: dayNames[maxDayIdx],
    };
  }, [sessions, todayDate, goals, todayProgress]);

  return (
    <AppContext.Provider
      value={{
        user,
        isOnline,
        activeView,
        setActiveView,
        targetVerifyId,
        setTargetVerifyId,
        registeredAccounts,
        login,
        signup,
        switchAccount,
        logout,
        updateProfile,
        deleteAccount,
        isAuthModalOpen,
        setIsAuthModalOpen,
        openAuthModal,
        authModalTab,
        setAuthModalTab,
        goals,
        createGoal,
        updateGoal,
        pauseGoal,
        resumeGoal,
        completeGoal,
        deleteGoal,
        tasks,
        createTask,
        updateTask,
        deleteTask,
        sessions,
        activeTimer,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopAndSaveTimer,
        cancelTimer,
        setDistractionFree,
        getTaskCurrentSecondsToday,
        todayDate,
        selectedDate,
        setSelectedDate,
        todayProgress,
        selectedDayProgress,
        streakInfo,
        analytics,
        certificates,
        issueCertificate,
        getCertificateById,
        celebratingGoal,
        setCelebratingGoal,
        syncQueue,
        isSyncing,
        syncNow,
        notificationPermission,
        requestNotificationAccess,
        sendTestNotificationAlert,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
