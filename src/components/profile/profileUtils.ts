import { UserProfile, Goal, TimeSession, Certificate } from '../../types';

export interface DisciplineLevelInfo {
  level: number;
  title: string;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  totalXp: number;
  breakdown: {
    focusTimeXp: number;
    streakXp: number;
    goalsXp: number;
    certificatesXp: number;
  };
}

const LEVEL_TITLES = [
  'Novice Explorer',
  'Apprentice Builder',
  'Habit Practitioner',
  'Focus Specialist',
  'Dedicated Architect',
  'Discipline Artisan',
  'Momentum Master',
  'High-Velocity Titan',
  'Master Disciplinarian',
  'Grandmaster Elite',
];

export function calculateDisciplineLevel(
  sessions: TimeSession[],
  streakDays: number,
  goals: Goal[],
  certificates: Certificate[]
): DisciplineLevelInfo {
  const totalSeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const totalHours = totalSeconds / 3600;

  const focusTimeXp = Math.floor(totalHours * 60);
  const streakXp = streakDays * 40;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const goalsXp = completedGoals * 250 + goals.length * 50;
  const certificatesXp = certificates.length * 500;

  const totalXp = focusTimeXp + streakXp + goalsXp + certificatesXp;

  // Level curve: Base 400 XP, scaling 1.4x each level
  // Level 1: 0 - 399
  // Level 2: 400 - 999
  // Level 3: 1000 - 1799
  // etc.
  let level = 1;
  let accumulatedXp = 0;
  let levelThreshold = 400;

  while (totalXp >= accumulatedXp + levelThreshold && level < 10) {
    accumulatedXp += levelThreshold;
    level += 1;
    levelThreshold = Math.floor(levelThreshold * 1.35);
  }

  const xpInCurrentLevel = totalXp - accumulatedXp;
  const progressPercent = Math.min(100, Math.max(0, Math.floor((xpInCurrentLevel / levelThreshold) * 100)));
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  return {
    level,
    title,
    currentXp: xpInCurrentLevel,
    xpForCurrentLevel: accumulatedXp,
    xpForNextLevel: levelThreshold,
    progressPercent,
    totalXp,
    breakdown: {
      focusTimeXp,
      streakXp,
      goalsXp,
      certificatesXp,
    },
  };
}

export interface ProfileCompletenessItem {
  id: string;
  label: string;
  description: string;
  weight: number;
  isCompleted: boolean;
  targetSection: 'photo' | 'personal' | 'bio' | 'schedule' | 'social';
}

export function calculateProfileCompleteness(user: UserProfile | null) {
  if (!user) {
    return { score: 0, completedCount: 0, totalCount: 6, items: [] };
  }

  const hasPhoto = Boolean(user.avatarUrl && !user.avatarUrl.includes('photo-1534528741775-53994a69daeb'));
  const hasName = Boolean(user.fullName && user.fullName !== 'Member' && user.username);
  const hasBio = Boolean(user.bio && user.bio.trim().length > 15);
  const hasSchedule = Boolean(user.preferredDailyWorkingHours > 0 && user.preferredWorkStartTime && user.preferredWorkEndTime);
  const hasSocial = Boolean(user.github || user.linkedin || user.twitter || user.website);
  const hasLocationOrOccupation = Boolean(user.location || user.occupation || user.companyOrSchool);

  const items: ProfileCompletenessItem[] = [
    {
      id: 'photo',
      label: 'Upload Personal Device Photo',
      description: 'Add a custom photo from your device or an illustrated avatar',
      weight: 20,
      isCompleted: hasPhoto,
      targetSection: 'photo',
    },
    {
      id: 'name',
      label: 'Personal Identity & Handle',
      description: 'Verify your display name and unique username handle',
      weight: 15,
      isCompleted: hasName,
      targetSection: 'personal',
    },
    {
      id: 'bio',
      label: 'Focus Philosophy & Bio',
      description: 'Share your daily motto, habits, or professional focus mindset',
      weight: 20,
      isCompleted: hasBio,
      targetSection: 'bio',
    },
    {
      id: 'schedule',
      label: 'Daily Target & Hours Window',
      description: 'Define your daily focus hour target and active work window',
      weight: 15,
      isCompleted: hasSchedule,
      targetSection: 'schedule',
    },
    {
      id: 'social',
      label: 'Web & Portfolio Links',
      description: 'Connect GitHub, LinkedIn, Twitter/X, or personal website',
      weight: 15,
      isCompleted: hasSocial,
      targetSection: 'social',
    },
    {
      id: 'location',
      label: 'Role, Institution & Location',
      description: 'Add your current job title, lab or school, and timezone',
      weight: 15,
      isCompleted: hasLocationOrOccupation,
      targetSection: 'personal',
    },
  ];

  const completedCount = items.filter((i) => i.isCompleted).length;
  const score = items.reduce((sum, item) => (item.isCompleted ? sum + item.weight : sum), 0);

  return {
    score: Math.min(100, score),
    completedCount,
    totalCount: items.length,
    items,
  };
}

