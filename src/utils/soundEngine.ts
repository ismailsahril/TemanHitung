let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Ignore errors on resume
    });
  }
  return audioCtx;
}

/**
 * Plays a pleasant high-frequency chime on correct answer using Web Audio API synthesis.
 */
export function playCorrectSound(enabled: boolean): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz

    // Set short envelope to avoid pops
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); // 0.15s duration

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (error) {
    const isDev = import.meta.env.DEV;
    if (isDev) {
      console.warn('Sound play failure:', error);
    }
  }
}

/**
 * Plays a low-frequency buzzing sound on wrong answer using Web Audio API synthesis.
 */
export function playWrongSound(enabled: boolean): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime); // 220Hz

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.20); // 0.2s duration

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.20);
  } catch (error) {
    const isDev = import.meta.env.DEV;
    if (isDev) {
      console.warn('Sound play failure:', error);
    }
  }
}
