import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
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
import { WifiOff, RefreshCw } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeView, isOnline, syncPendingCount } = useApp();
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);

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

      {/* Body with Sidebar & Content */}
      <div className="flex-1 flex w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 gap-8 xl:gap-10">
        {/* Left Desktop Sidebar Navigation */}
        <Sidebar onOpenCreateGoal={() => setIsCreateGoalOpen(true)} />

        {/* Dynamic View Route */}
        <main className="flex-1 min-w-0">
          {activeView === 'dashboard' && (
            <DashboardView onOpenCreateGoal={() => setIsCreateGoalOpen(true)} />
          )}
          {activeView === 'goals' && (
            <GoalsView onOpenCreateGoal={() => setIsCreateGoalOpen(true)} />
          )}
          {activeView === 'calendar' && <CalendarView />}
          {activeView === 'time' && <TimeTrackingView />}
          {activeView === 'certificates' && <CertificatesView />}
          {activeView === 'verify' && <VerifyCertificateView />}
          {activeView === 'analytics' && <AnalyticsView />}
          {activeView === 'profile' && <ProfileView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Floating Mini Timer (visible when timer running and modal closed) */}
      <FloatingTimerBar />

      {/* Floating In-App & System Notification Toasts */}
      <NotificationToasts />

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
      <MobileNav onOpenCreateGoal={() => setIsCreateGoalOpen(true)} />
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
