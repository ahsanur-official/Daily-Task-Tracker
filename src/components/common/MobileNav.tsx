import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Target,
  Calendar,
  Clock,
  Award,
  MoreHorizontal,
  User,
  Settings,
  ShieldCheck,
  Plus,
  X,
  LogOut,
  KeyRound,
  Sun,
  Moon,
} from 'lucide-react';

interface MobileNavProps {
  onOpenCreateGoal?: () => void;
  onOpenMore?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenCreateGoal, onOpenMore }) => {
  const { activeView, setActiveView, user, openAuthModal, logout, streakInfo, isDark, toggleTheme } = useApp();
  const [isVisible, setIsVisible] = useState(true);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const deltaY = currentScrollY - lastScrollY.current;

      // When actively scrolling down or significant motion, smoothly hide navbar
      if (Math.abs(deltaY) > 6 && currentScrollY > 30) {
        setIsVisible(false);
      }

      // If at the very top or very bottom of the page, show immediately
      const isAtTop = currentScrollY <= 15;
      const isAtBottom =
        window.innerHeight + currentScrollY >= (document.documentElement.scrollHeight - 30);

      if (isAtTop || isAtBottom) {
        setIsVisible(true);
      }

      // Reset debounce timer: once scrolling pauses or finishes, smoothly show the navbar
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 300);

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const items = [
    { id: 'dashboard', label: 'Today', icon: LayoutDashboard },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'time', label: 'Time', icon: Clock },
    { id: 'certificates', label: 'Awards', icon: Award },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar with Scroll Auto-Hide and Smooth Re-appearance */}
      <nav
        aria-label="Mobile navigation"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 px-3 py-1.5 flex items-center justify-around shadow-lg transition-all duration-300 ease-in-out transform ${
          isVisible
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-full opacity-0 pointer-events-none'
        } pb-[max(env(safe-area-inset-bottom),0.5rem)]`}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                setIsMoreMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* More Actions Drawer Trigger */}
        <button
          onClick={() => {
            if (onOpenMore) {
              onOpenMore();
            } else {
              setIsMoreMenuOpen(!isMoreMenuOpen);
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
            isMoreMenuOpen || ['profile', 'settings', 'verify'].includes(activeView)
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer / Action Sheet */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex flex-col justify-end animate-fadeIn">
          {/* Backdrop dismiss */}
          <div className="flex-1 cursor-pointer" onClick={() => setIsMoreMenuOpen(false)} />

          <div className="bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto pb-8">
            {/* Header & Close */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.svg"
                  alt="Daily Task Tracker"
                  className="w-7 h-7 object-contain"
                />
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Daily Task Tracker
                  </h3>
                  <span className="text-[10px] text-stone-400">
                    {streakInfo.currentStreak}d streak active
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action: New Goal */}
            {onOpenCreateGoal && (
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenCreateGoal();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-500 text-stone-950 font-bold text-xs shadow-sm hover:bg-amber-400 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Goal</span>
              </button>
            )}

            {/* Secondary Views Navigation */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveView('profile');
                  setIsMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left cursor-pointer"
              >
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>My Profile & Device Photo</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('verify');
                  setIsMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-stone-400" />
                <span>Verify Certificate ID</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('settings');
                  setIsMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left cursor-pointer"
              >
                <Settings className="w-4 h-4 text-stone-400" />
                <span>Preferences & Storage Sync</span>
              </button>

              <button
                onClick={() => toggleTheme()}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-400" />}
                  <span>Theme: {isDark ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 uppercase">
                  {isDark ? 'Dark' : 'Light'}
                </span>
              </button>
            </div>

            {/* User Account Controls */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-stone-200 dark:ring-stone-700"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        {user.fullName}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate">@{user.username}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setActiveView('profile');
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        logout();
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs shadow-xs cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
