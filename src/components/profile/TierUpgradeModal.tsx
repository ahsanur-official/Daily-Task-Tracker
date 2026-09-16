import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Crown,
  ChevronRight,
  Flame,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { TIER_DEFINITIONS, TierDefinition } from './profileUtils';
import { useApp } from '../../context/AppContext';
import { playSuccessChime } from '../../utils/audio';

interface TierUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TierUpgradeModal: React.FC<TierUpgradeModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useApp();
  const [selectedTierId, setSelectedTierId] = useState<TierDefinition['id']>(
    (user?.accountTier as any) || 'Pro Practitioner'
  );
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  if (!isOpen) return null;

  const currentTier = user?.accountTier || 'Standard Member';
  const selectedTier = TIER_DEFINITIONS.find((t) => t.id === selectedTierId) || TIER_DEFINITIONS[1];

  const handleActivateTier = async (tier: TierDefinition) => {
    setIsUpgrading(true);
    try {
      await updateProfile({
        accountTier: tier.id,
      });
      playSuccessChime();
      setShowCelebration(true);
      window.dispatchEvent(
        new CustomEvent('app-notification-event', {
          detail: {
            title: `Account Upgraded to ${tier.name}!`,
            body: `You are now operating under ${tier.name} privileges. All elite tools and prestige perks are activated.`,
            type: 'system',
          },
        })
      );
      setTimeout(() => {
        setShowCelebration(false);
        setIsUpgrading(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Error activating tier:', err);
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-stone-100 dark:border-stone-800 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-purple-500/10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-stone-950 flex items-center gap-1">
                <Crown className="w-3 h-3" /> Tier Upgrade Hub
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Current: <strong className="text-stone-800 dark:text-stone-200">{currentTier}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              Upgrade Your Discipline & Account Tier
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Elevate your daily habit architecture with unlimited goals, verified cryptographic certificates, and executive sync privileges.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / Tier Cards */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6">
          {showCelebration ? (
            <div className="py-16 text-center space-y-4 animate-scaleUp">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 flex items-center justify-center mx-auto shadow-xl ring-8 ring-amber-500/20">
                <Sparkles className="w-10 h-10 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100">
                Tier Upgraded Successfully!
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                Your profile has been upgraded to <strong>{selectedTier.name}</strong>. Your prestige status is immediately active across all dashboards and certificates.
              </p>
            </div>
          ) : (
            <>
              {/* 4-Tier Interactive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {TIER_DEFINITIONS.map((tier) => {
                  const isCurrent = currentTier === tier.id;
                  const isSelected = selectedTierId === tier.id;

                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedTierId(tier.id)}
                      className={`relative flex flex-col justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                        isSelected
                          ? `${tier.borderColor} ${tier.bgLight} ${tier.bgDark} shadow-lg scale-[1.02]`
                          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 hover:border-stone-300 dark:hover:border-stone-700'
                      }`}
                    >
                      {tier.isRecommended && (
                        <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-amber-500 text-stone-950 shadow-xs">
                          {tier.badgeLabel}
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: tier.color }}
                          />
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                          {tier.name}
                        </h3>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 min-h-[32px] leading-tight">
                          {tier.tagline}
                        </p>

                        <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-800 space-y-2 text-xs">
                          {tier.perks.slice(0, 3).map((perk, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-stone-700 dark:text-stone-300">
                              <CheckCircle2
                                className="w-3.5 h-3.5 shrink-0 mt-0.5"
                                style={{ color: tier.color }}
                              />
                              <span className="text-[11px] leading-tight">{perk}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-stone-200/60 dark:border-stone-800">
                        {isCurrent ? (
                          <div className="w-full py-2 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 bg-emerald-500/10 rounded-xl">
                            <ShieldCheck className="w-3.5 h-3.5" /> Current Plan
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivateTier(tier);
                            }}
                            disabled={isUpgrading}
                            className="w-full py-2 rounded-xl text-xs font-bold text-stone-950 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
                            style={{ backgroundColor: tier.color }}
                          >
                            <Zap className="w-3.5 h-3.5 fill-stone-950" />
                            <span>Upgrade to {tier.badgeLabel}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Tier Feature Matrix Breakdown */}
              <div className="p-5 sm:p-6 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-stone-200/60 dark:border-stone-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: selectedTier.color }}
                      />
                      <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                        {selectedTier.name} Privilege Specifications
                      </h4>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Included with this tier rank:
                    </p>
                  </div>

                  {currentTier !== selectedTier.id && (
                    <button
                      type="button"
                      onClick={() => handleActivateTier(selectedTier)}
                      disabled={isUpgrading}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-stone-950 shadow-md transition-transform active:scale-95 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                      style={{ backgroundColor: selectedTier.color }}
                    >
                      <Sparkles className="w-4 h-4 fill-stone-950" />
                      <span>{isUpgrading ? 'Upgrading...' : `Activate ${selectedTier.name}`}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">Goal Capacity</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 mt-1 block">
                      {selectedTier.specs.activeGoalsLimit}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">Audio Engine</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 mt-1 block">
                      {selectedTier.specs.focusSoundscapes}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">Proof of Work</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 mt-1 block">
                      {selectedTier.specs.certificates}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">Cloud Priority</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 mt-1 block">
                      {selectedTier.specs.cloudSyncPriority}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">Visual Taxonomy</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 mt-1 block">
                      {selectedTier.specs.customTags}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex items-center justify-between">
          <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Instant activation • Changes persist directly to your cloud profile</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