export interface TierDefinition {
  id: 'Standard Member' | 'Pro Practitioner' | 'Master Disciplinarian' | 'Grandmaster Elite';
  name: string;
  badgeLabel: string;
  tagline: string;
  color: string;
  borderColor: string;
  bgLight: string;
  bgDark: string;
  isRecommended?: boolean;
  perks: string[];
  specs: {
    activeGoalsLimit: string;
    focusSoundscapes: string;
    certificates: string;
    cloudSyncPriority: string;
    customTags: string;
  };
}

export const TIER_DEFINITIONS: TierDefinition[] = [
  {
    id: 'Standard Member',
    name: 'Standard Member',
    badgeLabel: 'Base Tier',
    tagline: 'Essential daily task tracking and session timing',
    color: '#78716c',
    borderColor: 'border-stone-300 dark:border-stone-700',
    bgLight: 'bg-stone-50',
    bgDark: 'dark:bg-stone-800/40',
    perks: [
      'Up to 3 concurrent active goals',
      'Daily time tracking with recovery buffers',
      'Distraction-free focus timer with audio cues',
      'Basic milestone streak tracking',
      'Local storage offline support',
    ],
    specs: {
      activeGoalsLimit: '3 Active Goals',
      focusSoundscapes: 'Standard Chimes',
      certificates: 'Standard PDF/PNG',
      cloudSyncPriority: 'Standard Interval',
      customTags: 'Preset Categories',
    },
  },
  {
    id: 'Pro Practitioner',
    name: 'Pro Practitioner',
    badgeLabel: 'Most Popular',
    tagline: 'For committed builders with multi-project momentum',
    color: '#f59e0b',
    borderColor: 'border-amber-500/60 dark:border-amber-500/60',
    bgLight: 'bg-amber-500/5',
    bgDark: 'dark:bg-amber-500/10',
    isRecommended: true,
    perks: [
      'Unlimited active goals & scheduled tasks',
      'Custom color labels & category tags',
      'Google Sheets automated two-way cloud sync',
      'Cryptographically verified milestone certificates',
      'Advanced recovery engine & automated catch-up schedule',
      'High-resolution PDF & SVG export',
    ],
    specs: {
      activeGoalsLimit: 'Unlimited Goals',
      focusSoundscapes: 'Binaural Deep Work',
      certificates: 'Verified Cryptographic Hash',
      cloudSyncPriority: 'Near-Instant Realtime',
      customTags: 'Custom Color Labels & Hex',
    },
  },
  {
    id: 'Master Disciplinarian',
    name: 'Master Disciplinarian',
    badgeLabel: 'Elite Craft',
    tagline: 'Maximum autonomy, executive analytics, and prestige dossier',
    color: '#ea580c',
    borderColor: 'border-orange-500/70 dark:border-orange-500/70',
    bgLight: 'bg-orange-500/5',
    bgDark: 'dark:bg-orange-500/10',
    perks: [
      'All Pro Practitioner privileges included',
      'Executive Dossier & public cryptographic verification link',
      'Priority offline reconciliation & cloud conflict resolution',
      'High-velocity discipline analytics & focus heatmap forecast',
      'Exclusive Master Disciplinarian aura banner & verified badge',
      'Custom soundscape audio mixer & white noise generator',
    ],
    specs: {
      activeGoalsLimit: 'Unlimited + Sub-Goals',
      focusSoundscapes: 'Master Audio Mixer',
      certificates: 'Golden Seal + QR Verification',
      cloudSyncPriority: 'Zero-Lag Instant Sync',
      customTags: 'Unlimited Custom Taxonomies',
    },
  },
  {
    id: 'Grandmaster Elite',
    name: 'Grandmaster Elite',
    badgeLabel: 'Sovereign Prestige',
    tagline: 'The pinnacle of lifelong dedication and unwavering focus',
    color: '#8b5cf6',
    borderColor: 'border-purple-500/70 dark:border-purple-500/70',
    bgLight: 'bg-purple-500/5',
    bgDark: 'dark:bg-purple-500/10',
    perks: [
      'All Master Disciplinarian features unlocked',
      'Sovereign holographic profile crown & golden aura banner',
      'Lifetime immutable milestone credentials in blockchain format',
      'Dedicated Google Cloud dedicated instance priority',
      'Custom goal coaching AI insights & discipline audit engine',
      'Lifetime VIP badge on shared certificates & public links',
    ],
    specs: {
      activeGoalsLimit: 'Unlimited Everything',
      focusSoundscapes: 'Custom Neural Audio',
      certificates: 'Sovereign Holographic Seal',
      cloudSyncPriority: 'Dedicated Thread Cloud Sync',
      customTags: 'Full Custom Design System',
    },
  },
];

