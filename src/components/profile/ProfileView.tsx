import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Crown,
  Clock,
  Award,
  Edit3,
  HardDrive,
  Sparkles,
  Layers,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { ProfileHeader } from './ProfileHeader';
import { ProfileOverviewTab } from './ProfileOverviewTab';
import { ProfileTiersTab } from './ProfileTiersTab';
import { ProfileScheduleTab } from './ProfileScheduleTab';
import { ProfileEditTab } from './ProfileEditTab';
import { ProfileAccountTab } from './ProfileAccountTab';
import { TierUpgradeModal } from './TierUpgradeModal';
import {
  calculateDisciplineLevel,
  calculateProfileCompleteness,
} from './profileUtils';
import { processStorageImageFile } from '../../utils/imageUpload';
import { exportDataAsJSON } from '../../utils/storage';

type ProfileTab = 'overview' | 'tiers' | 'schedule' | 'edit' | 'account';

export const ProfileView: React.FC = () => {
  const {
    user,
    updateProfile,
    goals,
    tasks,
    sessions,
    streakInfo,
    certificates,
    openAuthModal,
    logout,
    setActiveView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [editInitialSection, setEditInitialSection] = useState<'photo' | 'personal' | 'bio' | 'social'>('photo');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isProcessingDirectPhoto, setIsProcessingDirectPhoto] = useState(false);

  const headerPhotoInputRef = useRef<HTMLInputElement>(null);

  // If no user is logged in
  if (!user) {
    return (
      <div className="w-full max-w-[1400px] mx-auto py-12 px-4 text-center">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            No Active User Profile
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
            Please sign in or create an account to access comprehensive profile metrics, level progression, and custom discipline settings.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => openAuthModal('login')}
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="py-2.5 px-5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate Level & Progression
  const levelInfo = calculateDisciplineLevel(
    sessions,
    streakInfo.currentStreak,
    goals,
    certificates
  );

  // Calculate Profile Completeness
  const completeness = calculateProfileCompleteness(user);

  // Direct photo upload handler from the header
  const handleDirectDevicePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingDirectPhoto(true);
    try {
      const result = await processStorageImageFile(file, 260, 0.85);
      await updateProfile({
        avatarUrl: result.dataUrl,
        avatarStorageType: 'uploaded_device',
      });
      window.dispatchEvent(
        new CustomEvent('app-notification-event', {
          detail: {
            title: 'Profile Photo Updated',
            body: `Saved ${result.fileName || 'photo'} from your local device to persistence storage.`,
            type: 'system',
          },
        })
      );
    } catch (err) {
      console.error('Failed to update photo:', err);
    } finally {
      setIsProcessingDirectPhoto(false);
      if (headerPhotoInputRef.current) headerPhotoInputRef.current.value = '';
    }
  };

  const handleExportData = () => {
    exportDataAsJSON({
      user,
      goals,
      tasks,
      sessions,
      certificates,
    });
  };

  const handleNavigateToSection = (section: 'photo' | 'personal' | 'bio' | 'schedule' | 'social') => {
    if (section === 'schedule') {
      setActiveTab('schedule');
    } else {
      setEditInitialSection(section);
      setActiveTab('edit');
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-16 animate-fadeIn">
      {/* 1. Executive Profile Header with Tier Upgrade Trigger & Level Badge */}
      <ProfileHeader
        user={user}
        levelInfo={levelInfo}
        completenessScore={completeness.score}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        onOpenEditTab={() => {
          setEditInitialSection('personal');
          setActiveTab('edit');
        }}
        onExportData={handleExportData}
        onLogout={logout}
        onDirectDevicePhotoUpload={handleDirectDevicePhotoUpload}
        isProcessingPhoto={isProcessingDirectPhoto}
        photoInputRef={headerPhotoInputRef}
      />

      {/* 2. Sleek Tabbed Hub Navigation */}
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-1 overflow-x-auto gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/60'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Overview Dossier</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tiers')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'tiers'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/60'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Upgrades & Badges</span>
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
              Rank {levelInfo.level}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Schedule & Targets</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditInitialSection('personal');
              setActiveTab('edit');
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'edit'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/60'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'account'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/60'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Account & Sync</span>
          </button>
        </div>

        {/* Quick Upgrade Tier Button */}
        <button
          type="button"
          onClick={() => setIsUpgradeModalOpen(true)}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer shrink-0"
        >
          <Crown className="w-3.5 h-3.5" />
          <span>Tier: {user.accountTier || 'Standard Member'}</span>
        </button>
      </div>

      {/* 3. Tab Content Panes */}
      {activeTab === 'overview' && (
        <ProfileOverviewTab
          user={user}
          levelInfo={levelInfo}
          completeness={completeness}
          goals={goals}
          sessions={sessions}
          certificates={certificates}
          streakInfo={streakInfo}
          onNavigateToSection={handleNavigateToSection}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          onViewCertificates={() => setActiveView('certificates')}
        />
      )}

      {activeTab === 'tiers' && (
        <ProfileTiersTab
          user={user}
          levelInfo={levelInfo}
          goals={goals}
          sessions={sessions}
          certificates={certificates}
          streakInfo={streakInfo}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        />
      )}

      {activeTab === 'schedule' && <ProfileScheduleTab user={user} />}

      {activeTab === 'edit' && (
        <ProfileEditTab
          user={user}
          initialSubSection={editInitialSection}
          onSaved={() => setActiveTab('overview')}
          onCancel={() => setActiveTab('overview')}
        />
      )}

      {activeTab === 'account' && (
        <ProfileAccountTab
          user={user}
          onExportData={handleExportData}
          onLogout={logout}
          onNavigateToPhoto={() => {
            setEditInitialSection('photo');
            setActiveTab('edit');
          }}
        />
      )}

      {/* Interactive Account Tier Upgrade Modal */}
      <TierUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
};
