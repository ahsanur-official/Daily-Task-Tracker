import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Flame,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Play,
  Pause,
  Maximize2,
  ShieldCheck,
  User,
  LogOut,
  KeyRound,
  ChevronDown,
  Sparkles,
  Cloud,
  MoreHorizontal,
  Settings,
} from 'lucide-react';
import { formatSecondsToDigital } from '../../utils/time';
import { PWAInstallButton } from './PWAInstallButton';

export const Header: React.FC = () => {
  const {
    user,
    firebaseUser,
    isOnline,
    isSyncing,
    streakInfo,
    activeTimer,
    pauseTimer,
    resumeTimer,
    setDistractionFree,
    tasks,
    updateProfile,
    setActiveView,
    openAuthModal,
    logout,
    isDark,
    toggleTheme,
  } = useApp();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTask = activeTimer ? tasks.find((t) => t.id === activeTimer.taskId) : null;

  return (
    <header className="h-16 border-b border-stone-200 dark:border-stone-800 bg-white/85 dark:bg-stone-900/85 backdrop-blur-md sticky top-0 z-30">
      <div className="w-full max-w-[1720px] mx-auto h-full px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <img
              src="/logo.svg"
              alt="Daily Task Tracker Logo"
              className="w-9 h-9 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="hidden sm:block">
              <span className="font-bold text-stone-900 dark:text-stone-100 tracking-tight text-base block leading-none">
                Daily Task
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold tracking-wide uppercase">
                Tracker
              </span>
            </div>
          </button>

          {/* Online/Offline & Cloud Badge */}
          {!isOnline ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
              title="Saved on local drive. Will auto-sync when online."
            >
              <WifiOff className="w-3 h-3" />
              <span className="hidden md:inline">Saved Locally (Offline)</span>
            </span>
          ) : (
            <span
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60"
              title={isSyncing ? 'Synchronizing with cloud...' : 'Real-time cloud sync active'}
            >
              <Cloud className={`w-3 h-3 ${isSyncing ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
              <span>{isSyncing ? 'Syncing...' : 'Cloud Synced'}</span>
            </span>
          )}
        </div>

        {/* Center: Running Timer Mini Widget with both Pause & Resume buttons */}
        {activeTimer && currentTask && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={pauseTimer}
                disabled={!activeTimer.isRunning}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  activeTimer.isRunning
                    ? 'bg-stone-900 dark:bg-stone-800 text-white hover:bg-stone-800 dark:hover:bg-stone-700 cursor-pointer shadow-xs'
                    : 'bg-stone-200/80 dark:bg-stone-800/60 text-stone-400 dark:text-stone-500 cursor-not-allowed opacity-60'
                }`}
                title="Pause timer"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
              </button>
              <button
                onClick={resumeTimer}
                disabled={activeTimer.isRunning}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  !activeTimer.isRunning
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 cursor-pointer shadow-xs animate-pulse ring-1 ring-amber-400'
                    : 'bg-stone-200/80 dark:bg-stone-800/60 text-stone-400 dark:text-stone-500 cursor-not-allowed opacity-60'
                }`}
                title="Resume timer"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </button>
            </div>

            <div className="text-left hidden sm:block max-w-[150px] truncate">
              <div className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">
                {currentTask.title}
              </div>
              <div className="text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-400">
                {formatSecondsToDigital(
                  Math.max(
                    0,
                    activeTimer.targetSeconds -
                      (activeTimer.accumulatedSecondsBeforeSession +
                        (activeTimer.isRunning ? Math.floor((Date.now() - activeTimer.sessionStartTime) / 1000) : 0))
                  )
                )}{' '}
                left ({activeTimer.isRunning ? 'Running' : 'Paused'})
              </div>
            </div>

            <button
              onClick={() => setDistractionFree(true)}
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              title="Open Focus Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Streak indicator */}
          <button
            onClick={() => setActiveView('calendar')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-xs font-semibold text-stone-800 dark:text-stone-200"
            title={`Current Streak: ${streakInfo.currentStreak} days (Best: ${streakInfo.bestStreak} days)`}
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
            <span>{streakInfo.currentStreak}d streak</span>
          </button>

          {/* Verification direct link */}
          <button
            onClick={() => setActiveView('verify')}
            className="hidden md:flex items-center gap-1 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 px-2 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Verify Certificate"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* More Functions Menu (containing App Install button, Settings, Verification, etc.) */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isMoreMenuOpen
                  ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-xs ring-2 ring-amber-500/20'
                  : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title="More functions and app options"
              aria-label="More options"
              aria-expanded={isMoreMenuOpen}
            >
              <MoreHorizontal className="w-4 h-4 text-stone-600 dark:text-stone-300" />
              <span className="hidden sm:inline">More</span>
            </button>

            {/* Dropdown Menu with App Install prominently placed */}
            {isMoreMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-3 z-50 animate-fadeIn space-y-3">
                <div className="px-2 pt-1 pb-1 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    More Functions
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500">
                    Menu
                  </span>
                </div>

                {/* App Installation Option inside More Function */}
                <div>
                  <PWAInstallButton
                    variant="more-menu"
                    onCloseMenu={() => setIsMoreMenuOpen(false)}
                  />
                </div>

                {/* Additional Quick Actions */}
                <div className="space-y-1 pt-1 border-t border-stone-100 dark:border-stone-800">
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setActiveView('settings');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-2xl transition-colors text-left cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-stone-400" />
                    <div className="min-w-0 flex-1">
                      <span className="block font-semibold">Preferences & Storage Sync</span>
                      <span className="block text-[10px] text-stone-400">Cloud backups & timers</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setActiveView('verify');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-2xl transition-colors text-left cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-stone-400" />
                    <div className="min-w-0 flex-1">
                      <span className="block font-semibold">Verify Certificate ID</span>
                      <span className="block text-[10px] text-stone-400">Validate official credentials</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setActiveView('profile');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-2xl transition-colors text-left cursor-pointer"
                  >
                    <User className="w-4 h-4 text-stone-400" />
                    <div className="min-w-0 flex-1">
                      <span className="block font-semibold">Profile & Account</span>
                      <span className="block text-[10px] text-stone-400">Manage photo and discipline stats</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Account Menu */}
          {user ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group cursor-pointer"
                title={`${user.fullName} (@${user.username}) - Click for account options`}
              >
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-xl object-cover ring-2 ring-stone-200 dark:ring-stone-700 group-hover:ring-amber-500 transition-all"
                />
                <div className="hidden lg:flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-tight truncate max-w-[120px]">
                      {user.fullName}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 leading-tight">
                    @{user.username}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-transform" />
              </button>

              {/* Dropdown Menu */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl py-2 z-50 animate-fadeIn">
                  {/* User summary */}
                  <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-3">
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-amber-500/50"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate flex items-center gap-1.5">
                        <span>{user.fullName}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {user.email}
                      </div>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        {user.accountTier || 'Member'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        setActiveView('profile');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <User className="w-4 h-4 text-amber-500" />
                      <span>View Detailed Profile</span>
                    </button>

                    {/* Install App inside dropdown */}
                    <PWAInstallButton
                      variant="menu-item"
                      onCloseMenu={() => setIsAccountMenuOpen(false)}
                    />

                    <div className="my-1 border-t border-stone-100 dark:border-stone-800" />

                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-xs transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
