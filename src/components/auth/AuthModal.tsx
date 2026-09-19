import React, { useState, useRef, useEffect } from 'react';
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
  LogOut,
  Cloud,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PRESET_AVATARS, processStorageImageFile } from '../../utils/imageUpload';
import { ModalPortal } from '../common/ModalPortal';

interface AuthModalProps {
  forceOpen?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ forceOpen = false }) => {
  const {
    user,
    firebaseUser,
    loginWithGoogle,
    login,
    signup,
    resetPassword,
    logout,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    startGuestSession,
    isFirestoreConnected,
  } = useApp();

  const isOpen = forceOpen || isAuthModalOpen;

  useEffect(() => {
    if (!firebaseUser && authModalTab === 'switch') {
      setAuthModalTab('login');
    }
  }, [firebaseUser, authModalTab, setAuthModalTab]);

  // Sign In State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSentMessage, setForgotSentMessage] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Sign Up State
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [signupFullName, setSignupFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Step 2 profile fields
  const [signupOccupation, setSignupOccupation] = useState('');
  const [signupLocation, setSignupLocation] = useState('');
  const [signupBio, setSignupBio] = useState('');
  const [signupTimezone, setSignupTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  );
  const [signupDailyHours, setSignupDailyHours] = useState(4);
  const [signupStartTime, setSignupStartTime] = useState('09:00');
  const [signupEndTime, setSignupEndTime] = useState('18:00');

  // Image Storage & Avatar Selection
  const [avatarPreview, setAvatarPreview] = useState(PRESET_AVATARS[0]);
  const [avatarStorageType, setAvatarStorageType] = useState<'preset' | 'url' | 'uploaded_device'>('preset');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSizeKb, setUploadedFileSizeKb] = useState<number | null>(null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation & Loading
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Escape key dismiss listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsAuthModalOpen]);

  if (!isOpen) return null;

  // File upload handler
  const handleDeviceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processed = await processStorageImageFile(file);
      setAvatarPreview(processed.dataUrl);
      setAvatarStorageType('uploaded_device');
      setUploadedFileName(processed.fileName);
      setUploadedFileSizeKb(processed.sizeKb);
    } catch (err: any) {
      setImageError(err.message || 'Image processing failed');
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setImageError(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      const processed = await processStorageImageFile(file);
      setAvatarPreview(processed.dataUrl);
      setAvatarStorageType('uploaded_device');
      setUploadedFileName(processed.fileName);
      setUploadedFileSizeKb(processed.sizeKb);
    } catch (err: any) {
      setImageError(err.message || 'Image processing failed');
    }
  };

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passwordScore = getPasswordStrength(signupPassword);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your email address or username.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await login(loginIdentifier.trim(), loginPassword);
      if (!res.success) {
        setLoginError(res.message || 'Login failed. Please check your credentials.');
      } else {
        setIsAuthModalOpen(false);
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Authentication error.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginError(null);
    setSignupError(null);
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setLoginError(res.message || 'Google sign-in failed.');
        setSignupError(res.message || 'Google sign-in failed.');
      } else {
        setIsAuthModalOpen(false);
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    // If user is on Step 1, hitting enter or submitting MUST only validate and transition to Step 2!
    if (signupStep === 1) {
      if (!signupFullName.trim()) {
        setSignupError('Please enter your full name.');
        return;
      }
      if (!signupUsername.trim() || signupUsername.trim().length < 3) {
        setSignupError('Username must be at least 3 characters.');
        return;
      }
      if (!signupEmail.trim() || !signupEmail.includes('@')) {
        setSignupError('Please enter a valid email address.');
        return;
      }
      if (signupPassword.length < 6) {
        setSignupError('Password must be at least 6 characters long.');
        return;
      }
      if (signupPassword !== signupConfirmPassword) {
        setSignupError('Passwords do not match. Please re-enter.');
        return;
      }
      // Successfully passed step 1 -> proceed to step 2 for avatar, bio & schedule
      setSignupStep(2);
      return;
    }

    // ONLY in Step 2 does final submission and account creation happen
    if (!agreedTerms) {
      setSignupError('Please accept the Terms of Service to continue.');
      return;
    }

    setSignupLoading(true);
    try {
      const res = await signup({
        fullName: signupFullName.trim(),
        username: signupUsername.trim().toLowerCase(),
        email: signupEmail.trim(),
        phone: signupPhone.trim() || undefined,
        password: signupPassword,
        occupation: signupOccupation.trim() || 'Productivity Practitioner',
        location: signupLocation.trim() || 'Global',
        bio: signupBio.trim() || 'Committed to daily deliberate progress.',
        timeZone: signupTimezone,
        preferredDailyWorkingHours: signupDailyHours,
        preferredWorkStartTime: signupStartTime,
        preferredWorkEndTime: signupEndTime,
        avatarUrl: avatarPreview,
        avatarStorageType,
      });

      if (!res.success) {
        setSignupError(res.message || 'Registration failed.');
      } else {
        setIsAuthModalOpen(false);
        setSignupStep(1);
      }
    } catch (err: any) {
      setSignupError(err?.message || 'Registration failed.');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!forgotEmail.trim()) {
      setForgotSentMessage('Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await resetPassword(forgotEmail.trim());
      if (res.success) {
        setForgotSentMessage(`A password reset link has been dispatched to ${forgotEmail.trim()}. Please check your email.`);
      } else {
        setForgotSentMessage(res.message || 'Could not send reset email. Please verify the address.');
      }
    } catch (err: any) {
      setForgotSentMessage(err?.message || 'Password reset error.');
    } finally {
      setForgotLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn pointer-events-auto"
        onClick={() => setIsAuthModalOpen(false)}
      >
        <div
        className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden max-h-[calc(100dvh-2rem)] sm:max-h-[88vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 px-6 pt-6 pb-5 border-b border-stone-100 dark:border-stone-800/80">
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white bg-white/90 dark:bg-stone-800/90 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 flex items-center justify-center transition-all cursor-pointer z-20 shadow-xs"
            title="Close modal (Esc)"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-3 mb-2 pr-8">
            <img
              src="/logo.svg"
              alt="Daily Task Tracker Logo"
              className="w-11 h-11 object-contain shrink-0 drop-shadow-xs"
            />
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-none">
                  Daily Task
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
                  Tracker
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cloud Sync Active
                </span>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  Real-Time Synchronization
                </span>
              </div>
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

            {user && (
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
                <span>Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {(!user || !firebaseUser) && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="leading-snug">
                <span className="font-bold block text-stone-900 dark:text-stone-100">
                  Account Required
                </span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">
                  Please sign in or create an account to start tracking your daily tasks, focus timers, and deliberate practice.
                </span>
              </div>
            </div>
          )}

          {/* ======================= SIGN IN TAB ======================= */}
          {authModalTab === 'login' && (
            <div className="space-y-4">
              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Real Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loginLoading}
                className="w-full py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-sm flex items-center justify-center gap-3 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
              >
                {googleLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                    <span>Signing in with Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Instant Guest Mode */}
              <button
                id="guest-mode-btn-login"
                type="button"
                onClick={() => startGuestSession()}
                className="w-full mt-2.5 py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-800 dark:text-amber-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Continue as Guest (Explore Demo Routine)</span>
              </button>

              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                <span className="flex-shrink mx-4 text-stone-400 text-xs uppercase tracking-wider font-semibold">
                  or sign in with email
                </span>
                <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                      placeholder="you@example.com or username"
                      autoComplete="username"
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
                      className="text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
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
                      className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
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
                    <span>Remember this session</span>
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
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In with Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-stone-500 dark:text-stone-400 pt-2">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalTab('register')}
                  className="font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </p>
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
                  className={`flex items-center gap-2 text-xs font-semibold cursor-pointer ${
                    signupStep === 1
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      signupStep === 1
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    1
                  </span>
                  <span>Credentials</span>
                </button>

                <div className="h-0.5 flex-1 mx-3 bg-stone-200 dark:bg-stone-800"></div>

                <button
                  type="button"
                  onClick={() => {
                    if (signupFullName && signupEmail && signupPassword.length >= 6) {
                      setSignupStep(2);
                    }
                  }}
                  className={`flex items-center gap-2 text-xs font-semibold cursor-pointer ${
                    signupStep === 2
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      signupStep === 2
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    2
                  </span>
                  <span>Profile & Schedule</span>
                </button>
              </div>

              {signupError && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{signupError}</span>
                </div>
              )}

              {/* Quick Google Sign Up Option */}
              {signupStep === 1 && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Sign up fast with Google</span>
                  </button>

                  <button
                    id="guest-mode-btn-signup"
                    type="button"
                    onClick={() => startGuestSession()}
                    className="w-full mt-2 py-2 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-800 dark:text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Skip for now: Explore Demo as Guest</span>
                  </button>

                  <div className="flex items-center my-3.5">
                    <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                    <span className="flex-shrink mx-3 text-stone-400 text-[11px] uppercase tracking-wider font-semibold">
                      or with email
                    </span>
                    <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                {signupStep === 1 && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={signupFullName}
                            onChange={(e) => {
                              setSignupFullName(e.target.value);
                              if (!signupUsername) {
                                setSignupUsername(
                                  e.target.value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
                                );
                              }
                            }}
                            placeholder="John Doe"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Username *
                        </label>
                        <div className="relative">
                          <span className="text-xs text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 font-mono">@</span>
                          <input
                            type="text"
                            required
                            value={signupUsername}
                            onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                            placeholder="johndoe"
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="john@example.com"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Phone (Optional)
                        </label>
                        <div className="relative">
                          <Smartphone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Password (min 6 chars) *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showSignupPassword ? 'text' : 'password'}
                            required
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-8 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                          >
                            {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showSignupPassword ? 'text' : 'password'}
                            required
                            value={signupConfirmPassword}
                            onChange={(e) => setSignupConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Meter */}
                    {signupPassword && (
                      <div className="pt-1">
                        <div className="flex gap-1 h-1 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                          <div className={`h-full flex-1 ${passwordScore >= 1 ? 'bg-rose-500' : ''}`} />
                          <div className={`h-full flex-1 ${passwordScore >= 2 ? 'bg-amber-500' : ''}`} />
                          <div className={`h-full flex-1 ${passwordScore >= 3 ? 'bg-emerald-500' : ''}`} />
                          <div className={`h-full flex-1 ${passwordScore >= 4 ? 'bg-emerald-600' : ''}`} />
                        </div>
                        <div className="text-[10px] text-stone-400 mt-1">
                          Strength:{' '}
                          {passwordScore <= 1
                            ? 'Weak'
                            : passwordScore <= 2
                            ? 'Moderate'
                            : passwordScore === 3
                            ? 'Strong'
                            : 'Very Secure'}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                    >
                      <span>Continue to Profile Setup (Step 2 of 2)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {signupStep === 2 && (
                  <div className="space-y-4">
                    {/* Step 2 Header Banner */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                      <div className="font-semibold flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-[11px] font-bold">2</span>
                        <span>Step 2 of 2: Profile & Schedule (Final)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSignupStep(1)}
                        className="text-[11px] underline font-medium hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                      >
                        Back to Credentials
                      </button>
                    </div>
                    {/* Image Input from Storage System */}
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800">
                      <label className="block text-xs font-bold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-amber-500" />
                        <span>Profile Picture</span>
                      </label>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative shrink-0">
                          <img
                            src={avatarPreview}
                            alt="Preview"
                            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-amber-500/80 shadow-md"
                          />
                          {avatarStorageType === 'uploaded_device' && (
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-emerald-500 text-stone-950 text-[10px] font-bold rounded-md shadow-xs">
                              Device
                            </span>
                          )}
                        </div>

                        <div className="flex-1 w-full text-center sm:text-left">
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
                            className="p-3 border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-xl cursor-pointer transition-colors bg-white/60 dark:bg-stone-900/60 text-center"
                          >
                            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
                              <Upload className="w-3.5 h-3.5 text-amber-500" />
                              <span>Browse Device Storage or Drop Image</span>
                            </div>
                            <p className="text-[10px] text-stone-400 mt-1">
                              Supports JPG, PNG, WEBP • Auto-compressed for cloud sync
                            </p>
                          </div>

                          {uploadedFileName && (
                            <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-1">
                              <span className="truncate max-w-[180px]">{uploadedFileName}</span>
                              <span>{uploadedFileSizeKb} KB (Ready)</span>
                            </div>
                          )}

                          {imageError && (
                            <p className="text-xs text-rose-500 mt-1">{imageError}</p>
                          )}
                        </div>
                      </div>

                      {/* Preset Avatar Grid */}
                      <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
                        <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-2">
                          Or select a curated avatar:
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {PRESET_AVATARS.map((av, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setAvatarPreview(av);
                                setAvatarStorageType('preset');
                                setUploadedFileName(null);
                              }}
                              className={`w-9 h-9 rounded-xl overflow-hidden ring-2 transition-all shrink-0 cursor-pointer ${
                                avatarPreview === av
                                  ? 'ring-amber-500 scale-105'
                                  : 'ring-transparent hover:ring-stone-300'
                              }`}
                            >
                              <img src={av} alt="Avatar option" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bio & Work Schedule */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Role / Occupation
                        </label>
                        <div className="relative">
                          <Briefcase className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={signupOccupation}
                            onChange={(e) => setSignupOccupation(e.target.value)}
                            placeholder="Software Engineer, Designer, Student"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Location
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={signupLocation}
                            onChange={(e) => setSignupLocation(e.target.value)}
                            placeholder="San Francisco, CA"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Short Bio & Mission
                      </label>
                      <textarea
                        rows={2}
                        value={signupBio}
                        onChange={(e) => setSignupBio(e.target.value)}
                        placeholder="Discipline over motivation. Focused on deep work."
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Daily Focus Goal
                        </label>
                        <select
                          value={signupDailyHours}
                          onChange={(e) => setSignupDailyHours(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value={2}>2 Hours / Day</option>
                          <option value={4}>4 Hours / Day (Standard)</option>
                          <option value={6}>6 Hours / Day (High Output)</option>
                          <option value={8}>8 Hours / Day (Maximum)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Work Window End
                        </label>
                        <input
                          type="time"
                          value={signupEndTime}
                          onChange={(e) => setSignupEndTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-start gap-2 cursor-pointer text-xs text-stone-600 dark:text-stone-400">
                        <input
                          type="checkbox"
                          checked={agreedTerms}
                          onChange={(e) => setAgreedTerms(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-stone-300 text-amber-500 focus:ring-amber-400 accent-amber-500"
                        />
                        <span>
                          I agree to securely synchronize my tasks and track focus time across devices.
                        </span>
                      </label>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSignupStep(1)}
                        className="py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={signupLoading}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md disabled:opacity-70"
                      >
                        {signupLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Creating Account...</span>
                          </>
                        ) : (
                          <>
                            <span>Complete Registration</span>
                            <CheckCircle2 className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ======================= ACCOUNT / SWITCH TAB ======================= */}
          {authModalTab === 'switch' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-500 dark:text-stone-400">
                Manage your authenticated account or switch sessions.
              </div>

              {user ? (
                <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/5 ring-1 ring-amber-500/20 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/80 shadow-md shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                          {user.fullName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold shrink-0">
                          Active User
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
                        {user.email}
                      </p>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 font-mono">
                        UID: {user.id.slice(0, 12)}...
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-500/20 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-white/60 dark:bg-stone-800/60">
                      <span className="text-stone-400 block">Role</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {user.occupation || 'Member'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/60 dark:bg-stone-800/60">
                      <span className="text-stone-400 block">Cloud Status</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Cloud className="w-3 h-3" /> Real-time Synced
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                      }}
                      className="flex-1 py-2 px-3 rounded-xl border border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalTab('login');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Sign In with Other</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-stone-500">No authenticated user session.</p>
                  <button
                    type="button"
                    onClick={() => setAuthModalTab('login')}
                    className="mt-3 py-2 px-4 rounded-xl bg-amber-500 text-stone-950 font-semibold text-xs"
                  >
                    Sign In to an Account
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-3 bg-stone-50 dark:bg-stone-950/40 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-bit Secure Encryption • Cloud Sync</span>
          </div>
          <span className="text-[10px] text-stone-400">Continuous Auto-Sync</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
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
                className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-950 dark:text-stone-400 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer shadow-xs"
                title="Close (Esc)"
                aria-label="Close forgot password modal"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
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
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-stone-950 font-semibold text-xs cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Enter your registered email address. We'll send a password reset link to your inbox.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  disabled={forgotLoading}
                  onClick={handleSendResetEmail}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs cursor-pointer transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {forgotLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </ModalPortal>
  );
};
