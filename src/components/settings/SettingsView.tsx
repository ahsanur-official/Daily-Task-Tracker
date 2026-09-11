import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  Download,
  Trash2,
  Database,
  Shield,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { exportDataAsJSON, exportSessionsAsCSV } from '../../utils/storage';

export const SettingsView: React.FC = () => {
  const {
    user,
    updateProfile,
    deleteAccount,
    goals,
    tasks,
    sessions,
    certificates,
    todayDate,
    notificationPermission,
    requestNotificationAccess,
    sendTestNotificationAlert,
  } = useApp();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateProfile({ theme });
  };

  const handleExportJSON = () => {
    exportDataAsJSON({
      user,
      goals,
      tasks,
      sessions,
      certificates,
    });
  };

  const handleExportCSV = () => {
    exportSessionsAsCSV(sessions, tasks, goals);
  };

  const handleSoundToggle = () => {
    updateProfile({ soundEnabled: !user?.soundEnabled });
  };

  const handleNotificationToggle = async () => {
    const willEnable = !user?.notificationsEnabled;
    updateProfile({ notificationsEnabled: willEnable });

    if (willEnable && notificationPermission === 'default') {
      await requestNotificationAccess();
    }
  };

  const handleTimerNotifToggle = () => {
    updateProfile({
      timerNotificationsEnabled: user?.timerNotificationsEnabled === false ? true : false,
    });
  };

  const handleDeadlineNotifToggle = () => {
    updateProfile({
      deadlineNotificationsEnabled: user?.deadlineNotificationsEnabled === false ? true : false,
    });
  };

  const handleRequestPermission = async () => {
    await requestNotificationAccess();
  };

  const handleSendTest = () => {
    sendTestNotificationAlert();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="space-y-8 w-full max-w-[1400px] mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          Settings
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Preferences, theme configuration, audio feedback, and data portability.
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Appearance & Theme</span>
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Settings },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = (user?.theme || 'light') === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleThemeChange(t.id as any)}
                  className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                      : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timer Feedback & Notifications */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-500" />
                <span>Timer Feedback & Browser Notifications</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Configure browser notification triggers when timer sessions end or tasks hit their deadlines.
              </p>
            </div>

            {/* Permission Status Pill */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  notificationPermission === 'granted'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                    : notificationPermission === 'denied'
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {notificationPermission === 'granted' ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Permission Granted</span>
                  </>
                ) : notificationPermission === 'denied' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Blocked in Browser</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>Permission Needed</span>
                  </>
                )}
              </span>

              {notificationPermission === 'default' && (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          {/* Test Notification Banner */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-stone-600 dark:text-stone-300">
              <span className="font-semibold text-stone-800 dark:text-stone-200">Test Your Notification Setup: </span>
              Sends a live test notification to verify your browser and OS alert settings.
            </div>
            <button
              type="button"
              onClick={handleSendTest}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                testSent
                  ? 'bg-emerald-500 text-white'
                  : 'bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{testSent ? 'Notification Triggered!' : 'Send Test Notification'}</span>
            </button>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {/* Master Notification Toggle */}
            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Allow Browser Notifications
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  Enable alerts for timer events, streaks, and scheduled task deadlines.
                </div>
              </div>
              <button
                type="button"
                onClick={handleNotificationToggle}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  user?.notificationsEnabled ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    user?.notificationsEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Timer Session Completion Notification */}
            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Timer Session End Notifications
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  Trigger an instant alert when a timer reaches its required target duration or ends.
                </div>
              </div>
              <button
                type="button"
                disabled={!user?.notificationsEnabled}
                onClick={handleTimerNotifToggle}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  !user?.notificationsEnabled
                    ? 'opacity-40 cursor-not-allowed bg-stone-300 dark:bg-stone-700'
                    : user?.timerNotificationsEnabled !== false
                    ? 'bg-amber-500 cursor-pointer'
                    : 'bg-stone-300 dark:bg-stone-700 cursor-pointer'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    user?.timerNotificationsEnabled !== false ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Task Deadline Notifications */}
            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Task Deadline Alerts</span>
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  Trigger an alert when an uncompleted task hits its scheduled cutoff time today.
                </div>
              </div>
              <button
                type="button"
                disabled={!user?.notificationsEnabled}
                onClick={handleDeadlineNotifToggle}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  !user?.notificationsEnabled
                    ? 'opacity-40 cursor-not-allowed bg-stone-300 dark:bg-stone-700'
                    : user?.deadlineNotificationsEnabled !== false
                    ? 'bg-amber-500 cursor-pointer'
                    : 'bg-stone-300 dark:bg-stone-700 cursor-pointer'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    user?.deadlineNotificationsEnabled !== false ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Target Reached Audio Chime */}
            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Target Reached Completion Chime</span>
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  Play harmonic audio chord when required task duration is achieved.
                </div>
              </div>
              <button
                type="button"
                onClick={handleSoundToggle}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  user?.soundEnabled ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    user?.soundEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data Portability (Prompt Section 40) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-500" />
            <span>Data Export & Portability</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Download your raw productivity database including all goals, tasks, recorded timestamped sessions, and certificates.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Everything (JSON)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Sessions (CSV)</span>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-3xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 space-y-4">
          <h2 className="text-base font-bold text-red-900 dark:text-red-200 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Danger Zone</span>
          </h2>
          <p className="text-xs text-red-800/80 dark:text-red-300">
            Resetting or deleting your account will erase all locally stored sessions, goals, streaks, and certificates permanently.
          </p>

          <div>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Reset Database & Delete Account
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={deleteAccount}
                  className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold"
                >
                  Yes, Delete Everything Permanently
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
