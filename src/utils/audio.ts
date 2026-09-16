/**
 * Web Audio API synthesizer for clean, pleasant productivity chimes and haptic-like sound feedback.
 * Operates without external MP3 files or network dependencies.
 */

let audioCtxInstance: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtxInstance) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxInstance = new AudioContextClass();
      }
    }
    if (audioCtxInstance && audioCtxInstance.state === 'suspended') {
      audioCtxInstance.resume().catch(() => {});
    }
    return audioCtxInstance;
  } catch (e) {
    console.warn('Web Audio API not supported or blocked:', e);
    return null;
  }
}

/**
 * Plays a warm 2-tone ascending chime (F4 -> C5) for starting a focus session
 */
export function playTimerStartSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 349.23, time: 0, dur: 0.25 }, // F4
    { freq: 523.25, time: 0.12, dur: 0.4 }, // C5
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0, now + time);
    gain.gain.linearRampToValueAtTime(0.15, now + time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur + 0.05);
  });
}

/**
 * Plays a soft descending chime for pausing
 */
export function playTimerPauseSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 440.0, time: 0, dur: 0.18 }, // A4
    { freq: 329.63, time: 0.09, dur: 0.3 }, // E4
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0, now + time);
    gain.gain.linearRampToValueAtTime(0.12, now + time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur + 0.05);
  });
}

/**
 * Plays a pleasant ascending tone for resuming
 */
export function playTimerResumeSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 329.63, time: 0, dur: 0.18 }, // E4
    { freq: 440.0, time: 0.09, dur: 0.3 }, // A4
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0, now + time);
    gain.gain.linearRampToValueAtTime(0.12, now + time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur + 0.05);
  });
}

/**
 * Plays a rich harmonic completion chord (C5 - E5 - G5 - C6) when reaching goal or completing timer
 */
export function playCompletionChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, time: 0.0, dur: 1.2 }, // C5
    { freq: 659.25, time: 0.15, dur: 1.2 }, // E5
    { freq: 783.99, time: 0.3, dur: 1.4 }, // G5
    { freq: 1046.5, time: 0.45, dur: 1.8 }, // C6
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0, now + time);
    gain.gain.linearRampToValueAtTime(0.18, now + time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur + 0.1);
  });
}

/**
 * Plays a quick double-bell chime for manual log confirmation or task completion
 */
export function playSuccessChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 587.33, time: 0, dur: 0.2 }, // D5
    { freq: 880.0, time: 0.1, dur: 0.4 }, // A5
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0, now + time);
    gain.gain.linearRampToValueAtTime(0.15, now + time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur + 0.05);
  });
}

/**
 * Plays a vibrant, celebratory ascending shimmer chime for streak extensions
 */
export function playStreakExtendedSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Ascending cheerful pentatonic run: F5, A5, C6, D6, F6
  const notes = [
    { freq: 698.46, time: 0.0, dur: 0.35, gain: 0.12 },  // F5
    { freq: 880.00, time: 0.08, dur: 0.35, gain: 0.14 }, // A5
    { freq: 1046.50, time: 0.16, dur: 0.45, gain: 0.16 }, // C6
    { freq: 1174.66, time: 0.24, dur: 0.5, gain: 0.18 },  // D6
    { freq: 1396.91, time: 0.32, dur: 0.8, gain: 0.2 },   // F6
  ];

  notes.forEach(({ freq, time, dur, gain: noteGain }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0, now + time);
    gain.gain.linearRampToValueAtTime(noteGain, now + time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur + 0.05);
  });
}

