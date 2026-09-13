import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
} from '../utils/storage';
import {
  getTodayDateString,
  generateRandomId,
  generateCertificateId,
  generateVerificationHash,
  addDaysToDateString,
} from '../utils/time';
import { calculateDayProgress, calculateStreaks } from '../utils/recovery';
import {
  notifyTimerSessionComplete,
  notifyTaskDeadlineReached,
  requestNotificationPermission,
  getNotificationPermission,
  sendTestNotification,
  NotificationPermissionStatus,
} from '../utils/notifications';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  firebaseSignOut,
  onAuthStateChanged,
  doc,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
  FirebaseUser,
} from '../firebase';

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
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isFirestoreConnected: boolean;
  isOnline: boolean;
  activeView: 'dashboard' | 'goals' | 'calendar' | 'time' | 'certificates' | 'analytics' | 'profile' | 'settings' | 'verify';
  setActiveView: (view: any) => void;
  targetVerifyId: string | null;
  setTargetVerifyId: (id: string | null) => void;
  
  // Auth & Accounts
  registeredAccounts: RegisteredUserAccount[];
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  login: (emailOrUsername: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  signup: (
    fullNameOrData: string | any,
    username?: string,
    email?: string,
    pass?: string
  ) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  switchAccount: (userId: string) => boolean;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  openAuthModal: (tab?: 'login' | 'register' | 'switch') => void;
  authModalTab: 'login' | 'register' | 'switch';
  setAuthModalTab: (tab: 'login' | 'register' | 'switch') => void;

  // Goals
  goals: Goal[];
  createGoal: (
    goalData: Omit<Goal, 'id' | 'createdAt' | 'userId'>,
    tasksData: Array<{ title: string; requiredDurationMinutes: number; description?: string; deadlineTime?: string }>
  ) => Promise<Goal>;
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
  fetchCertificateForVerification: (id: string) => Promise<Certificate | null>;
  celebratingGoal: Goal | null;
  setCelebratingGoal: (g: Goal | null) => void;

  // Sync
  syncQueue: SyncQueueItem[];
  isSyncing: boolean;
  syncNow: () => void;

  // Theme & Appearance
  theme: 'light' | 'dark' | 'system';
  isDark: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;

  // Sidebar Layout State
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

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
  const [activeView, setActiveView] = useState<
    'dashboard' | 'goals' | 'calendar' | 'time' | 'certificates' | 'analytics' | 'profile' | 'settings' | 'verify'
  >(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('verify') || params.get('cert')) {
        return 'verify';
      }
    }
    return 'dashboard';
  });
  const [targetVerifyId, setTargetVerifyId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('verify') || params.get('cert') || null;
    }
    return null;
  });
  const [celebratingGoal, setCelebratingGoal] = useState<Goal | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

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

  // Primary data state (cached in localStorage and synced real-time with Firestore)
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    return loadFromLocalStorage<'light' | 'dark' | 'system'>(STORAGE_KEYS.THEME_PREFERENCE, 'light');
  });
  const [isDark, setIsDark] = useState<boolean>(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return loadFromLocalStorage<boolean>(STORAGE_KEYS.SIDEBAR_COLLAPSED, false);
  });

  const [user, setUser] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

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

  // Test connection to Firestore on mount and network state changes
  useEffect(() => {
    let isMounted = true;
    const checkConn = async () => {
      const ok = await testFirestoreConnection();
      if (isMounted) {
        setIsFirestoreConnected(ok);
      }
    };

    const timer = setTimeout(checkConn, 300);

    const handleOnline = () => {
      setIsOnline(true);
      checkConn();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsFirestoreConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Firebase Auth State Observer & Firestore Real-Time Subscriptions
  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    let unsubGoals: (() => void) | null = null;
    let unsubTasks: (() => void) | null = null;
    let unsubSessions: (() => void) | null = null;
    let unsubCertificates: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);

      // Clean up previous listeners
      if (unsubUser) { unsubUser(); unsubUser = null; }
      if (unsubGoals) { unsubGoals(); unsubGoals = null; }
      if (unsubTasks) { unsubTasks(); unsubTasks = null; }
      if (unsubSessions) { unsubSessions(); unsubSessions = null; }
      if (unsubCertificates) { unsubCertificates(); unsubCertificates = null; }

      if (!fUser) {
        setUser(null);
        setGoals([]);
        setTasks([]);
        setSessions([]);
        setCertificates([]);
        setIsAuthLoading(false);
        return;
      }

      const uid = fUser.uid;
      const userDocRef = doc(db, 'users', uid);

      try {
        // 1. Subscribe to User Profile
        unsubUser = onSnapshot(userDocRef, async (docSnap) => {
          setIsFirestoreConnected(true);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setUser(data);
          } else {
            // Document does not exist yet (e.g. fresh Google Sign-in)
            const fallbackName = fUser.displayName || (fUser.email ? fUser.email.split('@')[0] : 'Member');
            const fallbackUsername = (fUser.email ? fUser.email.split('@')[0] : 'user')
              .toLowerCase()
              .replace(/[^a-z0-9_.-]/g, '');

            const initialProfile: UserProfile = {
              id: uid,
              fullName: fallbackName,
              username: fallbackUsername,
              email: fUser.email || '',
              bio: 'Committed to daily deliberate progress.',
              occupation: 'Productivity Practitioner',
              location: 'Global',
              avatarUrl: fUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
              avatarStorageType: fUser.photoURL ? 'url' : 'preset',
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
              preferredDailyWorkingHours: 4,
              preferredWorkStartTime: '09:00',
              preferredWorkEndTime: '18:00',
              workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
              primaryCategory: 'General',
              theme: 'light',
              accentColor: '#f59e0b',
              notificationsEnabled: true,
              soundEnabled: true,
              createdAt: getTodayDateString(),
              accountTier: 'Standard Member',
              lastLoginAt: new Date().toISOString(),
            };

            try {
              await setDoc(userDocRef, initialProfile);
              setUser(initialProfile);
            } catch (createErr) {
              handleFirestoreError(createErr, OperationType.CREATE, `users/${uid}`);
            }
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        });

        // 2. Subscribe to Goals
        const goalsQuery = query(collection(db, 'goals'), where('userId', '==', uid));
        unsubGoals = onSnapshot(goalsQuery, (snapshot) => {
          setIsFirestoreConnected(true);
          const loadedGoals: Goal[] = [];
          snapshot.forEach((d) => {
            loadedGoals.push(d.data() as Goal);
          });
          setGoals(loadedGoals);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'goals');
        });

        // 3. Subscribe to Tasks
        const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', uid));
        unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
          setIsFirestoreConnected(true);
          const loadedTasks: Task[] = [];
          snapshot.forEach((d) => {
            loadedTasks.push(d.data() as Task);
          });
          setTasks(loadedTasks);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'tasks');
        });

        // 4. Subscribe to Sessions
        const sessionsQuery = query(collection(db, 'sessions'), where('userId', '==', uid));
        unsubSessions = onSnapshot(sessionsQuery, (snapshot) => {
          setIsFirestoreConnected(true);
          const loadedSessions: TimeSession[] = [];
          snapshot.forEach((d) => {
            loadedSessions.push(d.data() as TimeSession);
          });
          setSessions(loadedSessions);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'sessions');
        });

        // 5. Subscribe to Certificates
        const certsQuery = query(collection(db, 'certificates'), where('userId', '==', uid));
        unsubCertificates = onSnapshot(certsQuery, (snapshot) => {
          setIsFirestoreConnected(true);
          const loadedCerts: Certificate[] = [];
          snapshot.forEach((d) => {
            loadedCerts.push(d.data() as Certificate);
          });
          setCertificates(loadedCerts);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'certificates');
        });

      } catch (err) {
        console.error('Firestore subscription error:', err);
      } finally {
        setIsAuthLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
      if (unsubGoals) unsubGoals();
      if (unsubTasks) unsubTasks();
      if (unsubSessions) unsubSessions();
      if (unsubCertificates) unsubCertificates();
    };
  }, []);

  // Keep todayDate updated with timezone
  useEffect(() => {
    const tz = user?.timeZone;
    const currentToday = getTodayDateString(tz);
    setTodayDate(currentToday);
    
    const interval = setInterval(() => {
      const nowToday = getTodayDateString(tz);
      setTodayDate(nowToday);
    }, 60000);
    return () => clearInterval(interval);
  }, [user?.timeZone]);

  // Online / offline listeners & automatic cloud sync
  const enqueueSyncItem = useCallback(
    (
      collectionName: 'users' | 'goals' | 'tasks' | 'sessions' | 'certificates',
      action: 'set' | 'update' | 'delete',
      docId: string,
      payload?: any
    ) => {
      const newItem: SyncQueueItem = {
        id: generateRandomId('sync'),
        collection: collectionName,
        action,
        docId,
        payload,
        createdAt: Date.now(),
      };
      setSyncQueue((prev) => {
        const filtered = prev.filter((item) => !(item.docId === docId && item.action === action));
        const updated = [...filtered, newItem];
        saveToLocalStorage(STORAGE_KEYS.SYNC_QUEUE, updated);
        return updated;
      });
      return newItem;
    },
    []
  );

  const removeSyncItems = useCallback((docIds: string[]) => {
    setSyncQueue((prev) => {
      const updated = prev.filter((item) => !docIds.includes(item.docId));
      saveToLocalStorage(STORAGE_KEYS.SYNC_QUEUE, updated);
      return updated;
    });
  }, []);

  // Sync engine: Flushes local offline drive changes to cloud automatically when online
  const syncNow = useCallback(async () => {
    if (!navigator.onLine || !auth.currentUser) {
      return;
    }

    const currentQueue = loadFromLocalStorage<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, syncQueue);
    const pendingSessions = sessions.filter((s) => s.syncStatus === 'pending' || s.isOffline);

    if (currentQueue.length === 0 && pendingSessions.length === 0) {
      return;
    }

    setIsSyncing(true);

    try {
      const failedQueue: SyncQueueItem[] = [];

      for (const item of currentQueue) {
        try {
          if (item.action === 'set' || item.action === 'update') {
            if (item.payload) {
              await setDoc(doc(db, item.collection, item.docId), item.payload, { merge: true });
            }
          } else if (item.action === 'delete') {
            await deleteDoc(doc(db, item.collection, item.docId));
          }
        } catch (err) {
          console.warn(`Sync queue deferred item ${item.docId}:`, err);
          failedQueue.push(item);
        }
      }

      // Sync any pending sessions recorded while offline
      for (const s of pendingSessions) {
        try {
          const syncedSess: TimeSession = { ...s, syncStatus: 'synced', isOffline: false };
          await setDoc(doc(db, 'sessions', s.id), syncedSess, { merge: true });
        } catch (err) {
          console.warn(`Session sync deferred for ${s.id}:`, err);
        }
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.syncStatus === 'pending' || s.isOffline
            ? { ...s, syncStatus: 'synced', isOffline: false }
            : s
        )
      );

      setSyncQueue(failedQueue);
      saveToLocalStorage(STORAGE_KEYS.SYNC_QUEUE, failedQueue);
    } catch (err) {
      console.warn('Auto-sync execution encountered an error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [syncQueue, sessions]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => {
        syncNow();
      }, 500);
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow]);

  useEffect(() => {
    if (isOnline && (syncQueue.length > 0 || sessions.some((s) => s.syncStatus === 'pending'))) {
      syncNow();
    }
  }, [isOnline, syncQueue.length, sessions, syncNow]);

  // Dark mode theme effect
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const applyTheme = (darkActive: boolean) => {
      setIsDark(darkActive);
      if (darkActive) {
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
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mql.matches);
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }
  }, [theme]);

  // Sync user profile theme if user updates or signs in
  useEffect(() => {
    if (user?.theme && user.theme !== theme) {
      setThemeState(user.theme);
      saveToLocalStorage(STORAGE_KEYS.THEME_PREFERENCE, user.theme);
    }
  }, [user?.theme]);

  const setTheme = useCallback(
    (newTheme: 'light' | 'dark' | 'system') => {
      setThemeState(newTheme);
      saveToLocalStorage(STORAGE_KEYS.THEME_PREFERENCE, newTheme);
      if (user) {
        setUser((prev) => (prev ? { ...prev, theme: newTheme } : null));
        enqueueSyncItem('users', 'update', user.id, { theme: newTheme });
        if (navigator.onLine && auth.currentUser) {
          updateDoc(doc(db, 'users', user.id), { theme: newTheme }).catch((err) =>
            console.warn('Update user theme queued:', err)
          );
        }
      }
    },
    [user, enqueueSyncItem]
  );

  const toggleTheme = useCallback(() => {
    const nextTheme: 'light' | 'dark' = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [isDark, setTheme]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      saveToLocalStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, next);
      return next;
    });
  }, []);

  const handleSetSidebarCollapsed = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    saveToLocalStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, collapsed);
  }, []);

  // Local storage persistence triggers
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
        if (user?.soundEnabled) {
          playCompletionChime();
        }
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

  // Periodic deadline monitor
  const notifiedDeadlinesRef = useRef<Set<string>>(new Set());

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

      const daySummary = calculateDayProgress(todayDate, goals, tasks, sessions, todayDate);

      daySummary.tasks.forEach((t) => {
        if (t.isCompleted) return;

        const taskObj = tasks.find((item) => item.id === t.taskId);
        if (!taskObj) return;

        const deadline = taskObj.deadlineTime || user?.preferredWorkEndTime;
        if (!deadline || !deadline.includes(':')) return;

        const [deadH, deadM] = deadline.split(':').map(Number);
        const deadTotalMin = deadH * 60 + deadM;

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
  const stopAndSaveTimer = useCallback(() => {
    if (!activeTimer) return;
    const elapsedSession = activeTimer.isRunning
      ? Math.floor((Date.now() - activeTimer.sessionStartTime) / 1000)
      : 0;

    if (elapsedSession > 0) {
      const sessionId = generateRandomId('sess');
      const currentUid = auth.currentUser?.uid || user?.id || 'anonymous';
      const isCurrentlyOnline = navigator.onLine && Boolean(auth.currentUser);

      const newSession: TimeSession = {
        id: sessionId,
        taskId: activeTimer.taskId,
        goalId: activeTimer.goalId,
        userId: currentUid,
        date: todayDate,
        startTimestamp: activeTimer.sessionStartTime,
        endTimestamp: Date.now(),
        durationSeconds: elapsedSession,
        isOffline: !isCurrentlyOnline,
        syncStatus: isCurrentlyOnline ? 'synced' : 'pending',
      };

      setSessions((prev) => [...prev, newSession]);

      if (isCurrentlyOnline && auth.currentUser) {
        setDoc(doc(db, 'sessions', sessionId), newSession).catch((err) => {
          console.warn('Direct cloud write failed, queued for auto-sync:', err);
          enqueueSyncItem('sessions', 'set', sessionId, newSession);
        });
      } else {
        enqueueSyncItem('sessions', 'set', sessionId, newSession);
      }
    }

    setActiveTimer(null);
  }, [activeTimer, user?.id, todayDate, enqueueSyncItem]);

  const startTimer = useCallback(
    (taskId: string, isDistractionFree = false) => {
      if (!auth.currentUser) {
        openAuthModal('login');
        return;
      }
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (activeTimer && activeTimer.taskId !== taskId) {
        stopAndSaveTimer();
      }

      const alreadyCompleted = sessions
        .filter((s) => s.taskId === taskId && s.date === todayDate)
        .reduce((acc, s) => acc + s.durationSeconds, 0);

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
    [tasks, activeTimer, sessions, todayDate, stopAndSaveTimer]
  );

  const pauseTimer = useCallback(() => {
    if (!activeTimer || !activeTimer.isRunning) return;
    const elapsedSession = Math.floor((Date.now() - activeTimer.sessionStartTime) / 1000);

    if (elapsedSession > 0) {
      const sessionId = generateRandomId('sess');
      const currentUid = auth.currentUser?.uid || user?.id || 'anonymous';
      const isCurrentlyOnline = navigator.onLine && Boolean(auth.currentUser);

      const newSession: TimeSession = {
        id: sessionId,
        taskId: activeTimer.taskId,
        goalId: activeTimer.goalId,
        userId: currentUid,
        date: todayDate,
        startTimestamp: activeTimer.sessionStartTime,
        endTimestamp: Date.now(),
        durationSeconds: elapsedSession,
        isOffline: !isCurrentlyOnline,
        syncStatus: isCurrentlyOnline ? 'synced' : 'pending',
      };

      setSessions((prev) => [...prev, newSession]);

      if (isCurrentlyOnline && auth.currentUser) {
        setDoc(doc(db, 'sessions', sessionId), newSession).catch((err) => {
          console.warn('Direct cloud write failed, queued for auto-sync:', err);
          enqueueSyncItem('sessions', 'set', sessionId, newSession);
        });
      } else {
        enqueueSyncItem('sessions', 'set', sessionId, newSession);
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
  }, [activeTimer, user?.id, todayDate, enqueueSyncItem]);

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

  const cancelTimer = useCallback(() => {
    setActiveTimer(null);
  }, []);

  const setDistractionFree = useCallback((df: boolean) => {
    setActiveTimer((prev) => (prev ? { ...prev, isDistractionFree: df } : null));
  }, []);

  // Goal & Task operations with real Firestore persistence and offline local drive queue
  const createGoal = useCallback(
    async (
      goalData: Omit<Goal, 'id' | 'createdAt' | 'userId'>,
      tasksData: Array<{
        title: string;
        requiredDurationMinutes: number;
        description?: string;
        deadlineTime?: string;
      }>
    ): Promise<Goal> => {
      if (!auth.currentUser) {
        openAuthModal('login');
        throw new Error('Please sign in or create an account to create goals.');
      }
      const currentUid = auth.currentUser.uid;
      const goalId = generateRandomId('goal');
      const newGoal: Goal = {
        ...goalData,
        id: goalId,
        userId: currentUid,
        createdAt: todayDate,
        status: 'active',
      };

      const newTasks: Task[] = tasksData.map((t) => ({
        id: generateRandomId('task'),
        goalId: goalId,
        userId: currentUid,
        title: t.title,
        description: t.description || '',
        requiredDurationMinutes: t.requiredDurationMinutes,
        deadlineTime: t.deadlineTime || undefined,
        frequency: 'daily',
        createdAt: todayDate,
      }));

      // Optimistic state updates (saved to local drive immediately)
      setGoals((prev) => [newGoal, ...prev]);
      setTasks((prev) => [...prev, ...newTasks]);

      // Always enqueue so changes are preserved in local storage even if offline
      enqueueSyncItem('goals', 'set', goalId, newGoal);
      for (const t of newTasks) {
        enqueueSyncItem('tasks', 'set', t.id, t);
      }

      // If online and authenticated, push to cloud and clear from queue on success
      if (navigator.onLine && auth.currentUser) {
        try {
          await setDoc(doc(db, 'goals', goalId), newGoal);
          for (const t of newTasks) {
            await setDoc(doc(db, 'tasks', t.id), t);
          }
          removeSyncItems([goalId, ...newTasks.map((t) => t.id)]);
        } catch (err) {
          console.warn('Cloud sync deferred for when connection restores:', err);
        }
      }

      return newGoal;
    },
    [user?.id, todayDate, enqueueSyncItem, removeSyncItems]
  );

  const updateGoal = useCallback(
    (id: string, updates: Partial<Goal>) => {
      if (!auth.currentUser) {
        openAuthModal('login');
        return;
      }
      setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
      enqueueSyncItem('goals', 'update', id, updates);

      if (navigator.onLine && auth.currentUser) {
        updateDoc(doc(db, 'goals', id), updates)
          .then(() => removeSyncItems([id]))
          .catch((err) => {
            console.warn('Update goal queued for online sync:', err);
          });
      }
    },
    [enqueueSyncItem, removeSyncItems, openAuthModal]
  );

  const pauseGoal = useCallback((id: string) => {
    if (!auth.currentUser) {
      openAuthModal('login');
      return;
    }
    if (activeTimer && activeTimer.goalId === id) {
      stopAndSaveTimer();
    }
    updateGoal(id, { status: 'paused' });
  }, [activeTimer, stopAndSaveTimer, updateGoal, openAuthModal]);

  const resumeGoal = useCallback((id: string) => {
    if (!auth.currentUser) {
      openAuthModal('login');
      return;
    }
    updateGoal(id, { status: 'active' });
  }, [updateGoal, openAuthModal]);

  const completeGoal = useCallback(
    (id: string): Certificate | null => {
      if (!auth.currentUser) {
        openAuthModal('login');
        return null;
      }
      const goal = goals.find((g) => g.id === id);
      if (!goal) return null;

      const certId = generateCertificateId();
      const goalSessions = sessions.filter((s) => s.goalId === id);
      const totalTrackedSeconds = goalSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

      const cert: Certificate = {
        id: certId,
        verificationCode: generateVerificationHash(certId, user?.fullName || 'Productivity User'),
        userId: auth.currentUser?.uid || user?.id || 'anonymous',
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

      enqueueSyncItem('certificates', 'set', certId, cert);

      if (navigator.onLine && auth.currentUser) {
        setDoc(doc(db, 'certificates', certId), cert)
          .then(() => removeSyncItems([certId]))
          .catch((err) => {
            console.warn('Certificate queued for online sync:', err);
          });
      }

      setCelebratingGoal(goal);
      return cert;
    },
    [goals, sessions, user, todayDate, updateGoal, enqueueSyncItem, removeSyncItems]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      if (!auth.currentUser) {
        openAuthModal('login');
        return;
      }
      if (activeTimer && activeTimer.goalId === id) {
        cancelTimer();
      }
      const relatedTasks = tasks.filter((t) => t.goalId === id);
      const relatedSessions = sessions.filter((s) => s.goalId === id);

      setGoals((prev) => prev.filter((g) => g.id !== id));
      setTasks((prev) => prev.filter((t) => t.goalId !== id));
      setSessions((prev) => prev.filter((s) => s.goalId !== id));

      enqueueSyncItem('goals', 'delete', id);
      relatedTasks.forEach((t) => enqueueSyncItem('tasks', 'delete', t.id));
      relatedSessions.forEach((s) => enqueueSyncItem('sessions', 'delete', s.id));

      if (navigator.onLine && auth.currentUser) {
        deleteDoc(doc(db, 'goals', id)).then(() => removeSyncItems([id])).catch(() => {});
        relatedTasks.forEach((t) => {
          deleteDoc(doc(db, 'tasks', t.id)).then(() => removeSyncItems([t.id])).catch(() => {});
        });
        relatedSessions.forEach((s) => {
          deleteDoc(doc(db, 'sessions', s.id)).then(() => removeSyncItems([s.id])).catch(() => {});
        });
      }
    },
    [activeTimer, cancelTimer, tasks, sessions, enqueueSyncItem, removeSyncItems, openAuthModal]
  );

  const createTask = useCallback(
    (data: Omit<Task, 'id' | 'createdAt' | 'userId'>): Task => {
      if (!auth.currentUser) {
        openAuthModal('login');
        throw new Error('Please sign in or create an account to add tasks.');
      }
      const currentUid = auth.currentUser.uid;
      const newTask: Task = {
        ...data,
        id: generateRandomId('task'),
        userId: currentUid,
        createdAt: todayDate,
      };
      setTasks((prev) => [...prev, newTask]);
      enqueueSyncItem('tasks', 'set', newTask.id, newTask);

      if (navigator.onLine && auth.currentUser) {
        setDoc(doc(db, 'tasks', newTask.id), newTask)
          .then(() => removeSyncItems([newTask.id]))
          .catch((err) => {
            console.warn('Create task cloud write deferred:', err);
          });
      }

      return newTask;
    },
    [todayDate, enqueueSyncItem, removeSyncItems, openAuthModal]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      if (!auth.currentUser) {
        openAuthModal('login');
        return;
      }
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      enqueueSyncItem('tasks', 'update', id, updates);

      if (navigator.onLine && auth.currentUser) {
        updateDoc(doc(db, 'tasks', id), updates)
          .then(() => removeSyncItems([id]))
          .catch((err) => {
            console.warn('Update task queued for online sync:', err);
          });
      }
    },
    [enqueueSyncItem, removeSyncItems, openAuthModal]
  );

  const deleteTask = useCallback(
    (id: string) => {
      if (!auth.currentUser) {
        openAuthModal('login');
        return;
      }
      if (activeTimer && activeTimer.taskId === id) {
        cancelTimer();
      }
      const relatedSessions = sessions.filter((s) => s.taskId === id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setSessions((prev) => prev.filter((s) => s.taskId !== id));

      enqueueSyncItem('tasks', 'delete', id);
      relatedSessions.forEach((s) => enqueueSyncItem('sessions', 'delete', s.id));

      if (navigator.onLine && auth.currentUser) {
        deleteDoc(doc(db, 'tasks', id)).then(() => removeSyncItems([id])).catch(() => {});
        relatedSessions.forEach((s) => {
          deleteDoc(doc(db, 'sessions', s.id)).then(() => removeSyncItems([s.id])).catch(() => {});
        });
      }
    },
    [activeTimer, cancelTimer, sessions, enqueueSyncItem, removeSyncItems, openAuthModal]
  );

  // Certificates
  const issueCertificate = useCallback(
    (goalId: string, template: Certificate['template'] = 'classic'): Certificate | null => {
      if (!auth.currentUser) {
        openAuthModal('login');
        return null;
      }
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return null;

      const certId = generateCertificateId();
      const goalSessions = sessions.filter((s) => s.goalId === goalId);
      const totalTrackedSeconds = goalSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

      const cert: Certificate = {
        id: certId,
        verificationCode: generateVerificationHash(certId, user?.fullName || 'Productivity User'),
        userId: auth.currentUser?.uid || user?.id || 'anonymous',
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
      enqueueSyncItem('certificates', 'set', certId, cert);

      if (navigator.onLine && auth.currentUser) {
        setDoc(doc(db, 'certificates', certId), cert)
          .then(() => removeSyncItems([certId]))
          .catch((err) => {
            console.warn('Certificate cloud sync deferred:', err);
          });
      }

      return cert;
    },
    [goals, sessions, user, todayDate, updateGoal, enqueueSyncItem, removeSyncItems]
  );

  const getCertificateById = useCallback(
    (id: string): Certificate | undefined => {
      return certificates.find((c) => c.id.toLowerCase() === id.toLowerCase());
    },
    [certificates]
  );

  const fetchCertificateForVerification = useCallback(
    async (id: string): Promise<Certificate | null> => {
      const trimmed = id.trim();
      const local = certificates.find((c) => c.id.toLowerCase() === trimmed.toLowerCase());
      if (local) return local;

      try {
        const docSnap = await getDoc(doc(db, 'certificates', trimmed));
        if (docSnap.exists()) {
          return docSnap.data() as Certificate;
        }
      } catch (err) {
        console.warn('Could not fetch certificate from Firestore:', err);
      }
      return null;
    },
    [certificates]
  );

  // Real Firebase Authentication Operations
  const loginWithGoogle = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    try {
      await signInWithPopup(auth, googleProvider);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      return {
        success: false,
        message: err?.message || 'Google sign-in failed. Please try again.',
      };
    }
  }, []);

  const login = useCallback(
    async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
      const trimmed = email.trim();
      if (!trimmed) {
        return { success: false, message: 'Please enter your email address.' };
      }
      if (!pass) {
        return { success: false, message: 'Please enter your password.' };
      }

      try {
        await signInWithEmailAndPassword(auth, trimmed, pass);
        setIsAuthModalOpen(false);
        return { success: true };
      } catch (err: any) {
        let msg = err?.message || 'Login failed.';
        if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
          msg = 'Invalid credentials. Please verify your email and password.';
        } else if (err?.code === 'auth/wrong-password') {
          msg = 'Incorrect password.';
        } else if (err?.code === 'auth/invalid-email') {
          msg = 'Please enter a valid email address.';
        } else if (err?.code === 'auth/too-many-requests') {
          msg = 'Too many failed attempts. Please try again later or reset password.';
        }
        return { success: false, message: msg };
      }
    },
    []
  );

  const signup = useCallback(
    async (
      fullNameOrData: string | any,
      username?: string,
      email?: string,
      pass?: string
    ): Promise<{ success: boolean; message?: string }> => {
      let data: any = {};
      if (typeof fullNameOrData === 'object' && fullNameOrData !== null) {
        data = fullNameOrData;
      } else {
        data = {
          fullName: fullNameOrData,
          username: username || '',
          email: email || '',
          password: pass || '',
        };
      }

      const cleanFullName = (data.fullName || '').trim();
      const cleanEmail = (data.email || '').trim().toLowerCase();
      const cleanUsername = (data.username || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
      const password = data.password;

      if (!cleanFullName) {
        return { success: false, message: 'Full Name is required.' };
      }
      if (!cleanUsername) {
        return { success: false, message: 'A unique username is required.' };
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, message: 'A valid email address is required.' };
      }
      if (!password || password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters.' };
      }

      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const uid = cred.user.uid;

        const newProfile: UserProfile = {
          id: uid,
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

        await setDoc(doc(db, 'users', uid), newProfile);
        setUser(newProfile);
        setIsAuthModalOpen(false);
        return { success: true };
      } catch (err: any) {
        let msg = err?.message || 'Registration failed.';
        if (err?.code === 'auth/email-already-in-use') {
          msg = 'An account with this email address already exists. Please sign in.';
        } else if (err?.code === 'auth/weak-password') {
          msg = 'Password is too weak. Please use at least 6 characters.';
        } else if (err?.code === 'auth/invalid-email') {
          msg = 'Please enter a valid email address.';
        }
        return { success: false, message: msg };
      }
    },
    [todayDate]
  );

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; message?: string }> => {
    const trimmed = email.trim();
    if (!trimmed) {
      return { success: false, message: 'Please enter your email address.' };
    }
    try {
      await sendPasswordResetEmail(auth, trimmed);
      return { success: true, message: `Password reset link sent to ${trimmed}.` };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to send password reset email.' };
    }
  }, []);

  const switchAccount = useCallback((_userId: string): boolean => {
    openAuthModal('login');
    return false;
  }, [openAuthModal]);

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setUser(null);
    setGoals([]);
    setTasks([]);
    setSessions([]);
    setCertificates([]);
    setActiveTimer(null);
    setAuthModalTab('login');
    setIsAuthModalOpen(false);
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!auth.currentUser) {
        openAuthModal('login');
        return;
      }
      setUser((prev) => (prev ? { ...prev, ...data } : null));

      if (data.theme) {
        setThemeState(data.theme);
        saveToLocalStorage(STORAGE_KEYS.THEME_PREFERENCE, data.theme);
      }

      if (user) {
        enqueueSyncItem('users', 'update', user.id, data);

        if (navigator.onLine && auth.currentUser) {
          try {
            await updateDoc(doc(db, 'users', user.id), data);
            removeSyncItems([user.id]);
          } catch (err) {
            console.warn('Update user profile queued for online sync:', err);
          }
        }
      }
    },
    [user, enqueueSyncItem, removeSyncItems, openAuthModal]
  );

  const deleteAccount = useCallback(async () => {
    if (!auth.currentUser) {
      openAuthModal('login');
      return;
    }
    const uid = auth.currentUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e) {
      console.warn('Could not delete user document:', e);
    }
    try {
      await auth.currentUser.delete();
    } catch (e) {
      console.warn('Could not delete Firebase Auth user:', e);
    }

    setUser(null);
    setGoals([]);
    setTasks([]);
    setSessions([]);
    setCertificates([]);
    setActiveTimer(null);
    localStorage.clear();
    setIsAuthModalOpen(false);
  }, [openAuthModal]);

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

    const weekStart = addDaysToDateString(todayDate, -6);
    const weekSessions = sessions.filter((s) => s.date >= weekStart && s.date <= todayDate);
    const weekSeconds = weekSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    const monthStart = addDaysToDateString(todayDate, -29);
    const monthSessions = sessions.filter((s) => s.date >= monthStart && s.date <= todayDate);
    const monthSeconds = monthSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    const allTimeSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    const uniqueDays = new Set(sessions.map((s) => s.date)).size;
    const averageDailySeconds = uniqueDays > 0 ? Math.round(allTimeSeconds / uniqueDays) : 0;

    const completedGoalsCount = goals.filter((g) => g.status === 'completed').length;
    const activeGoalsCount = goals.filter((g) => g.status === 'active').length;

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

  const registeredAccounts: RegisteredUserAccount[] = useMemo(() => {
    if (!user) return [];
    return [{ profile: user, passwordHash: '' }];
  }, [user]);

  const isAuthenticated = Boolean(firebaseUser && user);

  return (
    <AppContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated,
        isAuthLoading,
        isFirestoreConnected,
        isOnline,
        activeView,
        setActiveView,
        targetVerifyId,
        setTargetVerifyId,
        registeredAccounts,
        loginWithGoogle,
        login,
        signup,
        resetPassword,
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
        fetchCertificateForVerification,
        celebratingGoal,
        setCelebratingGoal,
        syncQueue,
        isSyncing,
        syncNow,
        theme,
        isDark,
        setTheme,
        toggleTheme,
        isSidebarCollapsed,
        setIsSidebarCollapsed: handleSetSidebarCollapsed,
        toggleSidebar,
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
