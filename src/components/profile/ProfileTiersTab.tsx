import React from 'react';
import {
  Crown,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  Award,
  Flame,
  ShieldCheck,
  Clock,
  Target,
  FileBadge,
  Compass,
} from 'lucide-react';
import { UserProfile, Goal, TimeSession, Certificate } from '../../types';
import {
  TIER_DEFINITIONS,
  DisciplineLevelInfo,
  evaluateDisciplineBadges,
  TierDefinition,
} from './profileUtils';

interface ProfileTiersTabProps {
  user: UserProfile;
  levelInfo: DisciplineLevelInfo;
  goals: Goal[];
  sessions: TimeSession[];
  certificates: Certificate[];
  streakInfo: { currentStreak: number; bestStreak: number };
  onOpenUpgradeModal: () => void;
}

export const ProfileTiersTab: React.FC<ProfileTiersTabProps> = ({
  user,
  levelInfo,
  goals,
  sessions,
  certificates,
  streakInfo,
  onOpenUpgradeModal,
}) => {
  const currentTierId = user.accountTier || 'Standard Member';
  const badges = evaluateDisciplineBadges(
    sessions,
    streakInfo.currentStreak,
    goals,
    certificates
  );

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  const renderBadgeIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Clock':
        return <Clock className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'FileBadge':
        return <FileBadge className={className} />;
      case 'Compass':
        return <Compass className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Executive Tier Upgrade Hero */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-purple-600/15 border border-amber-500/30 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl">
          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-stone-950 inline-flex items-center gap-1.5 mb-2">
            <Crown className="w-3.5 h-3.5" /> Account Upgradability
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
            Current Tier: {currentTierId}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
            Every tier unlocks elevated habit capacities, higher-resolution cloud synchronizations, verified cryptographic proof of work, and prestige profile badges.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenUpgradeModal}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-stone-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-stone-950" />
            <span>Open Tier Upgrade Hub</span>
          </button>
        </div>
      </div>

      {/* 2. Tier Matrix Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Available Account Tiers</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Choose the discipline tier that matches your goals and workload
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIER_DEFINITIONS.map((tier) => {
            const isCurrent = currentTierId === tier.id;

            return (
              <div
                key={tier.id}
                className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? `${tier.borderColor} ${tier.bgLight} ${tier.bgDark} shadow-md ring-2 ring-amber-500/20`
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        Current Active Tier
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 uppercase font-semibold">
                        {tier.badgeLabel}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {tier.name}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 min-h-[30px] leading-tight">
                    {tier.tagline}
                  </p>

                  <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-800 space-y-2">
                    {tier.perks.map((perk, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-stone-700 dark:text-stone-300">
                        <CheckCircle2
                          className="w-3.5 h-3.5 shrink-0 mt-0.5"
                          style={{ color: tier.color }}
                        />
                        <span className="text-[11px] leading-tight">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-stone-200/60 dark:border-stone-800">
                  {isCurrent ? (
                    <div className="w-full py-2 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-xl flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Activated
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={onOpenUpgradeModal}
                      className="w-full py-2 rounded-xl text-xs font-bold text-stone-950 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
                      style={{ backgroundColor: tier.color }}
                    >
                      <Zap className="w-3.5 h-3.5 fill-stone-950" />
                      <span>Upgrade to {tier.name}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Unlocked Discipline Badges / Trophy Cabinet */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Discipline Milestones & Badges</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Real accomplishments earned through logged focus, streaks, and completed goals
            </p>
          </div>

          <span className="text-xs font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full self-start sm:self-auto">
            {unlockedCount} of {badges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge) => {
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all ${
                  badge.isUnlocked
                    ? 'border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/40 shadow-xs'
                    : 'border-dashed border-stone-200 dark:border-stone-800 bg-white/40 dark:bg-stone-900/40 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      badge.isUnlocked ? 'shadow-xs' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                    }`}
                    style={
                      badge.isUnlocked
                        ? { backgroundColor: `${badge.color}20`, color: badge.color }
                        : {}
                    }
                  >
                    {badge.isUnlocked ? (
                      renderBadgeIcon(badge.iconName, 'w-5 h-5')
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      badge.isUnlocked
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                    }`}
                  >
                    {badge.progressText}
                  </span>
                </div>

                <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {badge.name}
                </div>
                <div className="text-[10px] text-stone-400 uppercase font-semibold mt-0.5">
                  {badge.category}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-tight">
                  {badge.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
