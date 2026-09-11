import React from 'react';
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
  Users,
  KeyRound,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  onOpenCreateGoal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenCreateGoal }) => {
  const { activeView, setActiveView, goals, streakInfo, user, openAuthModal } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'goals', label: 'Goals', icon: Target, badge: goals.filter((g) => g.status === 'active').length },
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
    <aside className="hidden md:flex w-72 lg:w-80 shrink-0 flex-col justify-between border-r border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/60 p-5 h-[calc(100vh-4rem)] sticky top-16 select-none transition-all">
      <div className="space-y-6">
        {/* Quick Action: New Goal */}
        <div>
          <button
            onClick={onOpenCreateGoal}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-bold text-sm shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Goal</span>
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1.5">
          <div className="text-[11px] font-bold text-stone-400 dark:text-stone-500 px-3.5 uppercase tracking-wider mb-2">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-white shadow-sm border border-stone-200/80 dark:border-stone-700/60'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-stone-100/80 dark:hover:bg-stone-850'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-amber-500' : 'text-stone-400 dark:text-stone-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Secondary & Footer */}
      <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-stone-800">
        <div className="space-y-1">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100/70 dark:hover:bg-stone-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Motivational minimal status card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1.5">
            <span className="font-medium">Daily Discipline</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
              {streakInfo.currentStreak}d Streak
            </span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(15, (streakInfo.currentStreak / 30) * 100))}%` }}
            />
          </div>
        </div>

        {/* User Account Quick Card */}
        {user ? (
          <div className="p-3 rounded-2xl bg-stone-100/80 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2.5">
            <div
              onClick={() => setActiveView('profile')}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
            >
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-8 h-8 rounded-xl object-cover ring-1 ring-stone-200 dark:ring-stone-700 group-hover:ring-amber-500 transition-all shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {user.fullName}
                </div>
                <div className="text-[10px] text-stone-400 truncate">
                  @{user.username}
                </div>
              </div>
            </div>

            <button
              onClick={() => openAuthModal('switch')}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
              title="Switch user account"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </aside>
  );
};
