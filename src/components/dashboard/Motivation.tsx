import React, { useState, useEffect, useMemo } from 'react';
import {
  Quote,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  Heart,
  Bookmark,
  ChevronDown,
  ChevronUp,
  X,
  Flame,
  Lightbulb,
  CheckCircle2,
  Trash2,
  Share2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getDailyQuote,
  PREDEFINED_QUOTES,
  DailyQuoteItem,
} from '../../data/quotes';

interface MotivationProps {
  todayDate?: string;
  className?: string;
}

const CATEGORY_PROMPTS: Record<
  string,
  { prompt: string; actionTip: string; colorScheme: { bg: string; text: string; border: string; accent: string } }
> = {
  Focus: {
    prompt: 'What is the single highest-leverage task you will protect from interruptions today?',
    actionTip: 'Close extraneous tabs and dedicate your first session to single-tasking.',
    colorScheme: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800/80',
      accent: 'text-blue-500',
    },
  },
  Discipline: {
    prompt: 'Which uncomfortable or postponed task will you execute before fatigue sets in?',
    actionTip: 'Prioritize the hardest task first thing in the morning to unlock mental clarity.',
    colorScheme: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800/80',
      accent: 'text-purple-500',
    },
  },
  Consistency: {
    prompt: 'What is your non-negotiable minimum baseline effort to protect your streak today?',
    actionTip: 'Even 15 focused minutes keeps your neural pathways and self-identity unbroken.',
    colorScheme: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/80',
      accent: 'text-emerald-500',
    },
  },
  Resilience: {
    prompt: 'When unexpected distractions or friction arise today, what is your reset protocol?',
    actionTip: 'Never let one interrupted session derail the day. Take a breath and restart cleanly.',
    colorScheme: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/80',
      accent: 'text-amber-500',
    },
  },
  Growth: {
    prompt: 'What refined technique, skill, or workflow tweak will you test in today’s sessions?',
    actionTip: 'Deliberate practice means noticing where you stall and iterating on your system.',
    colorScheme: {
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-200 dark:border-teal-800/80',
      accent: 'text-teal-500',
    },
  },
  Mindset: {
    prompt: 'How will you frame today’s focused work as a privilege rather than an obligation?',
    actionTip: 'Keep your long-term vision in mind: daily discipline builds future freedom.',
    colorScheme: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800/80',
      accent: 'text-indigo-500',
    },
  },
  Action: {
    prompt: 'What tiny 2-minute step will you take right now to break initial inertia?',
    actionTip: 'Action creates motivation, not the other way around. Start the timer for 5 minutes.',
    colorScheme: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800/80',
      accent: 'text-rose-500',
    },
  },
};

const FAVORITES_STORAGE_KEY = 'dt_favorite_quotes_v1';
const INTENTION_PREFIX = 'dt_daily_intention_';

