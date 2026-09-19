import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Target,
  Calendar,
  Clock,
  Award,
  BarChart3,
  User,
  Settings,
  ShieldCheck,
  Plus,
  X,
  Flame,
  Sun,
  Moon,
  LogOut,
  KeyRound,
  Download,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface DesktopHamburgerMenuProps {
  onOpenCreateGoal: () => void;
}

export const DesktopHamburgerMenu: React.FC<DesktopHamburgerMenuProps> = ({ onOpenCreateGoal }) => {
  const {
    isDesktopMenuOpen,
    setIsDesktopMenuOpen,
    toggleDesktopMenu,
    activeView,
    setActiveView,
    goals,
    streakInfo,
    user,
    firebaseUser,
    isDark,
    toggleTheme,
    logout,
    openAuthModal,
  } = useApp();

  // Close on Escape key & support Ctrl/Cmd + B shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDesktopMenuOpen) {
        setIsDesktopMenuOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleDesktopMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktopMenuOpen, setIsDesktopMenuOpen, toggleDesktopMenu]);

  // Lock body scroll when hamburger menu is open on desktop
  useEffect(() => {
    if (!isDesktopMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isDesktopMenuOpen]);

  if (!isDesktopMenuOpen) return null;

  const handleNavClick = (viewId: any) => {
    setActiveView(viewId);
    setIsDesktopMenuOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'goals',
      label: 'Goals',
      icon: Target,
      badge: goals.filter((g) => g.status === 'active').length,
    },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'time', label: 'Time Tracking', icon: Clock },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const secondaryNav = [
    { id: 'verify', label: 'Verify Certificate', icon: ShieldCheck },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div
      className="hidden md:block fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Desktop Navigation Menu"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsDesktopMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className="fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-250 ease-out select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800/80">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-3 text-left group cursor-pointer"
            >
              <img
                src="/logo.svg"
                alt="Logo"
                className="w-8 h-8 object-contain drop-shadow-xs group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="flex flex-col">
                <span className="font-bold text-stone-900 dark:text-stone-100 tracking-tight text-sm leading-none">
                  Daily Task
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-wide uppercase mt-0.5">
                  Tracker
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsDesktopMenuOpen(false)}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Close menu (Esc)"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* Quick Action: Create New Goal */}
          <div>
            <button
              type="button"
              onClick={() => {
                setIsDesktopMenuOpen(false);
                onOpenCreateGoal();
              }}
              className="w-full h-11 flex items-center justify-center gap-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-bold text-sm shadow-xs active:scale-[0.98] transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Create New Goal</span>
            </button>
          </div>

          {/* Primary Navigation Links */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-3 block mb-1.5">
              Menu
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-semibold text-sm transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono ${
                        isActive
                          ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-stone-950'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Secondary Navigation Links */}
          <div className="space-y-1 pt-2 border-t border-stone-100 dark:border-stone-800/80">
            <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-3 block mb-1.5">
              Account & Tools
            </span>
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* PWA Install Button */}
          <div className="pt-2">
            <PWAInstallButton variant="sidebar" />
          </div>
        </div>

        {/* Bottom Drawer Footer: Streak, Theme Toggle & User */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/70 space-y-3 shrink-0">
          {/* Streak Overview Card */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {streakInfo.currentStreak} Day Streak
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500">
                  {streakInfo.freezeBalance} freeze shield remaining
                </span>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
              aria-label="Toggle color theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>
          </div>

          {/* User Account / Auth */}
          {firebaseUser ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700">
              <button
                onClick={() => handleNavClick('profile')}
                className="flex items-center gap-2.5 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer px-1"
              >
                <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden flex items-center justify-center shrink-0 border border-amber-500/30">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-stone-500" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                    {user?.fullName || 'My Account'}
                  </span>
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 truncate font-mono">
                    {firebaseUser.email || 'Cloud Synced'}
                  </span>
                </div>
              </button>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer shrink-0"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsDesktopMenuOpen(false);
                openAuthModal('login');
              }}
              className="w-full py-2.5 px-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:border-amber-500 dark:hover:border-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