export interface DisciplineBadge {
  id: string;
  name: string;
  category: string;
  description: string;
  iconName: string;
  color: string;
  isUnlocked: boolean;
  progressText: string;
}

export function evaluateDisciplineBadges(
  sessions: TimeSession[],
  streakDays: number,
  goals: Goal[],
  certificates: Certificate[]
): DisciplineBadge[] {
  const totalSeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const totalHours = totalSeconds / 3600;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;

  const categories = new Set(goals.map((g) => g.category));

  return [
    {
      id: 'first_step',
      name: 'First Step',
      category: 'Initiation',
      description: 'Completed your very first focused work session',
      iconName: 'Sparkles',
      color: '#f59e0b',
      isUnlocked: sessions.length > 0,
      progressText: sessions.length > 0 ? 'Unlocked' : '0/1 session',
    },
    {
      id: 'streak_3',
      name: 'Momentum Spark',
      category: 'Consistency',
      description: 'Maintained a 3-day continuous daily streak',
      iconName: 'Flame',
      color: '#ea580c',
      isUnlocked: streakDays >= 3,
      progressText: `${Math.min(streakDays, 3)}/3 days`,
    },
    {
      id: 'streak_7',
      name: 'Unshakable Will',
      category: 'Consistency',
      description: 'Maintained a 7-day uninterrupted focus streak',
      iconName: 'ShieldCheck',
      color: '#e11d48',
      isUnlocked: streakDays >= 7,
      progressText: `${Math.min(streakDays, 7)}/7 days`,
    },
    {
      id: 'focus_10',
      name: 'Ten Hours In',
      category: 'Dedication',
      description: 'Logged at least 10 hours of active deep work',
      iconName: 'Clock',
      color: '#0284c7',
      isUnlocked: totalHours >= 10,
      progressText: `${Math.min(Math.floor(totalHours), 10)}/10 hrs`,
    },
    {
      id: 'focus_100',
      name: 'Centurion of Focus',
      category: 'Mastery',
      description: 'Logged 100+ total hours of focused productivity',
      iconName: 'Award',
      color: '#8b5cf6',
      isUnlocked: totalHours >= 100,
      progressText: `${Math.min(Math.floor(totalHours), 100)}/100 hrs`,
    },
    {
      id: 'goal_finisher',
      name: 'Milestone Finisher',
      category: 'Achievement',
      description: 'Successfully brought a goal across the finish line',
      iconName: 'Target',
      color: '#10b981',
      isUnlocked: completedGoals >= 1,
      progressText: `${completedGoals}/1 goal`,
    },
    {
      id: 'certified_scholar',
      name: 'Certified Scholar',
      category: 'Credentials',
      description: 'Earned at least one cryptographically verified certificate',
      iconName: 'FileBadge',
      color: '#d97706',
      isUnlocked: certificates.length >= 1,
      progressText: `${certificates.length}/1 credential`,
    },
    {
      id: 'polymath',
      name: 'Polymath Mind',
      category: 'Breadth',
      description: 'Maintained active goals across 3 distinct life categories',
      iconName: 'Compass',
      color: '#06b6d4',
      isUnlocked: categories.size >= 3,
      progressText: `${categories.size}/3 categories`,
    },
  ];
}
