// Chasr signature sounds — synthesized with Web Audio so they're 100% original.
// "The Chasr Ping" (new message): a sonar blip + bright chime, echoing the radar
// / location theme of the app. The match sound is a quick ascending sparkle.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

interface ToneOpts {
  freq: number;
  start: number;
  dur: number;
  gain?: number;
  type?: OscillatorType;
  endFreq?: number;
}

function tone(c: AudioContext, t0: number, o: ToneOpts) {
  if (!master) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.freq, t0 + o.start);
  if (o.endFreq) {
    osc.frequency.exponentialRampToValueAtTime(o.endFreq, t0 + o.start + o.dur);
  }
  g.gain.setValueAtTime(0.0001, t0 + o.start);
  g.gain.exponentialRampToValueAtTime(o.gain ?? 0.15, t0 + o.start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.start + o.dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0 + o.start);
  osc.stop(t0 + o.start + o.dur + 0.05);
}

const SOUND_KEY = 'chasr_sound_enabled';

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch {}
}

// New message: sonar blip -> A5 chime -> E6 sparkle -> soft echo.
export function playMessageSound() {
  if (!soundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + 0.02;
  tone(c, t0, { freq: 620, endFreq: 1080, start: 0, dur: 0.09, gain: 0.22, type: 'sine' });   // radar sweep
  tone(c, t0, { freq: 880, start: 0.11, dur: 0.42, gain: 0.18, type: 'sine' });               // A5 chime
  tone(c, t0, { freq: 880, start: 0.11, dur: 0.30, gain: 0.07, type: 'triangle' });            // warm body
  tone(c, t0, { freq: 1318.5, start: 0.15, dur: 0.32, gain: 0.08, type: 'sine' });             // E6 sparkle
  tone(c, t0, { freq: 880, start: 0.19, dur: 0.26, gain: 0.045, type: 'sine' });               // echo
}

// It's a match: C6 -> E6 -> G6 sparkle.
export function playMatchSound() {
  if (!soundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + 0.02;
  tone(c, t0, { freq: 1046.5, start: 0, dur: 0.22, gain: 0.16, type: 'sine' });
  tone(c, t0, { freq: 1318.5, start: 0.11, dur: 0.26, gain: 0.16, type: 'sine' });
  tone(c, t0, { freq: 1568, start: 0.22, dur: 0.55, gain: 0.18, type: 'sine' });
  tone(c, t0, { freq: 2093, start: 0.22, dur: 0.5, gain: 0.05, type: 'sine' });
  tone(c, t0, { freq: 1568, start: 0.22, dur: 0.4, gain: 0.06, type: 'triangle' });
}
