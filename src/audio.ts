// Chasr signature sounds — pre-rendered, instantly recognizable.
// "Chasr Ping":  sharp percussive click + deep sub-bass throb — like a soft knock,
//                not a digital chime. Physical, warm, impossible to ignore.
// "Chasr Spark": click + warm ascending shimmer — celebratory, used for matches.

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

let pingAudio: HTMLAudioElement | null = null;
let sparkAudio: HTMLAudioElement | null = null;

function getAudio(src: string): HTMLAudioElement {
  return new Audio(src);
}

export function playMessageSound() {
  if (!pingAudio) pingAudio = getAudio('/sounds/chasr-ping.wav');
  if (!soundEnabled()) return;
  try {
    pingAudio.currentTime = 0;
    pingAudio.play().catch(() => {
      // If blocked, create a fresh instance next time (user gesture will unlock it).
      pingAudio = null;
    });
  } catch {
    pingAudio = null;
  }
}

export function playMatchSound() {
  if (!sparkAudio) sparkAudio = getAudio('/sounds/chasr-spark.wav');
  if (!soundEnabled()) return;
  try {
    sparkAudio.currentTime = 0;
    sparkAudio.play().catch(() => {
      sparkAudio = null;
    });
  } catch {
    sparkAudio = null;
  }
}
