import React, { useState, useRef } from 'react';
import {
  User,
  Camera,
  Upload,
  Sparkles,
  Mail,
  Phone,
  Building2,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Twitter,
  AlertCircle,
  CheckCircle2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  processStorageImageFile,
  PRESET_AVATARS,
  generateInitialsAvatar,
} from '../../utils/imageUpload';

interface ProfileEditTabProps {
  user: UserProfile;
  initialSubSection?: 'photo' | 'personal' | 'bio' | 'social';
  onSaved: () => void;
  onCancel: () => void;
}

export const ProfileEditTab: React.FC<ProfileEditTabProps> = ({
  user,
  initialSubSection = 'photo',
  onSaved,
  onCancel,
}) => {
  const { updateProfile } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'photo' | 'personal' | 'bio' | 'social'>(
    initialSubSection
  );

  // Form State
  const [fullName, setFullName] = useState(user.fullName || '');
  const [username, setUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [occupation, setOccupation] = useState(user.occupation || '');
  const [companyOrSchool, setCompanyOrSchool] = useState(user.companyOrSchool || '');
  const [location, setLocation] = useState(user.location || '');
  const [website, setWebsite] = useState(user.website || '');
  const [github, setGithub] = useState(user.github || '');
  const [linkedin, setLinkedin] = useState(user.linkedin || '');
  const [twitter, setTwitter] = useState(user.twitter || '');
  const [bio, setBio] = useState(user.bio || '');

  // Photo & Storage
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [avatarStorageType, setAvatarStorageType] = useState<'uploaded_device' | 'url' | 'preset'>(
    user.avatarStorageType || 'preset'
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSizeKb, setUploadedFileSizeKb] = useState<number | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processAndSetDeviceImage = async (file: File) => {
    setImageError(null);
    setIsProcessingImage(true);

    try {
      const result = await processStorageImageFile(file, 260, 0.85);
      setAvatarUrl(result.dataUrl);
      setAvatarStorageType('uploaded_device');
      setUploadedFileName(result.fileName);
      setUploadedFileSizeKb(result.sizeKb);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to process selected image');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeviceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndSetDeviceImage(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processAndSetDeviceImage(file);
  };

  const handleResetToInitials = () => {
    const initialsSvg = generateInitialsAvatar(fullName || user.fullName);
    setAvatarUrl(initialsSvg);
    setAvatarStorageType('preset');
    setUploadedFileName(null);
    setUploadedFileSizeKb(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim() || user.fullName,
        username: username.trim().toLowerCase() || user.username,
        email: email.trim() || user.email,
        phone: phone.trim(),
        occupation: occupation.trim(),
        companyOrSchool: companyOrSchool.trim(),
        location: location.trim(),
        website: website.trim(),
        github: github.trim().replace(/^@/, ''),
        linkedin: linkedin.trim(),
        twitter: twitter.trim().replace(/^@/, ''),
        bio: bio.trim(),
        avatarUrl,
        avatarStorageType,
      });

      setSavedSuccess(true);
      window.dispatchEvent(
        new CustomEvent('app-notification-event', {
          detail: {
            title: 'Profile Updated',
            body: 'Your identity and profile customizations were saved successfully.',
            type: 'system',
          },
        })
      );
      setTimeout(() => {
        setSavedSuccess(false);
        onSaved();
      }, 700);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 p-2 sm:p-3 overflow-x-auto gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('photo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'photo'
              ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Avatar Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('personal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'personal'
              ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Personal Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('bio')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'bio'
              ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Philosophy & Bio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('social')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'social'
              ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Web & Social</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
        {/* ========================================================================= */}
        {/* 1. AVATAR STUDIO */}
        {/* ========================================================================= */}
        {activeSubTab === 'photo' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Avatar & Profile Photo Studio
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Upload a photo directly from your device, choose an illustrated preset, or generate initials.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800">
              {/* Active Preview */}
              <div className="relative shrink-0">
                <img
                  src={avatarUrl || PRESET_AVATARS[0].url}
                  alt={fullName}
                  className="w-28 h-28 rounded-3xl object-cover ring-4 ring-amber-500/70 shadow-lg bg-stone-200 dark:bg-stone-700"
                />
                {avatarStorageType === 'uploaded_device' && (
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-emerald-500 text-stone-950 font-bold text-[9px] shadow-sm">
                    Device File
                  </span>
                )}
              </div>

              {/* Upload Drop Area */}
              <div className="flex-1 w-full space-y-3">
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
                  className="p-5 border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-2xl cursor-pointer transition-colors bg-white dark:bg-stone-900 text-center group"
                >
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-stone-800 dark:text-stone-200 group-hover:text-amber-600 transition-colors">
                    <Upload className="w-4 h-4 text-amber-500" />
                    <span>Upload Image from Local Device</span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Drag and drop file here, or click to choose from your computer or phone
                  </p>
                  <span className="text-[10px] text-stone-400 block mt-1">
                    Supports JPG, PNG, WEBP • Automatically optimized & saved to local persistence
                  </span>
                </div>

                {uploadedFileName && (
                  <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-1">
                    <span>✓ Ready: {uploadedFileName}</span>
                    <span>{uploadedFileSizeKb} KB</span>
                  </div>
                )}

                {imageError && (
                  <div className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{imageError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleResetToInitials}
                    className="text-xs text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset to Initials Avatar
                  </button>
                </div>
              </div>
            </div>

            {/* Presets Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Or choose an instant illustrated/photo preset:
              </label>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
                {PRESET_AVATARS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(preset.url);
                      setAvatarStorageType('preset');
                      setUploadedFileName(null);
                    }}
                    className={`shrink-0 rounded-2xl p-1 border-2 transition-all cursor-pointer ${
                      avatarUrl === preset.url
                        ? 'border-amber-500 scale-105 shadow-sm'
                        : 'border-transparent hover:border-stone-300 dark:hover:border-stone-600'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Direct URL Fallback */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Or paste a custom image URL:
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
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. PERSONAL DETAILS */}
        {/* ========================================================================= */}
        {activeSubTab === 'personal' && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Personal & Professional Identity
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Your public profile details across certificates, leaderboard, and dossier exports.
              </p>
            </div>

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
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                  className="w-full text-sm font-mono px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                  placeholder="e.g. Senior Software Architect"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Company, Lab, or School
                </label>
                <input
                  type="text"
                  value={companyOrSchool}
                  onChange={(e) => setCompanyOrSchool(e.target.value)}
                  placeholder="e.g. Distributed Systems Lab"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                  placeholder="e.g. Dhaka, Bangladesh or San Francisco, CA"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. PHILOSOPHY & BIO */}
        {/* ========================================================================= */}
        {activeSubTab === 'bio' && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Personal Philosophy & Bio
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Share your daily focus ethos, habit motto, or learning roadmap.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Focus Philosophy / Bio Statement
                </label>
                <span className="text-[11px] text-stone-400 font-mono">
                  {bio.length} / 500
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Continuous improvement over perfection. 1% better every single day..."
                className="w-full text-sm p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. SOCIAL & WEB PRESENCE */}
        {/* ========================================================================= */}
        {activeSubTab === 'social' && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Web & Social Presence Links
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Link your portfolios, GitHub repositories, and professional networks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Personal Website / Portfolio
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://myportfolio.com"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
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
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
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
                  placeholder="e.g. in/alex-rivera"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
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
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-6 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <Check className="w-4 h-4" />
                <span>Profile details saved successfully!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 sm:flex-none px-7 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Saving...' : 'Save All Changes'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
