import React from 'react';
import {
  Sparkles,
  Zap,
  Flame,
  Clock,
  Target,
  Award,
  Globe,
  Github,
  Linkedin,
  Twitter,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Check,
} from 'lucide-react';
import { UserProfile, Goal, TimeSession, Certificate } from '../../types';
import { DisciplineLevelInfo, ProfileCompletenessItem } from './profileUtils';
import { formatSecondsToHuman } from '../../utils/time';

interface ProfileOverviewTabProps {
  user: UserProfile;
  levelInfo: DisciplineLevelInfo;
  completeness: {
    score: number;
    completedCount: number;
    totalCount: number;
    items: ProfileCompletenessItem[];
  };
  goals: Goal[];
  sessions: TimeSession[];
  certificates: Certificate[];
  streakInfo: { currentStreak: number; bestStreak: number };
  onNavigateToSection: (section: 'photo' | 'personal' | 'bio' | 'schedule' | 'social') => void;
  onOpenUpgradeModal: () => void;
  onViewCertificates: () => void;
}

export const ProfileOverviewTab: React.FC<ProfileOverviewTabProps> = ({
  user,
  levelInfo,
  completeness,
  goals,
  sessions,
  certificates,
  streakInfo,
  onNavigateToSection,
  onOpenUpgradeModal,
  onViewCertificates,
}) => {
  const activeGoals = goals.filter((g) => g.status === 'active').length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const totalFocusSeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

  // Compute category focus distribution
  const categoryHoursMap: Record<string, number> = {};
  sessions.forEach((s) => {
    const matchedGoal = goals.find((g) => g.id === s.goalId);
    const cat = matchedGoal?.category || user.primaryCategory || 'General';
    categoryHoursMap[cat] = (categoryHoursMap[cat] || 0) + (s.durationSeconds || 0);
  });

  const categoriesSorted = Object.entries(categoryHoursMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const pendingItems = completeness.items.filter((i) => !i.isCompleted);

  return (
    <div className="space-y-6">
      {/* 1. Profile Completeness & Upgrade Roadmap Banner */}
      {completeness.score < 100 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/30 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-stone-950">
                  Profile Strength: {completeness.score}%
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  {completeness.completedCount} of {completeness.totalCount} completed
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Upgrade Your Profile to 100% Strength
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                Complete the remaining items below to unlock maximum reputation, XP bonus, and profile badges.
              </p>
            </div>

            {/* Visual Progress Ring / Bar */}
            <div className="w-full sm:w-48 shrink-0">
              <div className="h-2.5 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${completeness.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pending Action Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
            {pendingItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigateToSection(item.targetSection)}
                className="p-3 rounded-2xl bg-white/90 dark:bg-stone-900/90 hover:bg-white dark:hover:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-500/50 transition-all text-left flex items-center justify-between gap-2 shadow-2xs group cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 block truncate">
                    + {item.label}
                  </span>
                  <span className="text-[10px] text-stone-400 block truncate">
                    +{item.weight} XP boost
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-500 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Lifetime KPI Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Current / Best Streak
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-orange-500 mt-1 flex items-center gap-2">
            <Flame className="w-5 h-5 fill-orange-500 shrink-0" />
            <span>{streakInfo.currentStreak}d / {streakInfo.bestStreak}d</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Active / Done Goals
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-stone-900 dark:text-stone-100 mt-1 flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-500 shrink-0" />
            <span>{activeGoals} active • {completedGoals} done</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Total Logged Focus
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-2">
            <Clock className="w-5 h-5 shrink-0" />
            <span className="truncate">{formatSecondsToHuman(totalFocusSeconds)}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Milestone Credentials
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-2">
            <Award className="w-5 h-5 shrink-0" />
            <span>{certificates.length} verified</span>
          </div>
        </div>
      </div>

      {/* 3. Main Split: Left Dossier / Right Discipline & Focus Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Discipline XP Progression Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-500" />
                  <span>Discipline Rank Progression</span>
                </span>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  Level {levelInfo.level} • {levelInfo.title}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300">
                  {levelInfo.currentXp} / {levelInfo.xpForNextLevel} XP
                </span>
                <span className="text-[11px] text-stone-400 block">
                  {levelInfo.xpForNextLevel - levelInfo.currentXp} XP to Level {levelInfo.level + 1}
                </span>
              </div>
            </div>

            {/* Level Bar */}
            <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden p-0.5 border border-stone-200/60 dark:border-stone-700/60">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>

            {/* XP Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50">
                <span className="text-[10px] text-stone-400 block">Focus Work</span>
                <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                  +{levelInfo.breakdown.focusTimeXp} XP
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50">
                <span className="text-[10px] text-stone-400 block">Consistency</span>
                <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                  +{levelInfo.breakdown.streakXp} XP
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50">
                <span className="text-[10px] text-stone-400 block">Goals Completed</span>
                <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                  +{levelInfo.breakdown.goalsXp} XP
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50">
                <span className="text-[10px] text-stone-400 block">Certificates</span>
                <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                  +{levelInfo.breakdown.certificatesXp} XP
                </span>
              </div>
            </div>
          </div>

          {/* Bio & Daily Philosophy Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Personal Philosophy & Bio</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateToSection('bio')}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Edit Bio
              </button>
            </div>
            <p className="text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-relaxed italic bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800">
              "{user.bio || 'Continuous improvement over perfection. 1% better every single day.'}"
            </p>
          </div>

          {/* Focus Schedule & Daily Target Snapshot */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Daily Focus Architecture</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateToSection('schedule')}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Modify Schedule
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block mb-0.5">
                  Daily Focus Target
                </span>
                <span className="text-lg font-bold text-stone-900 dark:text-stone-100 font-mono">
                  {user.preferredDailyWorkingHours} Hours / Day
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800">
                <span className="text-[11px] font-semibold text-stone-400 block mb-0.5">
                  Focus Window
                </span>
                <span className="text-sm font-bold text-stone-800 dark:text-stone-200 font-mono">
                  {user.preferredWorkStartTime} - {user.preferredWorkEndTime}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800">
                <span className="text-[11px] font-semibold text-stone-400 block mb-0.5">
                  Primary Domain
                </span>
                <span className="text-sm font-bold text-stone-800 dark:text-stone-200 truncate block">
                  {user.primaryCategory || 'Coding & Tech'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-2">
                Active Working Days:
              </span>
              <div className="flex flex-wrap gap-2">
                {allDays.map((d) => {
                  const isActive = (user.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).includes(d);
                  return (
                    <div
                      key={d}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-2xs'
                          : 'bg-stone-100 dark:bg-stone-800/60 text-stone-400 border border-transparent'
                      }`}
                    >
                      {d} {isActive ? '• Active' : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col */}
        <div className="space-y-6">
          {/* Focus Category Distribution */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Category Focus Breakdown</span>
            </h3>

            {categoriesSorted.length === 0 ? (
              <p className="text-xs text-stone-400 py-3 text-center">
                No focus sessions logged yet. Complete tasks to see your discipline distribution!
              </p>
            ) : (
              <div className="space-y-3">
                {categoriesSorted.map(([category, seconds]) => {
                  const hours = (seconds / 3600).toFixed(1);
                  const percent = totalFocusSeconds > 0 ? Math.round((seconds / totalFocusSeconds) * 100) : 0;

                  return (
                    <div key={category} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
                        <span className="font-semibold">{category}</span>
                        <span className="font-mono text-stone-500 dark:text-stone-400">
                          {hours}h ({percent}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Web & Social Links */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>Web & Social Presence</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateToSection('social')}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Edit Links
              </button>
            </div>

            <div className="space-y-2">
              {user.website && (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Globe className="w-4 h-4 text-stone-400 group-hover:text-amber-500 shrink-0" />
                    <span className="truncate">{user.website}</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                </a>
              )}

              {user.github && (
                <a
                  href={`https://github.com/${user.github.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Github className="w-4 h-4 text-stone-400 group-hover:text-amber-500 shrink-0" />
                    <span className="truncate">github.com/{user.github}</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                </a>
              )}

              {user.linkedin && (
                <a
                  href={user.linkedin.startsWith('http') ? user.linkedin : `https://linkedin.com/in/${user.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Linkedin className="w-4 h-4 text-stone-400 group-hover:text-amber-500 shrink-0" />
                    <span className="truncate">linkedin.com/in/{user.linkedin}</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                </a>
              )}

              {user.twitter && (
                <a
                  href={`https://twitter.com/${user.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Twitter className="w-4 h-4 text-stone-400 group-hover:text-amber-500 shrink-0" />
                    <span className="truncate">@{user.twitter.replace('@', '')}</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                </a>
              )}

              {!user.website && !user.github && !user.linkedin && !user.twitter && (
                <div className="text-center py-4">
                  <p className="text-xs text-stone-400 mb-2">No external links connected yet.</p>
                  <button
                    type="button"
                    onClick={() => onNavigateToSection('social')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                  >
                    + Connect Socials
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Milestone Certificates Link */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verified Milestones</span>
              </h3>
              <button
                type="button"
                onClick={onViewCertificates}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>View ({certificates.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Every completed 15, 30, or 60-day goal produces a cryptographically signed proof of consistency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
