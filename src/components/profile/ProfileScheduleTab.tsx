import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Check,
  RotateCcw,
  Sparkles,
  Globe,
} from 'lucide-react';
import { UserProfile, GoalCategory } from '../../types';
import { useApp } from '../../context/AppContext';

interface ProfileScheduleTabProps {
  user: UserProfile;
}

export const ProfileScheduleTab: React.FC<ProfileScheduleTabProps> = ({ user }) => {
  const { updateProfile } = useApp();

  const [preferredHours, setPreferredHours] = useState(user.preferredDailyWorkingHours || 4);
  const [preferredStartTime, setPreferredStartTime] = useState(user.preferredWorkStartTime || '09:00');
  const [preferredEndTime, setPreferredEndTime] = useState(user.preferredWorkEndTime || '18:00');
  const [timeZone, setTimeZone] = useState(user.timeZone || 'UTC');
  const [primaryCategory, setPrimaryCategory] = useState<GoalCategory>(
    user.primaryCategory || 'Coding & Tech'
  );
  const [workingDays, setWorkingDays] = useState<string[]>(
    user.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  );

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleWorkingDay = (day: string) => {
    if (workingDays.includes(day)) {
      if (workingDays.length > 1) {
        setWorkingDays(workingDays.filter((d) => d !== day));
      }
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleSelectSchedulePreset = (type: 'weekdays' | 'everyday' | 'weekends') => {
    if (type === 'weekdays') setWorkingDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    if (type === 'everyday') setWorkingDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    if (type === 'weekends') setWorkingDays(['Sat', 'Sun']);
  };

  const autoDetectTimeZone = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setTimeZone(detected);
    } catch {
      // ignore
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        preferredDailyWorkingHours: Number(preferredHours),
        preferredWorkStartTime: preferredStartTime,
        preferredWorkEndTime: preferredEndTime,
        timeZone,
        primaryCategory,
        workingDays,
      });

      setSavedSuccess(true);
      window.dispatchEvent(
        new CustomEvent('app-notification-event', {
          detail: {
            title: 'Schedule Preferences Saved',
            body: `Daily target set to ${preferredHours}h with ${workingDays.length} active days.`,
            type: 'system',
          },
        })
      );
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update schedule:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
      <form onSubmit={handleSave} className="space-y-8">
        <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>Focus Schedule & Productivity Architecture</span>
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Configure your target daily hours, working window, and active days. These parameters drive your streak calculations, focus notifications, and recovery buffers.
          </p>
        </div>

        {/* 1. Daily Target Hours & Presets */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
            Daily Target Focus Hours
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            {[2, 3, 4, 6, 8].map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => setPreferredHours(hours)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  preferredHours === hours
                    ? 'bg-amber-500 text-stone-950 shadow-sm ring-2 ring-amber-500/30'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {hours} Hours / Day
              </button>
            ))}

            <div className="flex items-center gap-2 pl-2">
              <span className="text-xs text-stone-400">Custom:</span>
              <input
                type="number"
                min={1}
                max={16}
                value={preferredHours}
                onChange={(e) => setPreferredHours(Math.max(1, Math.min(16, Number(e.target.value))))}
                className="w-20 text-xs font-mono font-bold px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-center"
              />
            </div>
          </div>
        </div>

        {/* 2. Focus Hours Window */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
            Daily Focus Window (Start & End Times)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800">
              <span className="text-[11px] font-semibold text-stone-500 block mb-1.5">
                Work Window Start Time
              </span>
              <input
                type="time"
                value={preferredStartTime}
                onChange={(e) => setPreferredStartTime(e.target.value)}
                className="w-full text-sm font-mono font-semibold px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800">
              <span className="text-[11px] font-semibold text-stone-500 block mb-1.5">
                Work Window End Time (Daily Deadline)
              </span>
              <input
                type="time"
                value={preferredEndTime}
                onChange={(e) => setPreferredEndTime(e.target.value)}
                className="w-full text-sm font-mono font-semibold px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>
        </div>

        {/* 3. Active Working Days */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Active Working Days ({workingDays.length} days selected)
            </label>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleSelectSchedulePreset('weekdays')}
                className="px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-semibold"
              >
                Weekdays
              </button>
              <span className="text-stone-300 dark:text-stone-700">•</span>
              <button
                type="button"
                onClick={() => handleSelectSchedulePreset('everyday')}
                className="px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-semibold"
              >
                Every Day
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {allDays.map((day) => {
              const isSelected = workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWorkingDay(day)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 shadow-xs ring-2 ring-amber-500/20'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {day} {isSelected ? '✓' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Timezone & Primary Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Time Zone
              </label>
              <button
                type="button"
                onClick={autoDetectTimeZone}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <Globe className="w-3 h-3" /> Auto-Detect
              </button>
            </div>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="America/Chicago">America/Chicago (CST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Paris">Europe/Paris (CET)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Asia/Dhaka">Asia/Dhaka (BST)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC Universal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Primary Focus Domain
            </label>
            <select
              value={primaryCategory}
              onChange={(e) => setPrimaryCategory(e.target.value as GoalCategory)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="Coding & Tech">Coding & Tech</option>
              <option value="Health & Fitness">Health & Fitness</option>
              <option value="Learning & Language">Learning & Language</option>
              <option value="Reading & Writing">Reading & Writing</option>
              <option value="Mindfulness">Mindfulness</option>
              <option value="Career & Business">Career & Business</option>
              <option value="Creative & Design">Creative & Design</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>

        {/* Save Bar */}
        <div className="pt-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div>
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <Check className="w-4 h-4" />
                <span>Schedule updated successfully!</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-7 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Saving...' : 'Save Schedule Architecture'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