export const Motivation: React.FC<MotivationProps> = ({ todayDate, className = '' }) => {
  const { streakInfo, todayProgress } = useApp();
  const effectiveDate = todayDate || new Date().toISOString().split('T')[0];

  const defaultQuote = useMemo(() => getDailyQuote(effectiveDate), [effectiveDate]);
  const [currentQuote, setCurrentQuote] = useState<DailyQuoteItem>(defaultQuote);
  const [copied, setCopied] = useState(false);
  const [isCustomIndex, setIsCustomIndex] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState<DailyQuoteItem[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Daily Intention state
  const [dailyIntention, setDailyIntention] = useState<string>(() => {
    try {
      return localStorage.getItem(`${INTENTION_PREFIX}${effectiveDate}`) || '';
    } catch {
      return '';
    }
  });
  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [intentionInput, setIntentionInput] = useState('');
  const [intentionSavedToast, setIntentionSavedToast] = useState(false);

  // Sync quote when date changes
  useEffect(() => {
    const q = getDailyQuote(effectiveDate);
    setCurrentQuote(q);
    setIsCustomIndex(false);
    try {
      const storedIntention = localStorage.getItem(`${INTENTION_PREFIX}${effectiveDate}`) || '';
      setDailyIntention(storedIntention);
      setIntentionInput(storedIntention);
    } catch {
      // Ignore storage error
    }
  }, [effectiveDate]);

  // Persist favorites
  const isCurrentFavorite = useMemo(
    () => favorites.some((f) => f.id === currentQuote.id),
    [favorites, currentQuote.id]
  );

  const toggleFavorite = () => {
    let nextFavorites: DailyQuoteItem[];
    if (isCurrentFavorite) {
      nextFavorites = favorites.filter((f) => f.id !== currentQuote.id);
    } else {
      nextFavorites = [currentQuote, ...favorites.filter((f) => f.id !== currentQuote.id)];
    }
    setFavorites(nextFavorites);
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextFavorites));
    } catch (e) {
      console.warn('Failed to save quote to favorites', e);
    }
  };

  const removeFavoriteById = (id: number) => {
    const nextFavorites = favorites.filter((f) => f.id !== id);
    setFavorites(nextFavorites);
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextFavorites));
    } catch (e) {
      console.warn('Failed to update favorites', e);
    }
  };

  const handleCopy = async () => {
    const textToCopy = `"${currentQuote.quote}" — ${currentQuote.author}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.warn('Failed to copy to clipboard', err);
    }
  };

  const handleNextQuote = () => {
    const currentIndex = PREDEFINED_QUOTES.findIndex((q) => q.id === currentQuote.id);
    const nextIndex = (currentIndex + 1) % PREDEFINED_QUOTES.length;
    setCurrentQuote(PREDEFINED_QUOTES[nextIndex]);
    setIsCustomIndex(true);
    setCopied(false);
  };

  const handleResetToToday = () => {
    setCurrentQuote(defaultQuote);
    setIsCustomIndex(false);
    setCopied(false);
  };

  const handleSaveIntention = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = intentionInput.trim();
    setDailyIntention(clean);
    setIsEditingIntention(false);
    try {
      if (clean) {
        localStorage.setItem(`${INTENTION_PREFIX}${effectiveDate}`, clean);
      } else {
        localStorage.removeItem(`${INTENTION_PREFIX}${effectiveDate}`);
      }
      setIntentionSavedToast(true);
      setTimeout(() => setIntentionSavedToast(false), 2500);
    } catch {
      // Ignore storage error
    }
  };

  const categoryMeta =
    CATEGORY_PROMPTS[currentQuote.category] || CATEGORY_PROMPTS.Focus;

  // Render minimal collapsed banner
  if (isCollapsed) {
    return (
      <div
        id="motivation-collapsed-banner"
        className={`flex items-center justify-between px-4 py-3 rounded-2xl bg-amber-500/5 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300 transition-all ${className}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider text-[10px]">
            Daily Motivation
          </span>
          <span className="text-stone-300 dark:text-stone-700">|</span>
          <span className="truncate italic">"{currentQuote.quote}"</span>
          <span className="font-semibold text-stone-400 shrink-0 hidden sm:inline">
            — {currentQuote.author}
          </span>
        </div>
        <button
          id="motivation-expand-btn"
          onClick={() => setIsCollapsed(false)}
          className="ml-2 px-3 py-1 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer shrink-0"
        >
          Expand
        </button>
      </div>
    );
  }

  return (
    <div
      id="motivation-card"
      className={`relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs p-5 sm:p-7 transition-all ${className}`}
    >
      {/* Background Decorative Quote Mark */}
      <div className="absolute -right-4 -bottom-6 text-stone-100 dark:text-stone-800/30 pointer-events-none select-none">
        <Quote className="w-32 h-32 stroke-[1] opacity-70" />
      </div>

      <div className="relative z-10 space-y-4 sm:space-y-5">
        {/* Top bar: Category Badge, Daily Motivation Label, Streak Spark & Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800/80 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Daily Motivation</span>
            </span>

            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${categoryMeta.colorScheme.bg} ${categoryMeta.colorScheme.text} ${categoryMeta.colorScheme.border}`}
            >
              {currentQuote.category}
            </span>

            {streakInfo && streakInfo.currentStreak > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Day {streakInfo.currentStreak} Momentum</span>
              </span>
            )}

            {isCustomIndex && (
              <button
                id="motivation-reset-quote-btn"
                onClick={handleResetToToday}
                className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 underline underline-offset-2 transition-colors cursor-pointer ml-1"
                title="Return to today's scheduled quote"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Today’s Quote</span>
              </button>
            )}
          </div>

          {/* Right Action Icons: Favorites list, next, collapse */}
          <div className="flex items-center gap-1.5">
            {favorites.length > 0 && (
              <button
                id="motivation-open-favorites-btn"
                onClick={() => setShowFavoritesModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800 transition-colors"
                title="View saved favorite quotes"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
                <span className="hidden sm:inline">Saved</span>
                <span className="px-1.5 py-0.2 rounded-full bg-stone-100 dark:bg-stone-800 text-[10px] font-bold">
                  {favorites.length}
                </span>
              </button>
            )}

            <button
              id="motivation-collapse-btn"
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Minimize quote"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Quote & Author Section */}
        <div className="space-y-2.5 pr-2">
          <blockquote className="text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100 italic leading-relaxed tracking-tight">
            "{currentQuote.quote}"
          </blockquote>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-500 dark:text-stone-400">
            <span className="w-4 h-0.5 bg-amber-500 rounded-full inline-block" />
            <cite className="not-italic font-bold text-stone-800 dark:text-stone-200">
              {currentQuote.author}
            </cite>
          </div>
        </div>

        {/* Interactive Controls Row: Favorite, Copy, Next Spark, Toggle Reflection */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            {/* Favorite / Bookmark */}
            <button
              id="motivation-favorite-btn"
              onClick={toggleFavorite}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                isCurrentFavorite
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 shadow-xs'
                  : 'bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 border-stone-200/80 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
              title={isCurrentFavorite ? 'Saved in favorites' : 'Save to favorites'}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isCurrentFavorite ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
              <span>{isCurrentFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>

            {/* Copy Button */}
            <button
              id="motivation-copy-btn"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : 'bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 border-stone-200/80 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
              title="Copy quote and citation"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Reflection / Action Prompt Accordion Toggle */}
            <button
              id="motivation-toggle-reflection-btn"
              onClick={() => setShowReflection(!showReflection)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                showReflection
                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 border-stone-200/80 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>{showReflection ? 'Hide Reflection' : 'Daily Reflection'}</span>
              {showReflection ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* Next Quote / Spark button */}
          <button
            id="motivation-next-btn"
            onClick={handleNextQuote}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-all cursor-pointer"
            title="Inspire me with another quote"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Next Spark</span>
          </button>
        </div>

        {/* Collapsible Action Prompt / Reflection Box */}
        {showReflection && (
          <div
            id="motivation-reflection-card"
            className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  {currentQuote.category} Reflection
                </h4>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 font-medium leading-snug">
                  {categoryMeta.prompt}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Action Tip: </span>
                  {categoryMeta.actionTip}
                </p>
              </div>
            </div>

            {/* Daily Micro-Intention */}
            <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
              {dailyIntention && !isEditingIntention ? (
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                        Today’s Intention Anchor
                      </span>
                      <p className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate">
                        {dailyIntention}
                      </p>
                    </div>
                  </div>
                  <button
                    id="motivation-edit-intention-btn"
                    onClick={() => {
                      setIntentionInput(dailyIntention);
                      setIsEditingIntention(true);
                    }}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveIntention} className="space-y-2">
                  <label
                    htmlFor="motivation-intention-input"
                    className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider block"
                  >
                    Set a 1-Line Intention for Today
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="motivation-intention-input"
                      type="text"
                      value={intentionInput}
                      onChange={(e) => setIntentionInput(e.target.value)}
                      placeholder="e.g., Complete 3 deep-work sessions without phone check"
                      maxLength={120}
                      className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                    <button
                      id="motivation-commit-btn"
                      type="submit"
                      className="px-3.5 py-1.5 rounded-xl bg-stone-900 dark:bg-amber-500 hover:bg-stone-800 dark:hover:bg-amber-400 text-white dark:text-stone-950 text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Commit
                    </button>
                    {isEditingIntention && (
                      <button
                        type="button"
                        onClick={() => setIsEditingIntention(false)}
                        className="px-2 py-1.5 rounded-xl text-xs font-medium text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}

              {intentionSavedToast && (
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Intention locked in for today!</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Saved Favorites Modal */}
      {showFavoritesModal && (
        <div
          id="motivation-favorites-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Saved Motivational Sparks ({favorites.length})
                </h3>
              </div>
              <button
                id="motivation-close-favorites-btn"
                onClick={() => setShowFavoritesModal(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 divide-y divide-stone-100 dark:divide-stone-800">
              {favorites.map((fav) => (
                <div key={fav.id} className="pt-3 first:pt-0 space-y-2 group">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {fav.category}
                    </span>
                    <button
                      onClick={() => removeFavoriteById(fav.id)}
                      className="p-1 text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-sm font-medium text-stone-800 dark:text-stone-200 italic">
                    "{fav.quote}"
                  </p>
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                    — {fav.author}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setCurrentQuote(fav);
                        setIsCustomIndex(true);
                        setShowFavoritesModal(false);
                      }}
                      className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      Set as active quote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Motivation;
