import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Download,
  LogOut,
  Upload,
  HardDrive,
  Cloud,
  FileJson,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { GoogleSheetsSyncCard } from '../common/GoogleSheetsSyncCard';

interface ProfileAccountTabProps {
  user: UserProfile;
  onExportData: () => void;
  onLogout: () => void;
  onNavigateToPhoto: () => void;
}

export const ProfileAccountTab: React.FC<ProfileAccountTabProps> = ({
  user,
  onExportData,
  onLogout,
  onNavigateToPhoto,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Google Sheets Sync + Storage Architecture */}
      <div className="lg:col-span-2 space-y-6">
        {/* Google Sheets Two-Way Synchronization */}
        <GoogleSheetsSyncCard />

        {/* Persistence & Device Storage Audit */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-500" />
              <span>Storage & Local Persistence Architecture</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Online & Synchronized
            </span>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400">
            Daily Task Tracker uses an offline-first architecture. All your sessions, goals, tasks, and profile customizations are saved to your device immediately and synchronized automatically to the cloud.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800 text-xs">
              <span className="text-[10px] text-stone-400 uppercase font-semibold block mb-1">
                Avatar Source
              </span>
              <span className="font-bold text-stone-800 dark:text-stone-200 capitalize flex items-center gap-1">
                {user.avatarStorageType === 'uploaded_device' ? (
                  <>
                    <Upload className="w-3.5 h-3.5 text-emerald-500" /> Local Device
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-amber-500" /> Preset / URL
                  </>
                )}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800 text-xs">
              <span className="text-[10px] text-stone-400 uppercase font-semibold block mb-1">
                Data Redundancy
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Local + Cloud Sync
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800 text-xs">
              <span className="text-[10px] text-stone-400 uppercase font-semibold block mb-1">
                Account Status
              </span>
              <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Verified Member
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Col: Export & Account Controls */}
      <div className="space-y-6">
        {/* Data Dossier Export */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
            <FileJson className="w-4 h-4 text-amber-500" />
            <span>Complete Data Export</span>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Download your full account dossier as a structured JSON archive, including all goals, tasks, time sessions, milestone certificates, and user preferences.
          </p>

          <button
            type="button"
            onClick={onExportData}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-500/15 hover:text-amber-700 dark:hover:text-amber-400 text-stone-700 dark:text-stone-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-stone-200/80 dark:border-stone-700/80"
          >
            <Download className="w-4 h-4" />
            <span>Export Tracking Dossier (JSON)</span>
          </button>
        </div>

        {/* Account Session Controls */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Session & Account Actions</span>
          </div>

          <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
            <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
              <span>Account ID:</span>
              <span className="font-mono text-stone-500 truncate max-w-[150px]">{user.id}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
              <span>Email:</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200 truncate max-w-[150px]">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
              <span>Member Since:</span>
              <span className="font-mono text-stone-700 dark:text-stone-300">{user.createdAt || '2026-01-01'}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
