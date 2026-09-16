import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Sparkles, X, CheckCircle2, Zap } from 'lucide-react';
import { playStreakExtendedSound } from '../../utils/audio';

export interface StreakCelebrationDetail {
  id: string;
  streak: number;
  taskTitle?: string;
  isFirstDay?: boolean;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rot: number;
  scale: number;
  color: string;
  shape: 'square' | 'circle' | 'pill' | 'sparkle';
  duration: number;
  delay: number;
}

const CONFETTI_COLORS = [
  '#f59e0b', // Amber 500
  '#f97316', // Orange 500
  '#ef4444', // Rose/Red 500
  '#10b981', // Emerald 500
  '#8b5cf6', // Violet 500
  '#eab308', // Yellow 500
  '#38bdf8', // Sky 400
  '#ec4899', // Pink 500
];

export const StreakCelebrationOverlay: React.FC<{
  soundEnabled?: boolean;
}> = ({ soundEnabled = true }) => {
  const [celebration, setCelebration] = useState<StreakCelebrationDetail | null>(null);

  const dismissTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<StreakCelebrationDetail>;
      if (!customEvent.detail) return;

      const detail = {
        ...customEvent.detail,
        id: customEvent.detail.id || `streak-celeb-${Date.now()}`,
      };

      setCelebration(detail);

      if (soundEnabled) {
        playStreakExtendedSound();
      }

      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
      dismissTimeoutRef.current = setTimeout(() => {
        setCelebration((curr) => (curr?.id === detail.id ? null : curr));
      }, 4800);
    };

    window.addEventListener('app-streak-celebration', handleTrigger);
    return () => {
      window.removeEventListener('app-streak-celebration', handleTrigger);
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [soundEnabled]);

  // Generate 28 deterministic confetti particles when celebration triggers
  const particles: ConfettiParticle[] = useMemo(() => {
    if (!celebration) return [];
    return Array.from({ length: 32 }, (_, i) => {
      const angle = (i / 32) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const distance = 80 + Math.random() * 110;
      const shapes: ConfettiParticle['shape'][] = ['square', 'circle', 'pill', 'sparkle'];
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 20 + Math.random() * 30, // slight upward bias
        rot: Math.random() * 540 - 270,
        scale: 0.6 + Math.random() * 0.7,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        shape: shapes[i % shapes.length],
        duration: 0.85 + Math.random() * 0.5,
        delay: Math.random() * 0.12,
      };
    });
  }, [celebration?.id]);

  return (
    <AnimatePresence>
      {celebration && (
        <div key="streak-overlay" className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
        {/* Subtle Backdrop Glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-stone-950/20 backdrop-blur-[2px] pointer-events-auto"
          onClick={() => setCelebration(null)}
        />

        {/* Central Celebratory Floating Card */}
        <motion.div
          key={celebration.id}
          initial={{ scale: 0.7, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 24,
          }}
          className="relative pointer-events-auto w-full max-w-sm rounded-3xl p-6 bg-white/95 dark:bg-stone-900/95 border-2 border-orange-400/50 dark:border-orange-500/40 shadow-2xl backdrop-blur-xl text-center overflow-visible"
        >
          {/* Confetti Explosion Layer Originating from Behind Flame */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-0 h-0">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  opacity: [1, 1, 0.9, 0],
                  scale: [0, p.scale, p.scale * 0.8, 0],
                  rotate: p.rot,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: p.shape === 'pill' ? '12px' : p.shape === 'sparkle' ? '10px' : '8px',
                  height: p.shape === 'pill' ? '6px' : '8px',
                  borderRadius: p.shape === 'circle' ? '9999px' : p.shape === 'pill' ? '9999px' : '2px',
                  backgroundColor: p.color,
                  boxShadow: `0 0 8px ${p.color}80`,
                }}
              />
            ))}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => setCelebration(null)}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close celebration"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Growing Flame Icon with Radiating Energy Rings */}
          <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            {/* Outer Expanding Energy Rings */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0.8 }}
              animate={{
                scale: [0.7, 1.4, 1.8],
                opacity: [0.8, 0.4, 0],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                repeatDelay: 0.4,
                ease: 'easeOut',
              }}
              className="absolute inset-0 rounded-full bg-radial from-amber-500/40 via-orange-500/20 to-transparent blur-xs pointer-events-none"
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0.9 }}
              animate={{
                scale: [0.6, 1.2, 1.5],
                opacity: [0.9, 0.3, 0],
              }}
              transition={{
                duration: 1.6,
                delay: 0.3,
                repeat: Infinity,
                repeatDelay: 0.4,
                ease: 'easeOut',
              }}
              className="absolute inset-0 rounded-full bg-radial from-orange-500/40 via-rose-500/20 to-transparent blur-xs pointer-events-none"
            />

            {/* Glowing Flame Base Container with Spring Pop */}
            <motion.div
              initial={{ scale: 0.2, rotate: -25 }}
              animate={{
                scale: [0.2, 1.35, 1.1, 1.18, 1.15],
                rotate: [-25, 10, -8, 4, 0],
              }}
              transition={{
                duration: 0.7,
                type: 'spring',
                stiffness: 300,
                damping: 14,
              }}
              className="relative w-18 h-18 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-lg shadow-orange-500/30 flex items-center justify-center"
            >
              <div className="w-full h-full rounded-[22px] bg-stone-950/20 backdrop-blur-xs flex items-center justify-center relative overflow-hidden">
                {/* Flame Icon with subtle continuous breathing animation */}
                <motion.div
                  animate={{
                    scale: [1, 1.12, 1, 1.08, 1],
                    rotate: [0, -3, 3, -2, 0],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Flame className="w-10 h-10 text-amber-200 fill-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
                </motion.div>

                {/* Rising Sparks inside container */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: [0, 1, 0], y: [-4, -18] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                  className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-yellow-200 blur-[0.5px]"
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: [0, 1, 0], y: [-2, -16] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: 0.6 }}
                  className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-amber-200 blur-[0.5px]"
                />
              </div>
            </motion.div>
          </div>

          {/* Badge Pill */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/70 border border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-300 text-xs font-bold mb-2 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current" />
            <span>Streak Extended!</span>
            <span className="bg-orange-500 text-white px-1.5 py-0.2 rounded-full text-[10px]">
              +1 Day
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-2xl font-black text-stone-900 dark:text-stone-50 tracking-tight"
          >
            {celebration.streak} Day{celebration.streak !== 1 ? 's' : ''} on Fire!
          </motion.h3>

          {/* Context Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 max-w-xs mx-auto leading-relaxed"
          >
            {celebration.taskTitle ? (
              <span>
                Completed <strong className="text-stone-900 dark:text-stone-200">"{celebration.taskTitle}"</strong> to secure your daily commitment.
              </span>
            ) : (
              <span>Your deliberate progress today has protected and boosted your streak momentum!</span>
            )}
          </motion.p>

          {/* Dismiss Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-5 pt-3 border-t border-stone-200/80 dark:border-stone-800/80 flex items-center justify-center gap-2"
          >
            <button
              type="button"
              onClick={() => setCelebration(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 text-xs font-bold shadow-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-95"
            >
              Keep Momentum Going
            </button>
          </motion.div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  );
};

/**
 * Inline Micro-Animation component for Task Card or Streak Heatmap
 * Displays a glowing, growing flame with particle sparkles when triggered
 */
export const TaskStreakCelebrationBadge: React.FC<{
  isTriggered: boolean;
  streakCount: number;
  onAnimationComplete?: () => void;
}> = ({ isTriggered, streakCount, onAnimationComplete }) => {
  if (!isTriggered) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -8 }}
      transition={{ type: 'spring', stiffness: 450, damping: 20 }}
      onAnimationComplete={onAnimationComplete}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-stone-950 text-xs font-black shadow-md shadow-orange-500/20"
    >
      <motion.div
        animate={{
          scale: [1, 1.4, 1.1, 1.3, 1],
          rotate: [-4, 6, -6, 2, 0],
        }}
        transition={{ duration: 0.8 }}
      >
        <Flame className="w-3.5 h-3.5 fill-current text-stone-950" />
      </motion.div>
      <span>+1 Day Streak! ({streakCount}d)</span>
    </motion.div>
  );
};

/**
 * Dispatcher helper to trigger the global streak celebration micro-animation
 */
export function triggerStreakCelebration(streak: number, taskTitle?: string): void {
  window.dispatchEvent(
    new CustomEvent<StreakCelebrationDetail>('app-streak-celebration', {
      detail: {
        id: `streak-${Date.now()}`,
        streak,
        taskTitle,
      },
    })
  );
}
