import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface AnimatedRingProgressProps {
  progress: number; // 0 to 100+
  size?: number; // Outer SVG size in px
  strokeWidth?: number;
  color?: string; // Hex color or CSS color
  trackColor?: string; // Optional track color
  showPercentage?: boolean;
  showCheckmarkWhenComplete?: boolean;
  centerContent?: React.ReactNode;
  subtitle?: string;
  glow?: boolean;
  className?: string;
}

export const AnimatedRingProgress: React.FC<AnimatedRingProgressProps> = ({
  progress,
  size = 64,
  strokeWidth = 6,
  color = '#f59e0b',
  trackColor,
  showPercentage = true,
  showCheckmarkWhenComplete = true,
  centerContent,
  subtitle,
  glow = false,
  className = '',
}) => {
  const normalizedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const isComplete = normalizedProgress >= 100;
  
  // Choose stroke color: if complete, emerald if no explicit color override is desired, or use goal color
  const activeColor = isComplete ? (color || '#10b981') : (color || '#f59e0b');

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={normalizedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 origin-center"
      >
        {/* Background Track Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor || 'currentColor'}
          strokeWidth={strokeWidth}
          className={trackColor ? '' : 'text-stone-200/80 dark:text-stone-800'}
        />

        {/* Animated Progress Stroke */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 0.85,
            ease: [0.16, 1, 0.3, 1], // Smooth custom easeOut
          }}
          style={
            glow
              ? {
                  filter: `drop-shadow(0 0 6px ${activeColor}60)`,
                }
              : undefined
          }
        />
      </svg>

      {/* Center Label / Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
        {centerContent ? (
          centerContent
        ) : isComplete && showCheckmarkWhenComplete ? (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className="flex items-center justify-center text-emerald-600 dark:text-emerald-400"
          >
            <Check
              className="stroke-[3]"
              style={{ width: Math.max(14, size * 0.35), height: Math.max(14, size * 0.35) }}
            />
          </motion.div>
        ) : showPercentage ? (
          <div className="flex flex-col items-center justify-center leading-none">
            <span
              className="font-mono font-bold text-stone-800 dark:text-stone-100 tracking-tight"
              style={{ fontSize: Math.max(10, Math.round(size * 0.23)) }}
            >
              {normalizedProgress}%
            </span>
            {subtitle && (
              <span
                className="text-stone-400 font-medium tracking-wider uppercase mt-0.5"
                style={{ fontSize: Math.max(8, Math.round(size * 0.12)) }}
              >
                {subtitle}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
