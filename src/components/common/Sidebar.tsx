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
  KeyRound,
  PanelLeftClose,
  PanelLeftOpen,
  Download,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  onOpenCreateGoal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenCreateGoal }) => {
  const {
    activeView,
    setActiveView,
    goals,
    streakInfo,
    user,
    openAuthModal,
    isSidebarCollapsed,
    toggleSidebar,
  } = useApp();

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
    <aside
      className={`hidden md:flex shrink-0 flex-col justify-between border-r border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/60 h-[calc(100vh-4rem)] sticky top-16 select-none sidebar-hardware-transition overflow-hidden px-3.5 py-5 ${
        isSidebarCollapsed ? 'w-20' : 'w-72 lg:w-80'
      }`}
    >
      <div className="space-y-4 w-full">
        {/* Top Header: Collapse / Expand toggle button */}
        <div className="flex items-center justify-between min-h-8 w-full overflow-hidden">
          <span
            className={`text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${
              isSidebarCollapsed
                ? 'opacity-0 max-w-0 pointer-events-none -translate-x-2'
                : 'opacity-100 max-w-32 translate-x-0 px-1'
            }`}
          >
            Navigation
          </span>
          <button
            onClick={toggleSidebar}
            className={`p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-white dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0 ${
              isSidebarCollapsed ? 'mx-auto' : 'ml-auto'
            }`}
            title={isSidebarCollapsed ? 'Expand sidebar (Ctrl/Cmd + B)' : 'Collapse sidebar (icons only)'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-amber-500" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Quick Action: New Goal */}
        <div>
          <button
            onClick={onOpenCreateGoal}
            className={`w-full h-11 flex items-center rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-bold text-sm shadow-sm active:scale-[0.98] transition-colors duration-150 cursor-pointer overflow-hidden ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-3.5'
            }`}
            title={isSidebarCollapsed ? 'Create New Goal' : undefined}
          >
            <Plus className="w-5 h-5 shrink-0 stroke-[2.5]" />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-out font-bold text-sm ${
                isSidebarCollapsed
                  ? 'opacity-0 max-w-0 -translate-x-2 pointer-events-none ml-0'
                  : 'opacity-100 max-w-44 translate-x-0 ml-2.5'
              }`}
            >
              Create New Goal
            </span>
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1 w-full">
          <div
            className={`text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-3.5 mb-1.5 overflow-hidden transition-all duration-200 ease-out whitespace-nowrap ${
              isSidebarCollapsed ? 'opacity-0 max-h-0 mb-0 pointer-events-none' : 'opacity-100 max-h-6'
            }`}
          >
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full h-11 flex items-center rounded-2xl text-sm font-semibold transition-colors duration-150 cursor-pointer relative group overflow-hidden ${
                  isSidebarCollapsed ? 'justify-center px-0' : 'px-3.5'
                } ${
                  isActive
                    ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-white shadow-xs border border-stone-200/80 dark:border-stone-700/60'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-stone-100/80 dark:hover:bg-stone-850'
                }`}
              >
                <div className="flex items-center min-w-0">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors duration-150 ${
                      isActive
                        ? 'text-amber-500'
                        : 'text-stone-400 dark:text-stone-500 group-hover:text-amber-500'
                    }`}
                  />
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${
                      isSidebarCollapsed
                        ? 'opacity-0 max-w-0 -translate-x-3 pointer-events-none ml-0'
                        : 'opacity-100 max-w-44 translate-x-0 ml-3.5'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold shrink-0 transition-all duration-200 ml-auto ${
                      isSidebarCollapsed
                        ? 'opacity-0 max-w-0 pointer-events-none p-0 overflow-hidden'
                        : 'opacity-100'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Badge dot indicator for collapsed mode */}
                {isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-stone-900 transition-opacity duration-200" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Secondary & Footer */}
      <div className="space-y-3.5 pt-3.5 border-t border-stone-200 dark:border-stone-800 w-full overflow-hidden">
        <div className="space-y-1 w-full">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full h-10 flex items-center rounded-2xl text-sm font-medium transition-colors duration-150 cursor-pointer group overflow-hidden ${
                  isSidebarCollapsed ? 'justify-center px-0' : 'px-3.5'
                } ${
                  isActive
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100/70 dark:hover:bg-stone-800/40'
                }`}
              >
                <div className="flex items-center min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                      isActive
                        ? 'text-amber-500'
                        : 'text-stone-400 dark:text-stone-500 group-hover:text-amber-500'
                    }`}
                  />
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${
                      isSidebarCollapsed
                        ? 'opacity-0 max-w-0 -translate-x-3 pointer-events-none ml-0'
                        : 'opacity-100 max-w-44 translate-x-0 ml-3.5'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Optional Install Button */}
        <div className="pt-0.5">
          <PWAInstallButton variant="sidebar" collapsed={isSidebarCollapsed} />
        </div>

        {/* Motivational minimal status card */}
        <div
          onClick={() => setActiveView('calendar')}
          className={`p-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs shadow-2xs cursor-pointer group hover:border-amber-500/40 transition-colors overflow-hidden ${
            isSidebarCollapsed ? 'text-center' : ''
          }`}
          title={`Discipline Streak: ${streakInfo.currentStreak} days`}
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span
              className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${
                isSidebarCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-32'
              }`}
            >
              Daily Discipline
            </span>
            <span className={`font-bold text-amber-600 dark:text-amber-400 font-mono ${isSidebarCollapsed ? 'w-full text-center text-xs' : ''}`}>
              {streakInfo.currentStreak}d{!isSidebarCollapsed && ' Streak'}
            </span>
          </div>
          <div
            className={`w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden transition-all duration-200 ease-out ${
              isSidebarCollapsed ? 'opacity-0 max-h-0 mt-0' : 'opacity-100 max-h-2 mt-2'
            }`}
          >
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(15, (streakInfo.currentStreak / 30) * 100))}%` }}
            />
          </div>
        </div>

        {/* User Account Quick Card */}
        {user ? (
          <div
            onClick={() => setActiveView('profile')}
            className={`rounded-2xl bg-stone-100/80 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 flex items-center cursor-pointer group hover:border-amber-500/50 transition-colors overflow-hidden h-12 ${
              isSidebarCollapsed ? 'justify-center p-1' : 'p-2 gap-2.5'
            }`}
            title={`${user.fullName} (@${user.username})`}
          >
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-8 h-8 rounded-xl object-cover ring-1 ring-stone-200 dark:ring-stone-700 group-hover:ring-amber-500 transition-all shrink-0"
            />
            <div
              className={`min-w-0 flex-1 overflow-hidden transition-all duration-200 ease-out ${
                isSidebarCollapsed
                  ? 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
                  : 'opacity-100 max-w-44 translate-x-0'
              }`}
            >
              <div className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate group-hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                {user.fullName}
              </div>
              <div className="text-[10px] text-stone-400 truncate">
                @{user.username}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className={`w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center transition-colors shadow-xs cursor-pointer overflow-hidden h-10 ${
              isSidebarCollapsed ? 'p-1.5' : 'gap-2 px-3 py-2.5'
            }`}
            title={isSidebarCollapsed ? 'Sign In / Register' : undefined}
          >
            <KeyRound className="w-4 h-4 shrink-0" />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${
                isSidebarCollapsed
                  ? 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
                  : 'opacity-100 max-w-36 translate-x-0'
              }`}
            >
              Sign In / Register
            </span>
          </button>
        )}
      </div>
    </aside>
  );
};
