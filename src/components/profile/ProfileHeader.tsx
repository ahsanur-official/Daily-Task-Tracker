import React from 'react';
import {
  MapPin,
  Building2,
  Camera,
  Crown,
  Sparkles,
  Zap,
  Edit3,
  Download,
  LogOut,
  Upload,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { DisciplineLevelInfo, TIER_DEFINITIONS } from './profileUtils';

interface ProfileHeaderProps {
  user: UserProfile;
  levelInfo: DisciplineLevelInfo;
  completenessScore: number;
  onOpenUpgradeModal: () => void;
  onOpenEditTab: () => void;
  onExportData: () => void;
  onLogout: () => void;
  onDirectDevicePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessingPhoto: boolean;
  photoInputRef: React.RefObject<HTMLInputElement | null>;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  levelInfo,
  completenessScore,
  onOpenUpgradeModal,
  onOpenEditTab,
  onExportData,
  onLogout,
  onDirectDevicePhotoUpload,
  isProcessingPhoto,
  photoInputRef,
}) => {
  const currentTier = user.accountTier || 'Standard Member';
  const tierDef = TIER_DEFINITIONS.find((t) => t.id === currentTier) || TIER_DEFINITIONS[0];

  return (
    <div className="relative rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
      {/* Cover Banner */}
      <div className="h-32 sm:h-44 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-purple-600/20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />

        {/* Top Right Quick Actions */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onExportData}
            className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-stone-900/80 hover:bg-white dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Export full user dossier (JSON)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Sign out of account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Profile Identity Bar */}
      <div className="px-6 sm:px-8 pb-6 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-5 -mt-16 sm:-mt-14">
        {/* Left: Avatar + Core Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
          {/* Avatar Container */}
          <div className="relative group shrink-0">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={onDirectDevicePhotoUpload}
              className="hidden"
              aria-label="Upload photo directly from your device"
            />
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-white dark:ring-stone-900 shadow-xl bg-stone-100 dark:bg-stone-800 transition-transform duration-200 group-hover:scale-[1.02]"
            />

            {/* Hover Camera Overlay */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={isProcessingPhoto}
              className="absolute inset-0 rounded-3xl bg-stone-950/65 backdrop-blur-xs flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 cursor-pointer shadow-inner"
              title="Click to select a photo from your local device"
            >
              <Camera className="w-6 h-6 text-amber-400 mb-1" />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-900/90 text-stone-100 border border-stone-700">
                {isProcessingPhoto ? 'Saving...' : 'Upload Photo'}
              </span>
            </button>

            {/* Storage Type Tag */}
            <span
              className={`absolute bottom-1 right-1 px-2 py-0.5 rounded-lg text-[9px] font-extrabold shadow-md flex items-center gap-1 ${
                user.avatarStorageType === 'uploaded_device'
                  ? 'bg-emerald-500 text-stone-950'
                  : 'bg-amber-500 text-stone-950'
              }`}
            >
              {user.avatarStorageType === 'uploaded_device' ? (
                <>
                  <Upload className="w-2.5 h-2.5" /> Device Photo
                </>
              ) : (
                <>
                  <Sparkles className="w-2.5 h-2.5" /> Preset
                </>
              )}
            </span>
          </div>

          {/* User Names & Status */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 dark:text-stone-50">
                {user.fullName}
              </h1>

              {/* Account Tier Badge with Upgrade Action */}
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="group px-3 py-1 rounded-full text-xs font-black border transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: `${tierDef.color}15`,
                  borderColor: `${tierDef.color}45`,
                  color: tierDef.color,
                }}
                title="Click to upgrade or modify account tier"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{tierDef.name}</span>
                <span className="text-[10px] font-semibold opacity-75 group-hover:opacity-100 underline decoration-dotted">
                  • Upgrade
                </span>
              </button>
            </div>

            <div className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-300 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-mono text-stone-500 dark:text-stone-400">@{user.username}</span>

              {user.occupation && (
                <>
                  <span className="text-stone-300 dark:text-stone-700">•</span>
                  <span className="text-stone-700 dark:text-stone-200 font-semibold">{user.occupation}</span>
                </>
              )}

              {user.location && (
                <>
                  <span className="text-stone-300 dark:text-stone-700">•</span>
                  <span className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{user.location}</span>
                  </span>
                </>
              )}
            </div>

            {user.companyOrSchool && (
              <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                <span>{user.companyOrSchool}</span>
              </div>
            )}

            {/* Level & Rank Badge */}
            <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold border border-stone-200/60 dark:border-stone-700">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Level {levelInfo.level}</span>
                <span className="text-stone-400 dark:text-stone-500">•</span>
                <span className="text-amber-600 dark:text-amber-400">{levelInfo.title}</span>
              </div>

              {/* Quick photo change button */}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 text-xs font-semibold transition-colors cursor-pointer border border-stone-200/60 dark:border-stone-700"
              >
                <Camera className="w-3.5 h-3.5 text-amber-500" />
                <span>{isProcessingPhoto ? 'Saving...' : 'Change Photo'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Upgrade Tier CTA + Edit Profile CTA */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-center gap-2.5 pt-2 md:pt-0 shrink-0">
          <button
            type="button"
            onClick={onOpenUpgradeModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-stone-950 font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Crown className="w-4 h-4 fill-stone-950" />
            <span>Upgrade Tier & Perks</span>
          </button>

          <button
            type="button"
            onClick={onOpenEditTab}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-stone-200/80 dark:border-stone-700/80"
          >
            <Edit3 className="w-4 h-4 text-stone-500" />
            <span>Edit Profile Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};
