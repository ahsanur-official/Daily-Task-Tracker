import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { DesktopHamburgerMenu } from './components/common/DesktopHamburgerMenu';
import { MobileNav } from './components/common/MobileNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { GoalsView } from './components/goals/GoalsView';
import { CreateGoalModal } from './components/goals/CreateGoalModal';
import { CalendarView } from './components/calendar/CalendarView';
import { TimeTrackingView } from './components/time/TimeTrackingView';
import { CertificatesView } from './components/certificates/CertificatesView';
import { VerifyCertificateView } from './components/certificates/VerifyCertificateView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { ActiveTimerModal } from './components/timer/ActiveTimerModal';
import { FloatingTimerBar } from './components/timer/FloatingTimerBar';
import { AuthModal } from './components/auth/AuthModal';
import { NotificationToasts } from './components/notifications/NotificationToasts';
import { StreakCelebrationOverlay } from './components/common/StreakCelebration';
import { WifiOff, RefreshCw } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    activeView,
    isOnline,
    syncPendingCount,
    user,
    firebaseUser,
    isAuthLoading,
    isAuthenticated,
    openAuthModal,
  } = useApp();
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);

  // 1. App opening & loading authentication session
  if (isAuthLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 p-4 select-none">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm animate-fadeIn">
          <div className="relative">
            <img
              src="/logo.svg"
              alt="Daily Task Tracker Logo"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md animate-pulse"
            />
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-stone-900 dark:text-stone-100 tracking-tight text-2xl sm:text-3xl leading-none">
              Daily Task
            </span>
            <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-bold tracking-widest uppercase mt-1">
              Tracker
            </span>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-3 font-medium">
              Loading workspace...
            </p>
          </div>
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mt-1" />
        </div>
      </div>
    );
  }

  const handleOpenCreateGoal = () => {
    if (!firebaseUser) {
      openAuthModal('login');
    } else {
      setIsCreateGoalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors selection:bg-amber-500/20 selection:text-amber-900 dark:selection:text-amber-200">
      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-500 text-stone-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-xs shrink-0 z-50">
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode Active — All timers and progress are saved locally to your device</span>
          {syncPendingCount > 0 && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-stone-950/10 px-2 py-0.5 rounded-full">
              <RefreshCw className="w-3 h-3 animate-spin" />
              {syncPendingCount} pending sync
            </span>
          )}
        </div>
      )}

      {/* Top Application Header */}
      <Header />

      {/* Slide-over Desktop Hamburger Navigation Menu */}
      <DesktopHamburgerMenu onOpenCreateGoal={handleOpenCreateGoal} />

      {/* Main Workspace Content Area */}
      <div className="flex-1 flex w-full mx-auto transition-all max-w-[1720px] px-3 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 pb-24 md:pb-6">
        {/* Dynamic View Route */}
        <main className="flex-1 min-w-0 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="gpu-layer"
            >
              {activeView === 'dashboard' && (
                <DashboardView onOpenCreateGoal={handleOpenCreateGoal} />
              )}
              {activeView === 'goals' && (
                <GoalsView onOpenCreateGoal={handleOpenCreateGoal} />
              )}
              {activeView === 'calendar' && <CalendarView />}
              {activeView === 'time' && <TimeTrackingView />}
              {activeView === 'certificates' && <CertificatesView />}
              {activeView === 'verify' && <VerifyCertificateView />}
              {activeView === 'analytics' && <AnalyticsView />}
              {activeView === 'profile' && <ProfileView />}
              {activeView === 'settings' && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Mini Timer (visible when timer running and modal closed) */}
      <FloatingTimerBar />

      {/* Floating In-App & System Notification Toasts */}
      <NotificationToasts />

      {/* Streak Extension Celebration (Growing flame + Confetti) */}
      <StreakCelebrationOverlay soundEnabled={user?.soundEnabled !== false} />

      {/* Distraction-Free Fullscreen / Focused Active Timer Modal */}
      <ActiveTimerModal />

      {/* Authentication & Profile Account Switcher Modal */}
      <AuthModal />

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateGoalOpen}
        onClose={() => setIsCreateGoalOpen(false)}
      />

      {/* Bottom Navigation for Mobile Devices */}
      <MobileNav onOpenCreateGoal={handleOpenCreateGoal} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
