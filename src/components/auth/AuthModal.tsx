import React, { useState, useRef } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  MapPin,
  Clock,
  Sparkles,
  Users,
  KeyRound,
  UserPlus,
  X,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PRESET_AVATARS, processStorageImageFile } from '../../utils/imageUpload';

interface AuthModalProps {
  forceOpen?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ forceOpen = false }) => {
  const {
    user,
    registeredAccounts,
    login,
    signup,
    switchAccount,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    setAuthModalTab,
  } = useApp();

  const isOpen = forceOpen || isAuthModalOpen || (!user && isAuthModalOpen);

  // Sign In State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSentMessage, setForgotSentMessage] = useState<string | null>(null);

  // Sign Up State
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [signupFullName, setSignupFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Step 2 profile data
  const [signupOccupation, setSignupOccupation] = useState('Software Engineer & Designer');
  const [signupLocation, setSignupLocation] = useState('San Francisco, CA');
  const [signupBio, setSignupBio] = useState('Committed to daily consistency and mastery.');
  const [signupTimezone, setSignupTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  );
  const [signupDailyHours, setSignupDailyHours] = useState(4);
  const [signupStartTime, setSignupStartTime] = useState('09:00');
  const [signupEndTime, setSignupEndTime] = useState('18:00');

  // Avatar & Image from Storage System
  const [avatarPreview, setAvatarPreview] = useState<string>(PRESET_AVATARS[0].url);
  const [avatarStorageType, setAvatarStorageType] = useState<'uploaded_device' | 'url' | 'preset'>('preset');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSizeKb, setUploadedFileSizeKb] = useState<number | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Image Upload from Local Device Storage System
  const handleDeviceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setIsProcessingImage(true);

    try {
      const result = await processStorageImageFile(file, 400, 0.88);
      setAvatarPreview(result.dataUrl);
      setAvatarStorageType('uploaded_device');
      setUploadedFileName(result.fileName);
      setUploadedFileSizeKb(result.sizeKb);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to process selected image');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Drag & drop handlers
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setImageError(null);
    setIsProcessingImage(true);

    try {
      const result = await processStorageImageFile(file, 400, 0.88);
      setAvatarPreview(result.dataUrl);
      setAvatarStorageType('uploaded_device');
      setUploadedFileName(result.fileName);
      setUploadedFileSizeKb(result.sizeKb);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to process dropped image');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const passwordScore = getPasswordStrength(signupPassword);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your email address or username.');
      return;
    }

    setLoginLoading(true);
    setTimeout(() => {
      const res = login(loginIdentifier.trim(), loginPassword);
      setLoginLoading(false);
      if (!res.success) {
        setLoginError(res.message || 'Login failed. Please check credentials.');
      } else {
        setIsAuthModalOpen(false);
      }
    }, 250);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!agreedTerms) {
      setSignupError('Please accept the Terms of Service to continue.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match. Please re-enter.');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters long.');
      return;
    }

    setSignupLoading(true);
    setTimeout(() => {
      const res = signup({
        fullName: signupFullName,
        username: signupUsername,
        email: signupEmail,
        phone: signupPhone || undefined,
        password: signupPassword,
        occupation: signupOccupation,
        location: signupLocation,
        bio: signupBio,
        timeZone: signupTimezone,
        preferredDailyWorkingHours: signupDailyHours,
        preferredWorkStartTime: signupStartTime,
        preferredWorkEndTime: signupEndTime,
        avatarUrl: avatarPreview,
        avatarStorageType,
      });

      setSignupLoading(false);
      if (!res.success) {
        setSignupError(res.message || 'Registration failed.');
      } else {
        setIsAuthModalOpen(false);
      }
    }, 300);
  };

  // Quick Demo Login Helper
  const handleQuickDemo = (email: string, defaultPass = 'password123') => {
    setLoginIdentifier(email);
    setLoginPassword(defaultPass);
    login(email, defaultPass);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Header */}
        <div className="relative bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 px-6 pt-6 pb-5 border-b border-stone-100 dark:border-stone-800/80">
          {user && (
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-2">
            <img
              src="/logo.svg"
              alt="Daily Task Tracker"
              className="w-11 h-11 rounded-2xl object-contain drop-shadow-xs"
            />
            <div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
                Daily Task Tracker
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Persistent Identity, Goal Architecture & Time Mastery
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 mt-4 p-1 bg-stone-100/90 dark:bg-stone-800/90 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setAuthModalTab('login');
                setLoginError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                authModalTab === 'login'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthModalTab('register');
                setSignupError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                authModalTab === 'register'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthModalTab('switch')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                authModalTab === 'switch'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Accounts</span>
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center">
                {registeredAccounts.length}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* ======================= SIGN IN TAB ======================= */}
          {authModalTab === 'login' && (
            <div>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300 animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Email Address or Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. alex@dailytracker.app or alexrivera"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-stone-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-stone-600 dark:text-stone-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400 accent-amber-500"
                    />
                    <span>Remember active session</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  {loginLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Tracker</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Accounts Picker */}
              <div className="mt-6 pt-5 border-t border-stone-200 dark:border-stone-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Instant 1-Click Access (Saved Profiles)</span>
                </div>

                <div className="space-y-2">
                  {registeredAccounts.slice(0, 3).map((acc) => (
                    <button
                      key={acc.profile.id}
                      type="button"
                      onClick={() => handleQuickDemo(acc.profile.email, acc.passwordHash)}
                      className="w-full p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-800/80 hover:border-amber-500/50 bg-stone-50/70 dark:bg-stone-800/40 hover:bg-amber-500/5 transition-all text-left flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={acc.profile.avatarUrl}
                          alt={acc.profile.fullName}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-stone-200 dark:ring-stone-700"
                        />
                        <div>
                          <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {acc.profile.fullName}
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400">
                            {acc.profile.email} • {acc.profile.occupation || 'Member'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors flex items-center gap-1">
                        Sign In <ChevronRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================= CREATE ACCOUNT TAB ======================= */}
          {authModalTab === 'register' && (
            <div>
              {/* Stepper Header */}
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setSignupStep(1)}
                  className={`flex items-center gap-2 text-xs font-semibold ${
                    signupStep === 1
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center text-[11px]">
                    1
                  </span>
                  <span>Credentials</span>
                </button>
                <div className="h-0.5 flex-1 mx-3 bg-stone-200 dark:bg-stone-800" />
                <button
                  type="button"
                  onClick={() => {
                    if (signupFullName && signupUsername && signupEmail) {
                      setSignupStep(2);
                    }
                  }}
                  className={`flex items-center gap-2 text-xs font-semibold ${
                    signupStep === 2
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center text-[11px]">
                    2
                  </span>
                  <span>Profile & Image</span>
                </button>
              </div>

              <form onSubmit={handleSignupSubmit}>
                {signupError && (
                  <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{signupError}</span>
                  </div>
                )}

                {/* STEP 1: CREDENTIALS */}
                {signupStep === 1 && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={signupFullName}
                          onChange={(e) => {
                            setSignupFullName(e.target.value);
                            if (!signupUsername) {
                              setSignupUsername(
                                e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]/g, '')
                                  .slice(0, 16)
                              );
                            }
                          }}
                          placeholder="e.g. Ahsanur Rahaman"
                          className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Username <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={signupUsername}
                          onChange={(e) =>
                            setSignupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))
                          }
                          placeholder="ahsanur"
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Smartphone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showSignupPassword ? 'text' : 'password'}
                            required
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                            className="p-1 text-stone-400 hover:text-stone-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                          >
                            {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Confirm Password <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Password Strength Meter */}
                    {signupPassword && (
                      <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800">
                        <div className="flex items-center justify-between text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                          <span>Password Strength:</span>
                          <span
                            className={
                              passwordScore <= 1
                                ? 'text-rose-600 font-semibold'
                                : passwordScore === 2
                                ? 'text-amber-600 font-semibold'
                                : 'text-emerald-600 font-semibold'
                            }
                          >
                            {passwordScore <= 1
                              ? 'Weak'
                              : passwordScore === 2
                              ? 'Fair'
                              : passwordScore === 3
                              ? 'Good'
                              : 'Strong'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 h-1.5 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700">
                          <div
                            className={`h-full ${
                              passwordScore >= 1
                                ? passwordScore <= 1
                                  ? 'bg-rose-500'
                                  : passwordScore === 2
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                                : 'bg-transparent'
                            }`}
                          />
                          <div
                            className={`h-full ${
                              passwordScore >= 2
                                ? passwordScore === 2
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                                : 'bg-transparent'
                            }`}
                          />
                          <div
                            className={`h-full ${
                              passwordScore >= 3 ? 'bg-emerald-500' : 'bg-transparent'
                            }`}
                          />
                          <div
                            className={`h-full ${
                              passwordScore >= 4 ? 'bg-emerald-500' : 'bg-transparent'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={!signupFullName || !signupUsername || !signupEmail || !signupPassword}
                      onClick={() => {
                        if (signupPassword !== signupConfirmPassword) {
                          setSignupError('Passwords do not match.');
                          return;
                        }
                        setSignupError(null);
                        setSignupStep(2);
                      }}
                      className="w-full mt-3 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <span>Proceed to Profile & Photo</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* STEP 2: PROFILE & STORAGE SYSTEM IMAGE UPLOAD */}
                {signupStep === 2 && (
                  <div className="space-y-4">
                    {/* Image Input from Storage System */}
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800">
                      <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-amber-500" />
                        <span>Input Profile Image from Storage System</span>
                      </label>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Current Preview */}
                        <div className="relative shrink-0">
                          <img
                            src={avatarPreview}
                            alt="Preview"
                            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-amber-500/80 shadow-md"
                          />
                          {avatarStorageType === 'uploaded_device' && (
                            <span
                              className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-emerald-500 text-stone-950 text-[10px] font-bold rounded-md shadow-xs"
                              title="Loaded from local storage system"
                            >
                              Device
                            </span>
                          )}
                        </div>

                        {/* Upload Controls */}
                        <div className="flex-1 w-full text-center sm:text-left">
                          {/* Hidden File Input */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={handleDeviceImageUpload}
                            className="hidden"
                          />

                          {/* Drop Zone / Browse Button */}
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-xl cursor-pointer transition-colors bg-white/60 dark:bg-stone-900/60 text-center"
                          >
                            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
                              <Upload className="w-3.5 h-3.5 text-amber-500" />
                              <span>Browse Device Storage or Drop Image</span>
                            </div>
                            <p className="text-[10px] text-stone-400 mt-1">
                              Supports JPG, PNG, WEBP • Auto-compressed for instant loading
                            </p>
                          </div>

                          {uploadedFileName && (
                            <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-1">
                              <span className="truncate max-w-[180px]">{uploadedFileName}</span>
                              <span>{uploadedFileSizeKb} KB (Ready)</span>
                            </div>
                          )}

                          {imageError && (
                            <div className="mt-1 text-[11px] text-rose-500">{imageError}</div>
                          )}
                        </div>
                      </div>

                      {/* Preset Avatars Carousel */}
                      <div className="mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-700/80">
                        <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-2">
                          Or select an instant avatar preset:
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {PRESET_AVATARS.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setAvatarPreview(preset.url);
                                setAvatarStorageType('preset');
                                setUploadedFileName(null);
                              }}
                              className={`shrink-0 rounded-xl p-0.5 border-2 transition-all ${
                                avatarPreview === preset.url
                                  ? 'border-amber-500 scale-105 shadow-sm'
                                  : 'border-transparent hover:border-stone-300 dark:hover:border-stone-600'
                              }`}
                            >
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="w-9 h-9 rounded-lg object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Personal Role & Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Role / Occupation
                        </label>
                        <div className="relative">
                          <Briefcase className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={signupOccupation}
                            onChange={(e) => setSignupOccupation(e.target.value)}
                            placeholder="e.g. Full-Stack Engineer"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          City & Country
                        </label>
                        <div className="relative">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={signupLocation}
                            onChange={(e) => setSignupLocation(e.target.value)}
                            placeholder="e.g. Boston, MA"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Productivity & Work Preferences */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                          Daily Goal (Hours)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={16}
                          value={signupDailyHours}
                          onChange={(e) => setSignupDailyHours(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                          Start Work
                        </label>
                        <input
                          type="time"
                          value={signupStartTime}
                          onChange={(e) => setSignupStartTime(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-xs"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                          End Work
                        </label>
                        <input
                          type="time"
                          value={signupEndTime}
                          onChange={(e) => setSignupEndTime(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-xs"
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Personal Bio / Daily Philosophy
                      </label>
                      <textarea
                        rows={2}
                        value={signupBio}
                        onChange={(e) => setSignupBio(e.target.value)}
                        placeholder="Write a brief personal intro or habit objective..."
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                      />
                    </div>

                    {/* Terms Checkbox */}
                    <div className="pt-1">
                      <label className="flex items-start gap-2 cursor-pointer text-xs text-stone-600 dark:text-stone-400">
                        <input
                          type="checkbox"
                          checked={agreedTerms}
                          onChange={(e) => setAgreedTerms(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-stone-300 text-amber-500 accent-amber-500"
                        />
                        <span>
                          I agree to local data persistence rules, cryptographically verified progress tracking, and privacy safeguards.
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSignupStep(1)}
                        className="py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        disabled={signupLoading || !agreedTerms}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {signupLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Creating Profile...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Complete Registration</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ======================= SWITCH ACCOUNTS TAB ======================= */}
          {authModalTab === 'switch' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Registered Accounts on this Device
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Switch active profile seamlessly without losing your track records.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('register');
                    setSignupStep(1);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Account</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {registeredAccounts.map((acc) => {
                  const isActive = user?.id === acc.profile.id;
                  return (
                    <div
                      key={acc.profile.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:border-stone-300 dark:hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={acc.profile.avatarUrl}
                          alt={acc.profile.fullName}
                          className="w-11 h-11 rounded-xl object-cover ring-1 ring-stone-200 dark:ring-stone-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                              {acc.profile.fullName}
                            </span>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                Active Now
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                            {acc.profile.email} • @{acc.profile.username}
                          </div>
                          <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                            {acc.profile.occupation || 'Standard Member'} • {acc.profile.location || 'Global'}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isActive ? (
                          <span className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => switchAccount(acc.profile.id)}
                            className="py-1.5 px-3 rounded-xl bg-stone-200 dark:bg-stone-700 hover:bg-amber-500 hover:text-stone-950 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                          >
                            Switch
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-3 bg-stone-50 dark:bg-stone-950/40 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Local Storage Safe & Offline-First Persistence</span>
          </div>
          <span>v1.2 Secure Client</span>
        </div>
      </div>

      {/* Forgot Password Simulation Dialog */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Password Recovery
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotSentMessage(null);
                }}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSentMessage ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1 inline mr-1" />
                  {forgotSentMessage}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSentMessage(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-stone-950 font-semibold text-xs"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Enter your registered email address or username. A temporary secure access pass will be generated.
                </p>
                <input
                  type="text"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e.g. alex@dailytracker.app"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-[11px] text-amber-800 dark:text-amber-300">
                  <strong>Default Demo Password:</strong> For seeded test accounts, the password is{' '}
                  <code className="px-1 py-0.5 bg-amber-200 dark:bg-amber-900 rounded font-mono font-bold">
                    password123
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (forgotEmail) {
                      setForgotSentMessage(
                        `Reset instructions dispatched to ${forgotEmail}. You can also sign in with 'password123'.`
                      );
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs"
                >
                  Send Reset Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
