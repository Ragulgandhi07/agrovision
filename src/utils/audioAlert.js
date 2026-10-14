// Web Audio API Synthesizer for Mild Wildlife Alert Sound
// Generates a soft, non-startling two-tone harmonic chime (sine wave with exponential decay)

let audioCtx = null;
let lastAlertTimestamp = 0;
const ALERT_COOLDOWN_MS = 15000; // 15-second cooldown between duplicate animal alert sounds

/**
 * Returns or initializes an AudioContext safely within browser interaction constraints
 */
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a gentle, pleasant two-tone chime (523Hz C5 -> 659Hz E5)
 * @param {Object} options
 * @param {number} options.volume - 0.0 to 1.0 (default: 0.35 - mild)
 * @param {boolean} options.force - bypass cooldown (e.g. for user testing)
 * @returns {boolean} - true if played, false if silenced/cooldown
 */
export function playMildWildlifeChime({ volume = 0.35, force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastAlertTimestamp < ALERT_COOLDOWN_MS) {
    // Alert was triggered recently; suppress duplicate audio alert
    return false;
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    const clampedVolume = Math.max(0.01, Math.min(1.0, volume));
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(clampedVolume * 0.4, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Tone 1: 523.25 Hz (Note C5) - Soft warm sine
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);

    // Envelope for Tone 1: gentle attack, 200ms duration
    gain1.gain.setValueAtTime(0.001, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

    osc1.connect(gain1);
    gain1.connect(masterGain);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.25);

    // Tone 2: 659.25 Hz (Note E5) - Harmonious pleasant bell-like resolution
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.14);

    // Envelope for Tone 2: gentle attack at 140ms, 450ms sustain-decay
    gain2.gain.setValueAtTime(0.001, ctx.currentTime + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc2.start(ctx.currentTime + 0.14);
    osc2.stop(ctx.currentTime + 0.7);

    lastAlertTimestamp = now;
    return true;
  } catch (err) {
    console.warn('Audio alert could not play (browser policy or unsupported audio context):', err);
    return false;
  }
}
