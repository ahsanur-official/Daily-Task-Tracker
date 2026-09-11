import React, { useState, useEffect } from 'react';
import {
  Quote,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { getDailyQuote, PREDEFINED_QUOTES, DailyQuoteItem } from '../../data/quotes';

interface DailyQuoteProps {
  todayDate?: string;
  className?: string;
}

export const DailyQuote: React.FC<DailyQuoteProps> = ({ todayDate, className = '' }) => {
  const defaultQuote = getDailyQuote(todayDate);
  const [currentQuote, setCurrentQuote] = useState<DailyQuoteItem>(defaultQuote);
  const [copied, setCopied] = useState(false);
  const [isCustomIndex, setIsCustomIndex] = useState(false);

  // Update when date changes
  useEffect(() => {
    const q = getDailyQuote(todayDate);
    setCurrentQuote(q);
    setIsCustomIndex(false);
  }, [todayDate]);

  const handleCopy = async () => {
    const textToCopy = `"${currentQuote.quote}" — ${currentQuote.author}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for iframe restrictions
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
      setTimeout(() => setCopied(false), 2000);
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

  const categoryColors: Record<string, string> = {
    Focus: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    Discipline: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    Consistency: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    Resilience: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    Growth: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    Mindset: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    Action: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };

  const badgeStyle = categoryColors[currentQuote.category] || categoryColors.Focus;

  return (
    <div
      id="daily-quote-card"
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-stone-50 via-white to-amber-50/30 dark:from-stone-900/90 dark:via-stone-900 dark:to-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs p-5 sm:p-6 transition-all ${className}`}
    >
      {/* Subtle Background Decorative Quote Watermark */}
      <div className="absolute -right-3 -bottom-6 text-stone-100 dark:text-stone-800/40 pointer-events-none select-none">
        <Quote className="w-28 h-28 stroke-[1] opacity-60" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Quote Content */}
        <div className="space-y-2.5 flex-1 pr-2">
          {/* Header row: Badge and Label */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Daily Motivation</span>
            </span>

            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badgeStyle}`}
            >
              {currentQuote.category}
            </span>

            {isCustomIndex && (
              <button
                onClick={handleResetToToday}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 underline underline-offset-2 transition-colors cursor-pointer ml-1"
                title="Return to today's scheduled quote"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset to Today</span>
              </button>
            )}
          </div>

          {/* Quote Text */}
          <blockquote className="text-sm sm:text-base font-medium text-stone-800 dark:text-stone-200 italic leading-relaxed tracking-tight">
            "{currentQuote.quote}"
          </blockquote>

          {/* Author */}
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-stone-400">
            <span className="w-4 h-0.5 bg-amber-500/80 rounded-full inline-block" />
            <cite className="not-italic font-bold text-stone-700 dark:text-stone-300">
              {currentQuote.author}
            </cite>
          </div>
        </div>

        {/* Action Controls: Copy to Clipboard & Next Quote */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
          {/* Next Quote Button */}
          <button
            onClick={handleNextQuote}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800/80 transition-all cursor-pointer"
            title="Browse next quote"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden xs:inline">Next</span>
          </button>

          {/* Copy to Clipboard Button */}
          <button
            id="copy-daily-quote-btn"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-stone-950 scale-102 ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700'
            }`}
            title="Copy quote to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Quote</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
