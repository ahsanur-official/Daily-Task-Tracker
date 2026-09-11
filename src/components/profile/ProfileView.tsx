import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Clock,
  Calendar,
  Flame,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  Sparkles,
  Edit3,
  Eye,
  LogOut,
  Users,
  Download,
  Check,
  X,
  ChevronRight,
  ExternalLink,
  Target,
  FileBadge,
} from 'lucide-react';
import { formatSecondsToHuman } from '../../utils/time';
import { processStorageImageFile, PRESET_AVATARS } from '../../utils/imageUpload';
import { exportDataAsJSON } from '../../utils/storage';
import { GoalCategory } from '../../types';

export const ProfileView: React.FC = () => {
  const {
    user,
    updateProfile,
    goals,
    tasks,
    sessions,
    streakInfo,
    analytics,
    certificates,
    openAuthModal,
    logout,
    setActiveView,
    setTargetVerifyId,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'edit'>('overview');

  // Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [companyOrSchool, setCompanyOrSchool] = useState(user?.companyOrSchool || '');
  const [location, setLocation] = useState(user?.location || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [github, setGithub] = useState(user?.github || '');
  const [linkedin, setLinkedin] = useState(user?.linkedin || '');
  const [twitter, setTwitter] = useState(user?.twitter || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [timeZone, setTimeZone] = useState(user?.timeZone || 'UTC');
  const [preferredHours, setPreferredHours] = useState(user?.preferredDailyWorkingHours || 4);
  const [preferredStartTime, setPreferredStartTime] = useState(user?.preferredWorkStartTime || '09:00');
  const [preferredEndTime, setPreferredEndTime] = useState(user?.preferredWorkEndTime || '18:00');
  const [workingDays, setWorkingDays] = useState<string[]>(
    user?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  );
  const [primaryCategory, setPrimaryCategory] = useState<GoalCategory>(
    user?.primaryCategory || 'Coding & Tech'
  );

  // Avatar & Device Storage Image upload state
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [avatarStorageType, setAvatarStorageType] = useState<'uploaded_device' | 'url' | 'preset'>(
    user?.avatarStorageType || 'preset'
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSizeKb, setUploadedFileSizeKb] = useState<number | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep state synced when user changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setOccupation(user.occupation || '');
      setCompanyOrSchool(user.companyOrSchool || '');
      setLocation(user.location || '');
      setWebsite(user.website || '');
      setGithub(user.github || '');
      setLinkedin(user.linkedin || '');
      setTwitter(user.twitter || '');
      setBio(user.bio || '');
      setTimeZone(user.timeZone || 'UTC');
      setPreferredHours(user.preferredDailyWorkingHours || 4);
      setPreferredStartTime(user.preferredWorkStartTime || '09:00');
      setPreferredEndTime(user.preferredWorkEndTime || '18:00');
      setWorkingDays(user.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
      setPrimaryCategory(user.primaryCategory || 'Coding & Tech');
      setAvatarUrl(user.avatarUrl || '');
      setAvatarStorageType(user.avatarStorageType || 'preset');
    }
  }, [user]);

  // Handle Image Upload from Local Device Storage System
  const handleDeviceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setIsProcessingImage(true);

    try {
      const result = await processStorageImageFile(file, 400, 0.88);
      setAvatarUrl(result.dataUrl);
      setAvatarStorageType('uploaded_device');
      setUploadedFileName(result.fileName);
      setUploadedFileSizeKb(result.sizeKb);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to process selected image from device storage');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setImageError(null);
    setIsProcessingImage(true);

    try {
      const result = await processStorageImageFile(file, 400, 0.88);
      setAvatarUrl(result.dataUrl);
      setAvatarStorageType('uploaded_device');
      setUploadedFileName(result.fileName);
      setUploadedFileSizeKb(result.sizeKb);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const toggleWorkingDay = (day: string) => {
    if (workingDays.includes(day)) {
      if (workingDays.length > 1) {
        setWorkingDays(workingDays.filter((d) => d !== day));
      }
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName,
      username,
      email,
      phone: phone || undefined,
      occupation: occupation || undefined,
      companyOrSchool: companyOrSchool || undefined,
      location: location || undefined,
      website: website || undefined,
      github: github || undefined,
      linkedin: linkedin || undefined,
      twitter: twitter || undefined,
      bio,
      avatarUrl,
      avatarStorageType,
      timeZone,
      preferredDailyWorkingHours: Number(preferredHours),
      preferredWorkStartTime: preferredStartTime,
      preferredWorkEndTime: preferredEndTime,
      workingDays,
      primaryCategory,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportData = () => {
    exportDataAsJSON({
      user,
      goals,
      tasks,
      sessions,
      certificates,
    });
  };

  // If no user is logged in
  if (!user) {
    return (
      <div className="w-full max-w-[1400px] mx-auto py-12 px-4 text-center">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            No Active User Profile
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
            Please sign in or create an account to access comprehensive profile metrics, saved goals, and custom settings.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => openAuthModal('login')}
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="py-2.5 px-5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-semibold text-xs transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const activeGoals = goals.filter((g) => g.status === 'active').length;
  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-8 w-full max-w-[1400px] mx-auto pb-16 animate-fadeIn">
      {/* Executive Profile Banner */}
      <div className="relative rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        {/* Banner Top Gradient */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-600/20 relative">
          <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => openAuthModal('switch')}
              className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-stone-900/80 hover:bg-white dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1.5 shadow-xs"
              title="Switch to another saved account"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch Account</span>
            </button>
            <button
              onClick={handleExportData}
              className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-stone-900/80 hover:bg-white dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1.5 shadow-xs"
              title="Export complete tracking dossier (JSON)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1.5 shadow-xs"
              title="Sign out of active profile"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Banner Identity Content */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-14">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            {/* Avatar with storage indicator */}
            <div className="relative">
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-white dark:ring-stone-900 shadow-xl bg-stone-100 dark:bg-stone-800"
              />
              <span
                className={`absolute bottom-1 right-1 px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1 ${
                  user.avatarStorageType === 'uploaded_device'
                    ? 'bg-emerald-500 text-stone-950'
                    : 'bg-amber-500 text-stone-950'
                }`}
                title={
                  user.avatarStorageType === 'uploaded_device'
                    ? 'Image loaded from your local device storage'
                    : 'Profile avatar'
                }
              >
                {user.avatarStorageType === 'uploaded_device' ? (
                  <>
                    <Upload className="w-2.5 h-2.5" /> Device
                  </>
                ) : (
                  <>
                    <Sparkles className="w-2.5 h-2.5" /> Verified
                  </>
                )}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
                  {user.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  {user.accountTier || 'Master Disciplinarian'}
                </span>
              </div>

              <div className="text-sm font-medium text-stone-600 dark:text-stone-300 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span>@{user.username}</span>
                {user.occupation && (
                  <>
                    <span className="text-stone-300 dark:text-stone-700">•</span>
                    <span>{user.occupation}</span>
                  </>
                )}
                {user.location && (
                  <>
                    <span className="text-stone-300 dark:text-stone-700">•</span>
                    <span className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {user.location}
                    </span>
                  </>
                )}
              </div>

              {user.companyOrSchool && (
                <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center justify-center sm:justify-start gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>{user.companyOrSchool}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center justify-center gap-2 pt-2 sm:pt-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Dossier Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'edit'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile & Photo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lifetime KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Current / Best Streak
          </span>
          <div className="text-xl font-bold font-mono text-orange-500 mt-1 flex items-center gap-1.5">
            <Flame className="w-5 h-5 fill-orange-500" />
            <span>{streakInfo.currentStreak}d / {streakInfo.bestStreak}d</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Active / Completed Goals
          </span>
          <div className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 mt-1 flex items-center gap-1.5">
            <Target className="w-5 h-5 text-amber-500" />
            <span>{activeGoals} active • {completedGoals} done</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Total Logged Focus Time
          </span>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
            <Clock className="w-5 h-5" />
            <span>{formatSecondsToHuman(analytics.allTimeSeconds)}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Verified Certificates
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <Award className="w-5 h-5" />
            <span>{certificates.length} credentials</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & DETAILED DOSSIER */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Personal, Schedule & Contact Dossier */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Personal Philosophy & Bio</span>
              </h3>
              <p className="text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-relaxed italic bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800">
                "{user.bio || 'Continuous improvement over perfection. 1% better every single day.'}"
              </p>
            </div>

            {/* Detailed Contact & Identity Information */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Personal & Contact Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                  <span className="text-[11px] font-medium text-stone-400 block mb-0.5">Email Address</span>
                  <div className="text-sm font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                  <span className="text-[11px] font-medium text-stone-400 block mb-0.5">Phone Number</span>
                  <div className="text-sm font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>{user.phone || 'Not specified'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                  <span className="text-[11px] font-medium text-stone-400 block mb-0.5">Location & Timezone</span>
                  <div className="text-sm font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                    <span className="truncate">
                      {user.location || 'Global'} ({user.timeZone})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                  <span className="text-[11px] font-medium text-stone-400 block mb-0.5">Discipline Inception Date</span>
                  <div className="text-sm font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>Member since {user.createdAt || '2026-01-01'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Work Schedule & Productivity Architecture */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Work Schedule & Discipline Parameters</span>
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block mb-0.5">
                      Daily Target
                    </span>
                    <span className="text-lg font-bold text-stone-900 dark:text-stone-100 font-mono">
                      {user.preferredDailyWorkingHours} Hours / Day
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800">
                    <span className="text-[11px] font-semibold text-stone-400 block mb-0.5">
                      Focus Hours Window
                    </span>
                    <span className="text-sm font-bold text-stone-800 dark:text-stone-200 font-mono">
                      {user.preferredWorkStartTime} - {user.preferredWorkEndTime}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800">
                    <span className="text-[11px] font-semibold text-stone-400 block mb-0.5">
                      Primary Domain
                    </span>
                    <span className="text-sm font-bold text-stone-800 dark:text-stone-200 truncate block">
                      {user.primaryCategory || 'Coding & Tech'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-2">
                    Active Working Days Schedule:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {allDays.map((d) => {
                      const isActive = (user.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).includes(d);
                      return (
                        <div
                          key={d}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs'
                              : 'bg-stone-100 dark:bg-stone-800/60 text-stone-400 border border-transparent'
                          }`}
                        >
                          {d} {isActive ? '• Active' : ''}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Earned Verified Certificates Showcase */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Earned Milestone Certificates ({certificates.length})</span>
                </h3>
                <button
                  onClick={() => setActiveView('certificates')}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {certificates.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
                  <p className="text-xs text-stone-400">
                    No milestone certificates earned yet. Complete all tasks across your 15, 30, or 60-day goal to unlock verified proof.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      onClick={() => {
                        setTargetVerifyId(cert.id);
                        setActiveView('verify');
                      }}
                      className="p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 hover:border-amber-500/60 bg-stone-50/50 dark:bg-stone-800/30 hover:bg-amber-500/5 transition-all cursor-pointer group flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileBadge className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {cert.goalTitle}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400">
                          {cert.durationDays} Days • ID: {cert.id}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Cryptographically Verified
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Social Links, Security & Storage Meta */}
          <div className="space-y-6">
            {/* Social & Web Presence */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>Web & Social Presence</span>
              </h3>

              <div className="space-y-2.5">
                {user.website && (
                  <a
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Globe className="w-4 h-4 text-stone-400 group-hover:text-amber-500" />
                      <span className="truncate">{user.website}</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                  </a>
                )}

                {user.github && (
                  <a
                    href={`https://github.com/${user.github.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Github className="w-4 h-4 text-stone-400 group-hover:text-amber-500" />
                      <span className="truncate">github.com/{user.github}</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                  </a>
                )}

                {user.linkedin && (
                  <a
                    href={
                      user.linkedin.startsWith('http')
                        ? user.linkedin
                        : `https://linkedin.com/in/${user.linkedin}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Linkedin className="w-4 h-4 text-stone-400 group-hover:text-amber-500" />
                      <span className="truncate">linkedin.com/in/{user.linkedin}</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                  </a>
                )}

                {user.twitter && (
                  <a
                    href={`https://twitter.com/${user.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Twitter className="w-4 h-4 text-stone-400 group-hover:text-amber-500" />
                      <span className="truncate">@{user.twitter.replace('@', '')}</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                  </a>
                )}

                {!user.website && !user.github && !user.linkedin && !user.twitter && (
                  <p className="text-xs text-stone-400 p-2 text-center">
                    No external links connected yet. Click "Edit Profile" to link your GitHub, LinkedIn, or personal website.
                  </p>
                )}
              </div>
            </div>

            {/* Storage System Status Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Identity & Storage System Status</span>
              </h3>

              <div className="space-y-3 text-xs text-stone-600 dark:text-stone-400">
                <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
                  <span>Image Source:</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200 capitalize">
                    {user.avatarStorageType === 'uploaded_device'
                      ? 'Local Device Storage'
                      : user.avatarStorageType || 'Preset'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
                  <span>Persistence:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synchronized & Offline
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
                  <span>Last Profile Update:</span>
                  <span className="font-mono text-stone-700 dark:text-stone-300">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Today'}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('edit')}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Change Image from Device Storage</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMPREHENSIVE PROFILE EDITOR & STORAGE SYSTEM IMAGE UPLOAD */}
      {/* ========================================================================= */}
      {activeTab === 'edit' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
          <form onSubmit={handleSave} className="space-y-8">
            {/* 1. PHOTO & STORAGE SYSTEM INPUT */}
            <div className="p-6 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>Profile Avatar & Image from Storage System</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Input an image directly from your local device storage, select an avatar preset, or paste a URL.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Image Preview */}
                <div className="relative shrink-0">
                  <img
                    src={avatarUrl || PRESET_AVATARS[0].url}
                    alt={fullName}
                    className="w-28 h-28 rounded-3xl object-cover ring-4 ring-amber-500/70 shadow-lg bg-stone-200 dark:bg-stone-700"
                  />
                  {avatarStorageType === 'uploaded_device' && (
                    <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-emerald-500 text-stone-950 font-bold text-[10px] shadow-sm">
                      Device File
                    </span>
                  )}
                </div>

                {/* Storage System Upload Box */}
                <div className="flex-1 w-full">
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleDeviceImageUpload}
                    className="hidden"
                  />

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-2xl cursor-pointer transition-colors bg-white/70 dark:bg-stone-900/70 text-center group"
                  >
                    <div className="flex items-center justify-center gap-2 text-sm font-bold text-stone-800 dark:text-stone-200 group-hover:text-amber-600 transition-colors">
                      <Upload className="w-4 h-4 text-amber-500" />
                      <span>Input Image from Device Storage System</span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      Drag and drop image here or click to browse files from your computer/phone
                    </p>
                    <div className="text-[11px] text-stone-400 mt-1">
                      Supports JPG, PNG, WEBP • Automatically compressed and scaled
                    </div>
                  </div>

                  {uploadedFileName && (
                    <div className="mt-2 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-1">
                      <span className="truncate max-w-[260px]">✓ Selected: {uploadedFileName}</span>
                      <span>{uploadedFileSizeKb} KB</span>
                    </div>
                  )}

                  {imageError && (
                    <div className="mt-2 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{imageError}</span>
                    </div>
                  )}

                  {/* Direct URL Fallback */}
                  <div className="mt-3">
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Or Image URL:
                    </label>
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => {
                        setAvatarUrl(e.target.value);
                        setAvatarStorageType('url');
                        setUploadedFileName(null);
                      }}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200"
                    />
                  </div>
                </div>
              </div>

              {/* Instant Preset Avatars Selector */}
              <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700/80">
                <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-2">
                  Or choose an instant illustrated/photo preset:
                </span>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(preset.url);
                        setAvatarStorageType('preset');
                        setUploadedFileName(null);
                      }}
                      className={`shrink-0 rounded-2xl p-1 border-2 transition-all ${
                        avatarUrl === preset.url
                          ? 'border-amber-500 scale-105 shadow-sm'
                          : 'border-transparent hover:border-stone-300 dark:hover:border-stone-600'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-11 h-11 rounded-xl object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. PERSONAL IDENTITY & CONTACT */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
                <User className="w-4 h-4 text-amber-500" />
                <span>Personal & Professional Identity</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Role / Professional Title
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Senior Software Engineer & Habit Architect"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Company, Lab, or Institution
                  </label>
                  <input
                    type="text"
                    value={companyOrSchool}
                    onChange={(e) => setCompanyOrSchool(e.target.value)}
                    placeholder="e.g. Distributed Systems Labs"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Location (City & Country)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. BIO & PHILOSOPHY */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Personal Bio & Daily Philosophy
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your personal philosophy, habit goals, or focus philosophy..."
                className="w-full text-sm p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
              />
            </div>

            {/* 4. WORK SCHEDULE & FOCUS PREFERENCES */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Work Schedule & Discipline Targets</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Time Zone
                  </label>
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                    Daily Focus Goal (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={preferredHours}
                    onChange={(e) => setPreferredHours(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Primary Goal Category
                  </label>
                  <select
                    value={primaryCategory}
                    onChange={(e) => setPrimaryCategory(e.target.value as GoalCategory)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Coding & Tech">Coding & Tech</option>
                    <option value="Health & Fitness">Health & Fitness</option>
                    <option value="Learning & Reading">Learning & Reading</option>
                    <option value="Career & Business">Career & Business</option>
                    <option value="Creativity & Art">Creativity & Art</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Work Window Start
                  </label>
                  <input
                    type="time"
                    value={preferredStartTime}
                    onChange={(e) => setPreferredStartTime(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Work Window End
                  </label>
                  <input
                    type="time"
                    value={preferredEndTime}
                    onChange={(e) => setPreferredEndTime(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Working Days Toggles */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  Active Working Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {allDays.map((day) => {
                    const isSelected = workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkingDay(day)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950 shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 5. SOCIAL PRESENCE LINKS */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
                <Globe className="w-4 h-4 text-amber-500" />
                <span>Web & Social Presence Links</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Personal Website / Portfolio
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="e.g. alexrivera"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    LinkedIn Handle or URL
                  </label>
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="e.g. alex-rivera-tech"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Twitter / X Handle
                  </label>
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="e.g. alexrivera_dev"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Actions */}
            <div className="pt-6 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                {savedSuccess ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-4 h-4" />
                    <span>User profile and storage preferences saved successfully!</span>
                  </span>
                ) : (
                  <span className="text-xs text-stone-400">
                    All changes are immediately synced to local persistence storage.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save All Changes</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
