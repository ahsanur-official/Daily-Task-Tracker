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
import { calculateDayProgress, calculateStreaks, evaluateGoalProgress } from '../utils/recovery';
import {
  notifyTimerSessionComplete,
  notifyTaskDeadlineReached,
  requestNotificationPermission,
  getNotificationPermission,
  sendTestNotification,
  NotificationPermissionStatus,
} from '../utils/notifications';
import {
  googleSheetsService,
  GoogleSheetsSyncStatus,
} from '../services/googleSheets';
import {
  generateInitialsAvatar,
  isDefaultStockPhoto,
} from '../utils/imageUpload';
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
import {
  playTimerStartSound,
  playTimerPauseSound,
  playTimerResumeSound,
  playCompletionChime,
  playSuccessChime,
} from '../utils/audio';
import { triggerStreakCelebration } from '../components/common/StreakCelebration';

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
  startGuestSession: () => void;

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
  logManualSession: (
    taskId: string,
    durationMinutes: number,
    date?: string,
    notes?: string
  ) => Promise<TimeSession>;
  completeTaskToday: (taskId: string) => Promise<boolean>;
  triggerStreakCelebrationNotification: (streak?: number, taskTitle?: string) => void;
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

  // Google Sheets Cloud Backup
  sheetsStatus: GoogleSheetsSyncStatus;
  connectAndSyncGoogleSheets: () => Promise<void>;
  disconnectGoogleSheets: () => void;
  pullUserProfileFromGoogleSheets: () => Promise<{ success: boolean; message: string }>;

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

  const [user, setUser] = useState<UserProfile | null>(() => {
    return loadFromLocalStorage<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null);
  });
  const [goals, setGoals] = useState<Goal[]>(() => {
    return loadFromLocalStorage<Goal[]>(STORAGE_KEYS.GOALS, []);
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    return loadFromLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  });
  const [sessions, setSessions] = useState<TimeSession[]>(() => {
    return loadFromLocalStorage<TimeSession[]>(STORAGE_KEYS.SESSIONS, []);
  });
  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    return loadFromLocalStorage<Certificate[]>(STORAGE_KEYS.CERTIFICATES, []);
  });

  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(() => {
    return loadFromLocalStorage<ActiveTimerState | null>(STORAGE_KEYS.ACTIVE_TIMER, null);
  });

  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    return loadFromLocalStorage<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
  });

  // Google Sheets integration state
  const [sheetsStatus, setSheetsStatus] = useState<GoogleSheetsSyncStatus>(() => {
    const id = googleSheetsService.getStoredSpreadsheetId();
    const lastSync = googleSheetsService.getStoredLastSync();
    const hasToken = googleSheetsService.hasToken();
    return {
      connected: Boolean(id || hasToken),
      spreadsheetId: id,
      spreadsheetUrl: id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null,
      lastSynced: lastSync,
      isSyncing: false,
      error: null,
    };
  });

  // Local storage persistence effects for offline continuity
  useEffect(() => {
    if (user) {
      saveToLocalStorage(STORAGE_KEYS.USER_PROFILE, user);
    }
  }, [user]);

  useEffect(() => {
    if (user || auth.currentUser) {
      saveToLocalStorage(STORAGE_KEYS.GOALS, goals);
    }
  }, [goals, user]);

  useEffect(() => {
    if (user || auth.currentUser) {
      saveToLocalStorage(STORAGE_KEYS.TASKS, tasks);
    }
  }, [tasks, user]);

  useEffect(() => {
    if (user || auth.currentUser) {
      saveToLocalStorage(STORAGE_KEYS.SESSIONS, sessions);
    }
  }, [sessions, user]);

  useEffect(() => {
    if (user || auth.currentUser) {
      saveToLocalStorage(STORAGE_KEYS.CERTIFICATES, certificates);
    }
  }, [certificates, user]);

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
      window.dispatchEvent(
        new CustomEvent('app-notification-event', {
          detail: {
            title: 'Back Online',
            body: 'Internet connection detected. Auto-syncing pending offline data...',
            type: 'system',
          },
        })
      );
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsFirestoreConnected(false);
      window.dispatchEvent(
        new CustomEvent('app-notification-event', {
          detail: {
            title: 'Offline Mode Active',
            body: 'You are offline. All tasks, goals, and timers are being saved safely to your device.',
            type: 'system',
          },
        })
      );
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
        // Check if device is offline or if a local cached user exists to avoid wiping offline data
        const cachedUser = loadFromLocalStorage<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null);
        if (!navigator.onLine && cachedUser) {
          setUser(cachedUser);
          setIsAuthLoading(false);
          return;
        }

        setUser(null);
        setGoals([]);
        setTasks([]);
        setSessions([]);
        setCertificates([]);
        localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
        localStorage.removeItem(STORAGE_KEYS.GOALS);
        localStorage.removeItem(STORAGE_KEYS.TASKS);
        localStorage.removeItem(STORAGE_KEYS.SESSIONS);
        localStorage.removeItem(STORAGE_KEYS.CERTIFICATES);
        localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_TIMER);
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
            // If user has the generic default stock photo, replace with personalized initials avatar
            if (isDefaultStockPhoto(data.avatarUrl) && data.avatarStorageType !== 'uploaded_device') {
              data.avatarUrl = generateInitialsAvatar(data.fullName || data.username);
            }
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
              bio: 'Daily deliberate progress and disciplined goal tracking.',
              occupation: '',
              location: '',
              avatarUrl: fUser.photoURL || generateInitialsAvatar(fallbackName),
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
              if (fallbackUsername && fUser.email) {
                try {
                  await setDoc(doc(db, 'usernames', fallbackUsername), {
                    email: fUser.email.toLowerCase(),
                    uid,
                    createdAt: new Date().toISOString(),
                  });
                } catch {
                  // Non-fatal fallback
                }
              }
            } catch (createErr) {
              console.warn('Initial profile doc creation notice:', createErr);
              setUser(initialProfile);
            }
          }
        }, (err) => {
          console.warn('User profile snapshot warning:', err);
          setIsFirestoreConnected(false);
        });

        // 2. Subscribe to Goals (Merge keeping offline pending items)
        const goalsQuery = query(collection(db, 'goals'), where('userId', '==', uid));
        unsubGoals = onSnapshot(goalsQuery, (snapshot) => {
          setIsFirestoreConnected(true);
          const loadedGoals: Goal[] = [];
          snapshot.forEach((d) => {
            loadedGoals.push(d.data() as Goal);
          });
          setGoals((prev) => {
            const serverIds = new Set(loadedGoals.map((g) => g.id));
            const pendingLocal = prev.filter((g) => !serverIds.has(g.id));
            return [...loadedGoals, ...pendingLocal];
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'goals');
        });

        // 3. Subscribe to Tasks (Merge keeping offline pending items)
        const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', uid));
        unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
          setIsFirestoreConnected(true);
          const loadedTasks: Task[] = [];
          snapshot.forEach((d) => {
            loadedTasks.push(d.data() as Task);
          });
          setTasks((prev) => {
            const serverIds = new Set(loadedTasks.map((t) => t.id));
            const pendingLocal = prev.filter((t) => !serverIds.has(t.id));
            return [...loadedTasks, ...pendingLocal];
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'tasks');
        });

        // 4. Subscribe to Sessions (Merge keeping offline pending items)
        const sessionsQuery = query(collection(db, 'sessions'), where('userId', '==', uid));
        unsubSessions = onSnapshot(sessionsQuery, (snapshot) => {
          setIsFirestoreConnected(true);
          const loadedSessions: TimeSession[] = [];
          snapshot.forEach((d) => {
            loadedSessions.push(d.data() as TimeSession);
          });
          setSessions((prev) => {
            const serverIds = new Set(loadedSessions.map((s) => s.id));
            const pendingLocal = prev.filter((s) => !serverIds.has(s.id));
            return [...loadedSessions, ...pendingLocal];
          });
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'sessions');
        });

        // 5. Subscribe to Certificates (Merge keeping offline pending items)
        const certsQuery = query(collection(db, 'certificates'), where('userId', '==', uid));
        unsubCertificates = onSnapshot(certsQuery, (snapshot) => {
          setIsFirestoreConnected(true);
          const loadedCerts: Certificate[] = [];
          snapshot.forEach((d) => {
            loadedCerts.push(d.data() as Certificate);
          });
          setCertificates((prev) => {
            const serverIds = new Set(loadedCerts.map((c) => c.id));
            const pendingLocal = prev.filter((c) => !serverIds.has(c.id));
            return [...loadedCerts, ...pendingLocal];
          });
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

      const totalSynced = (currentQueue.length - failedQueue.length) + pendingSessions.length;
      if (totalSynced > 0) {
        window.dispatchEvent(
          new CustomEvent('app-notification-event', {
            detail: {
              title: 'Cloud Synchronization Complete',
              body: `Successfully updated ${totalSynced} offline item${totalSynced > 1 ? 's' : ''} to your cloud database.`,
              type: 'system',
            },
          })
        );
      }
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

      setSessions((prev) => {
        const nextSessions = [...prev, newSession];
        const prevStreaks = calculateStreaks(goals, tasks, prev, todayDate);
        if (!prevStreaks.isStreakMaintainedToday) {
          const nextStreaks = calculateStreaks(goals, tasks, nextSessions, todayDate);
          if (nextStreaks.isStreakMaintainedToday) {
            const taskObj = tasks.find((t) => t.id === activeTimer.taskId);
            triggerStreakCelebration(nextStreaks.currentStreak, taskObj?.title);
          }
        }
        return nextSessions;
      });

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
  }, [activeTimer, user?.id, todayDate, enqueueSyncItem, goals, tasks]);

  const startTimer = useCallback(
    (taskId: string, isDistractionFree = false) => {
      const currentUid = auth.currentUser?.uid || user?.id;
      if (!currentUid) {
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
      if (user?.soundEnabled !== false) {
        playTimerStartSound();
      }
    },
    [tasks, activeTimer, sessions, todayDate, stopAndSaveTimer, user?.soundEnabled]
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

    if (user?.soundEnabled !== false) {
      playTimerPauseSound();
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
  }, [activeTimer, user?.id, user?.soundEnabled, todayDate, enqueueSyncItem]);

  const resumeTimer = useCallback(() => {
    if (!activeTimer || activeTimer.isRunning) return;
    if (user?.soundEnabled !== false) {
      playTimerResumeSound();
    }
    setActiveTimer((prev) =>
      prev
        ? {
            ...prev,
            sessionStartTime: Date.now(),
            isRunning: true,
          }
        : null
    );
  }, [activeTimer, user?.soundEnabled]);

  const logManualSession = useCallback(
    async (
      taskId: string,
      durationMinutes: number,
      sessionDate?: string,
      notes?: string
    ): Promise<TimeSession> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const currentUid = auth.currentUser?.uid || user?.id || 'guest_user';
      const durationSeconds = Math.max(60, Math.round(durationMinutes * 60));
      const targetDate = sessionDate || todayDate;
      const sessionId = generateRandomId('sess');
      const isCurrentlyOnline = navigator.onLine && Boolean(auth.currentUser);

      const now = Date.now();
      const newSession: TimeSession = {
        id: sessionId,
        taskId: task.id,
        goalId: task.goalId,
        userId: currentUid,
        date: targetDate,
        startTimestamp: now - durationSeconds * 1000,
        endTimestamp: now,
        durationSeconds,
        notes: notes || 'Manual offline session',
        isOffline: !isCurrentlyOnline,
        syncStatus: isCurrentlyOnline ? 'synced' : 'pending',
      };

      setSessions((prev) => {
        const nextSessions = [...prev, newSession];
        if (targetDate === todayDate) {
          const prevStreaks = calculateStreaks(goals, tasks, prev, todayDate);
          if (!prevStreaks.isStreakMaintainedToday) {
            const nextStreaks = calculateStreaks(goals, tasks, nextSessions, todayDate);
            if (nextStreaks.isStreakMaintainedToday) {
              triggerStreakCelebration(nextStreaks.currentStreak, task.title);
            }
          }
        }
        return nextSessions;
      });

      if (user?.soundEnabled !== false) {
        playSuccessChime();
      }

      if (isCurrentlyOnline && auth.currentUser) {
        setDoc(doc(db, 'sessions', sessionId), newSession).catch((err) => {
          console.warn('Direct cloud write failed for manual session, queued for auto-sync:', err);
          enqueueSyncItem('sessions', 'set', sessionId, newSession);
        });
      } else {
        enqueueSyncItem('sessions', 'set', sessionId, newSession);
      }

      return newSession;
    },
    [tasks, user?.id, user?.soundEnabled, todayDate, enqueueSyncItem, goals]
  );

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
      const currentUid = auth.currentUser?.uid || user?.id;
      if (!currentUid) {
        openAuthModal('login');
        throw new Error('Please sign in or create an account to create goals.');
      }
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
    [user?.id, todayDate, enqueueSyncItem, removeSyncItems, openAuthModal]
  );

  const updateGoal = useCallback(
    (id: string, updates: Partial<Goal>) => {
      const currentUid = auth.currentUser?.uid || user?.id;
      if (!currentUid) {
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
    [user?.id, enqueueSyncItem, removeSyncItems, openAuthModal]
  );

  const pauseGoal = useCallback((id: string) => {
    const currentUid = auth.currentUser?.uid || user?.id;
    if (!currentUid) {
      openAuthModal('login');
      return;
    }
    if (activeTimer && activeTimer.goalId === id) {
      stopAndSaveTimer();
    }
    updateGoal(id, { status: 'paused' });
  }, [user?.id, activeTimer, stopAndSaveTimer, updateGoal, openAuthModal]);

  const resumeGoal = useCallback((id: string) => {
    const currentUid = auth.currentUser?.uid || user?.id;
    if (!currentUid) {
      openAuthModal('login');
      return;
    }
    updateGoal(id, { status: 'active' });
  }, [user?.id, updateGoal, openAuthModal]);

  const completeGoal = useCallback(
    (id: string): Certificate | null => {
      const currentUid = auth.currentUser?.uid || user?.id;
      if (!currentUid) {
        openAuthModal('login');
        return null;
      }
      const goal = goals.find((g) => g.id === id);
      if (!goal) return null;

      // Verification guard: Ensure goal is 100% completed before certificate can be generated
      const progress = evaluateGoalProgress(goal, tasks, sessions);
      if (!progress.isFulfilled && progress.percentage < 100) {
        alert(
          `Cannot generate certificate: Course/Goal is incomplete! You have completed ${progress.fulfilledDaysCount} of ${goal.durationDays} days (${progress.percentage}%). You must complete 100% of all required daily tasks to receive your official certificate.`
        );
        return null;
      }

      const certId = generateCertificateId();
      const goalSessions = sessions.filter((s) => s.goalId === id);
      const totalTrackedSeconds = goalSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

      const cert: Certificate = {
        id: certId,
        verificationCode: generateVerificationHash(certId, user?.fullName || 'Productivity User'),
        userId: currentUid,
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
    [goals, tasks, sessions, user, todayDate, updateGoal, enqueueSyncItem, removeSyncItems, openAuthModal]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      const currentUid = auth.currentUser?.uid || user?.id;
      if (!currentUid) {
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
    [user?.id, activeTimer, cancelTimer, tasks, sessions, enqueueSyncItem, removeSyncItems, openAuthModal]
  );

  const createTask = useCallback(
    (data: Omit<Task, 'id' | 'createdAt' | 'userId'>): Task => {
      const currentUid = auth.currentUser?.uid || user?.id;
      if (!currentUid) {
        openAuthModal('login');
        throw new Error('Please sign in or create an account to add tasks.');
      }
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
    [user?.id, todayDate, enqueueSyncItem, removeSyncItems, openAuthModal]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      const currentUid = auth.currentUser?.uid || user?.id;
      if (!currentUid) {
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
    [user?.id, enqueueSyncItem, removeSyncItems, openAuthModal]
  );

  const deleteTask = useCallback(
    (id: string) => {
      const currentUid = auth.currentUser?.uid || user?.id;
      if (!currentUid) {
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
    [user?.id, activeTimer, cancelTimer, sessions, enqueueSyncItem, removeSyncItems, openAuthModal]
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
      let msg = err?.message || 'Google sign-in failed. Please try again.';
      if (err?.code === 'auth/popup-blocked') {
        msg = 'Browser blocked the Google popup window. Please allow popups for this site, or sign in using your email and password.';
      } else if (err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/popup-closed-by-user') {
        msg = 'Google sign-in was cancelled.';
      } else if (err?.code === 'auth/network-request-failed') {
        msg = 'Network error during Google sign-in. Please check your internet connection.';
      }
      return {
        success: false,
        message: msg,
      };
    }
  }, []);

  const login = useCallback(
    async (identifier: string, pass: string): Promise<{ success: boolean; message?: string }> => {
      const trimmed = (identifier || '').trim();
      if (!trimmed) {
        return { success: false, message: 'Please enter your email address or username.' };
      }
      if (!pass) {
        return { success: false, message: 'Please enter your password.' };
      }

      let emailToUse = trimmed;
      // If the identifier is a username without '@', look up their registered email from Firestore
      if (!trimmed.includes('@')) {
        const cleanUser = trimmed.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
        try {
          const usernameDoc = await getDoc(doc(db, 'usernames', cleanUser));
          if (usernameDoc.exists() && usernameDoc.data()?.email) {
            emailToUse = usernameDoc.data().email;
          } else {
            return {
              success: false,
              message: `No account found with username "${trimmed}". Please use your registered email address.`,
            };
          }
        } catch (lookupErr) {
          console.warn('Username resolution error:', lookupErr);
          return {
            success: false,
            message: `Could not verify username "${trimmed}". Please enter your full email address.`,
          };
        }
      }

      try {
        await signInWithEmailAndPassword(auth, emailToUse.toLowerCase(), pass);
        setIsAuthModalOpen(false);
        return { success: true };
      } catch (err: any) {
        console.error('Firebase Auth sign-in error:', err);
        let msg = err?.message || 'Login failed.';
        if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
          msg = 'Invalid credentials. Please verify your email/username and password.';
        } else if (err?.code === 'auth/wrong-password') {
          msg = 'Incorrect password. Please try again or use "Forgot password".';
        } else if (err?.code === 'auth/invalid-email') {
          msg = 'Please enter a valid email address.';
        } else if (err?.code === 'auth/too-many-requests') {
          msg = 'Too many failed login attempts. Please wait a few minutes or reset your password.';
        } else if (err?.code === 'auth/network-request-failed') {
          msg = 'Network connection problem. Please verify your internet connection.';
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

        // Build object without any undefined fields to comply strictly with Firestore requirements
        const newProfile: Record<string, any> = {
          id: uid,
          fullName: cleanFullName,
          username: cleanUsername,
          email: cleanEmail,
          bio: data.bio?.trim() || 'Committed to daily deliberate progress.',
          occupation: data.occupation?.trim() || '',
          location: data.location?.trim() || '',
          avatarUrl:
            data.avatarUrl && !isDefaultStockPhoto(data.avatarUrl)
              ? data.avatarUrl
              : generateInitialsAvatar(cleanFullName),
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

        if (data.phone?.trim()) newProfile.phone = data.phone.trim();
        if (data.companyOrSchool?.trim()) newProfile.companyOrSchool = data.companyOrSchool.trim();
        if (data.website?.trim()) newProfile.website = data.website.trim();
        if (data.github?.trim()) newProfile.github = data.github.trim();
        if (data.linkedin?.trim()) newProfile.linkedin = data.linkedin.trim();
        if (data.twitter?.trim()) newProfile.twitter = data.twitter.trim();

        await setDoc(doc(db, 'users', uid), newProfile);

        // Also save public username mapping for quick login
        try {
          await setDoc(doc(db, 'usernames', cleanUsername), {
            email: cleanEmail,
            uid: uid,
            createdAt: new Date().toISOString(),
          });
        } catch (uErr) {
          console.warn('Could not register public username mapping:', uErr);
        }

        setUser(newProfile as UserProfile);
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

  const startGuestSession = useCallback(() => {
    const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
    const guestProfile: UserProfile = {
      id: guestId,
      fullName: 'Guest Explorer',
      username: 'guest_explorer',
      email: 'guest@device.local',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      avatarStorageType: 'preset',
      bio: 'Exploring Daily Task Tracker in local guest mode.',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
      preferredDailyWorkingHours: 3,
      preferredWorkStartTime: '09:00',
      preferredWorkEndTime: '18:00',
      theme: theme || 'light',
      accentColor: '#f59e0b',
      notificationsEnabled: true,
      timerNotificationsEnabled: true,
      deadlineNotificationsEnabled: true,
      soundEnabled: true,
      createdAt: todayDate,
      accountTier: 'Standard Member',
      isGuest: true,
    };

    setUser(guestProfile);
    setIsAuthModalOpen(false);

    // If no goals exist yet, seed a Starter Practice Routine
    if (goals.length === 0) {
      const starterGoalId = generateRandomId('goal');
      const targetEnd = new Date();
      targetEnd.setDate(targetEnd.getDate() + 7);
      const endDateStr = targetEnd.toISOString().split('T')[0];

      const starterGoal: Goal = {
        id: starterGoalId,
        userId: guestId,
        title: 'Deep Work & Daily Mastery',
        description: 'A starter routine to build focus discipline and continuous habit momentum.',
        category: 'Learning & Language',
        color: '#f59e0b',
        colorLabel: 'Work',
        iconName: 'Zap',
        durationOption: '7_days',
        durationDays: 7,
        startDate: todayDate,
        endDate: endDateStr,
        status: 'active',
        createdAt: todayDate,
        motivationalQuote: 'Discipline is choosing between what you want now and what you want most.',
      };

      const starterTasks: Task[] = [
        {
          id: generateRandomId('task'),
          goalId: starterGoalId,
          userId: guestId,
          title: 'Deep Work Sprint (No Notifications)',
          description: 'Single-tasking block with all social tabs closed.',
          requiredDurationMinutes: 45,
          preferredTime: '10:00',
          deadlineTime: '14:00',
          frequency: 'daily',
          createdAt: todayDate,
        },
        {
          id: generateRandomId('task'),
          goalId: starterGoalId,
          userId: guestId,
          title: 'Deliberate Reading & Concept Notes',
          description: 'Read 15-20 pages of non-fiction or documentation.',
          requiredDurationMinutes: 25,
          preferredTime: '15:30',
          deadlineTime: '19:00',
          frequency: 'daily',
          createdAt: todayDate,
        },
        {
          id: generateRandomId('task'),
          goalId: starterGoalId,
          userId: guestId,
          title: 'Daily Review & Next-Day Planning',
          description: 'Review what went well, log offline work, and set top 3 priorities for tomorrow.',
          requiredDurationMinutes: 10,
          preferredTime: '20:00',
          deadlineTime: '22:00',
          frequency: 'daily',
          createdAt: todayDate,
        },
      ];

      setGoals([starterGoal]);
      setTasks(starterTasks);
    }
  }, [goals.length, theme, todayDate]);

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

  const todayProgress = useMemo(() => {
    return calculateDayProgress(todayDate, goals, tasks, sessions, todayDate);
  }, [todayDate, goals, tasks, sessions]);

  const selectedDayProgress = useMemo(() => {
    return calculateDayProgress(selectedDate, goals, tasks, sessions, todayDate);
  }, [selectedDate, goals, tasks, sessions, todayDate]);

  const streakInfo = useMemo(() => {
    return calculateStreaks(goals, tasks, sessions, todayDate);
  }, [goals, tasks, sessions, todayDate]);

  const completeTaskToday = useCallback(
    async (taskId: string): Promise<boolean> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return false;

      const tp = todayProgress.tasks.find((t) => t.taskId === taskId);
      const remainingSeconds = tp && tp.remainingSeconds > 0
        ? tp.remainingSeconds
        : task.requiredDurationMinutes * 60;

      const durationMinutes = Math.max(1, Math.ceil(remainingSeconds / 60));
      await logManualSession(
        taskId,
        durationMinutes,
        todayDate,
        'Quick marked task as complete'
      );
      return true;
    },
    [tasks, todayProgress, logManualSession, todayDate]
  );

  const triggerStreakCelebrationNotification = useCallback(
    (streak?: number, taskTitle?: string) => {
      triggerStreakCelebration(streak ?? (streakInfo.currentStreak || 1), taskTitle);
    },
    [streakInfo.currentStreak]
  );

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!auth.currentUser) {
        openAuthModal('login');
        return;
      }
      const uid = auth.currentUser.uid;

      // Sanitize data: remove any undefined values so Firestore never rejects
      const cleanData: Record<string, any> = {};
      for (const [key, val] of Object.entries(data)) {
        if (val !== undefined) {
          cleanData[key] = val;
        }
      }

      // 1. Immediately update React state and LocalStorage for zero-lag instant UI
      setUser((prev) => {
        const base = prev || ({
          id: uid,
          fullName: auth.currentUser?.displayName || 'Member',
          username: auth.currentUser?.email?.split('@')[0] || 'user',
          email: auth.currentUser?.email || '',
          createdAt: getTodayDateString(),
        } as UserProfile);
        const updated = { ...base, ...cleanData };
        saveToLocalStorage(STORAGE_KEYS.USER_PROFILE, updated);
        return updated;
      });

      if (cleanData.theme) {
        setThemeState(cleanData.theme);
        saveToLocalStorage(STORAGE_KEYS.THEME_PREFERENCE, cleanData.theme);
      }

      // If avatar was uploaded from device, also save to dedicated device avatar key
      if (cleanData.avatarUrl && cleanData.avatarStorageType === 'uploaded_device') {
        saveToLocalStorage('daily_task_tracker_device_avatar', cleanData.avatarUrl);
      }

      // 2. Queue for offline sync
      enqueueSyncItem('users', 'update', uid, cleanData);

      // 3. Persist to Firestore cloud database
      if (navigator.onLine && auth.currentUser) {
        try {
          const userDocRef = doc(db, 'users', uid);
          await setDoc(userDocRef, cleanData, { merge: true });
          removeSyncItems([uid]);
        } catch (err) {
          console.warn('Update user profile queued for online sync:', err);
        }
      }

      // 4. If username changed, update public usernames registry
      if (cleanData.username) {
        try {
          await setDoc(
            doc(db, 'usernames', cleanData.username.toLowerCase()),
            {
              email: (auth.currentUser.email || cleanData.email || '').toLowerCase(),
              uid,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (uErr) {
          console.warn('Could not register username update:', uErr);
        }
      }

      // 5. If Google Sheets is connected, auto-sync user profile row
      if (navigator.onLine && sheetsStatus.connected) {
        const token = googleSheetsService.hasToken()
          ? loadFromLocalStorage<string | null>('dt_google_sheets_token', null)
          : null;
        if (token) {
          const totalMinutes = sessions.reduce((acc, s) => acc + Math.round(s.durationSeconds / 60), 0);
          const totalHours = Number((totalMinutes / 60).toFixed(1));
          googleSheetsService
            .syncUserProfileOnly(
              token,
              { ...(user || {}), ...cleanData } as UserProfile,
              {
                streakDays: streakInfo.currentStreak,
                bestStreakDays: streakInfo.bestStreak,
                totalHours,
              }
            )
            .catch((sErr) => {
              console.warn('Background Google Sheets profile sync note:', sErr);
            });
        }
      }
    },
    [enqueueSyncItem, removeSyncItems, openAuthModal, sheetsStatus.connected, sessions, streakInfo, user]
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

  const connectAndSyncGoogleSheets = useCallback(async () => {
    const currentUid = auth.currentUser?.uid || user?.id;
    if (!currentUid) {
      openAuthModal('login');
      throw new Error('Please sign in or create an account before syncing to Google Sheets.');
    }

    setSheetsStatus((prev) => ({ ...prev, isSyncing: true, error: null }));
    try {
      let token = googleSheetsService.hasToken()
        ? loadFromLocalStorage<string | null>('dt_google_sheets_token', null)
        : null;

      if (!token) {
        token = await googleSheetsService.requestOAuthToken();
      }

      const res = await googleSheetsService.syncToGoogleSheets(token, {
        user,
        goals,
        tasks,
        sessions,
        certificates,
        streakDays: streakInfo.currentStreak,
        bestStreakDays: streakInfo.bestStreak,
      });

      setSheetsStatus({
        connected: true,
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl,
        lastSynced: new Date().toISOString(),
        isSyncing: false,
        error: null,
      });

      window.dispatchEvent(
        new CustomEvent('app-notification-event', {
          detail: {
            title: 'Google Sheets Backup Complete',
            body: 'Your user profile, goals, tasks, and time sessions have been saved in Google Sheets.',
            type: 'achievement',
          },
        })
      );
    } catch (err: any) {
      console.error('Google Sheets sync error:', err);
      setSheetsStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: err.message || 'Failed to sync with Google Sheets',
      }));
      throw err;
    }
  }, [user, goals, tasks, sessions, certificates, streakInfo, openAuthModal]);

  const disconnectGoogleSheets = useCallback(() => {
    googleSheetsService.clearAuth();
    setSheetsStatus({
      connected: false,
      spreadsheetId: null,
      spreadsheetUrl: null,
      lastSynced: null,
      isSyncing: false,
      error: null,
    });
  }, []);

  const pullUserProfileFromGoogleSheets = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      let token = googleSheetsService.hasToken()
        ? loadFromLocalStorage<string | null>('dt_google_sheets_token', null)
        : null;
      if (!token) {
        token = await googleSheetsService.requestOAuthToken();
      }
      const pulledData = await googleSheetsService.pullUserProfileFromSheet(token);
      if (!pulledData || Object.keys(pulledData).length === 0) {
        return {
          success: false,
          message: 'No profile details found in Google Sheet row yet. Try syncing first.',
        };
      }
      await updateProfile(pulledData);
      return {
        success: true,
        message: 'Profile refreshed with details from Google Sheet!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to pull profile details from Google Sheets',
      };
    }
  }, [updateProfile]);

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
        startGuestSession,
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
        logManualSession,
        completeTaskToday,
        triggerStreakCelebrationNotification,
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
        sheetsStatus,
        connectAndSyncGoogleSheets,
        disconnectGoogleSheets,
        pullUserProfileFromGoogleSheets,
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
