// Generates iconic Chasr notification sounds as WAV files.
// "Chasr Ping": a sharp percussive "ch" click + deep sub-bass throb.
//               Feels like a soft knock on a door — physical, warm, attention-grabbing.
// "Chasr Spark": the click followed by a warm ascending shimmer — celebratory for matches.

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_RATE = 44100;

function writeWav(path, samples) {
  const numSamples = samples.length;
  const dataSize = numSamples * 2; // 16-bit mono
  const buf = Buffer.alloc(44 + dataSize);
  // RIFF header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);       // chunk size
  buf.writeUInt16LE(1, 20);        // PCM
  buf.writeUInt16LE(1, 22);        // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);        // block align
  buf.writeUInt16LE(16, 34);       // bits
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < numSamples; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  writeFileSync(path, buf);
  console.log(`wrote ${path} (${buf.length} bytes, ${(numSamples / SAMPLE_RATE * 1000).toFixed(0)}ms)`);
}

// ── Chasr Ping: ch-click + deep throb ──
const pingDur = 0.35; // seconds
const pingSamples = Math.floor(SAMPLE_RATE * pingDur);
const ping = new Float64Array(pingSamples);

for (let i = 0; i < pingSamples; i++) {
  const t = i / SAMPLE_RATE;
  let v = 0;

  // 1) Percussive "ch" click: band-limited noise burst, 0–18ms
  if (t < 0.018) {
    const env = Math.exp(-t / 0.004); // very sharp decay
    // Use a deterministic pseudo-random (seeded by index) for crisp click
    const noise = (Math.sin(i * 137.3 + 97.1) * 0.6 + Math.sin(i * 293.7 + 31.9) * 0.3 + Math.sin(i * 719.3 + 512.1) * 0.1);
    v += noise * env * 0.55;
  }

  // 2) Sub-bass throb: 80Hz sine with exponential decay, starts at 15ms
  if (t >= 0.015) {
    const dt = t - 0.015;
    const throbEnv = Math.exp(-dt / 0.08) * (1 - Math.exp(-dt / 0.008)); // quick attack, medium decay
    v += Math.sin(2 * Math.PI * 80 * dt) * throbEnv * 0.45;
  }

  // 3) Warm "body" texture: low sine (160Hz) adds warmth, shorter decay
  if (t >= 0.02) {
    const dt = t - 0.02;
    const bodyEnv = Math.exp(-dt / 0.06);
    v += Math.sin(2 * Math.PI * 160 * dt) * bodyEnv * 0.15;
  }

  // 4) Soft "breath" tail: very quiet filtered texture
  if (t >= 0.01 && t < 0.12) {
    const dt = t - 0.01;
    const breathEnv = Math.exp(-dt / 0.04);
    const breath = Math.sin(i * 47.3) * Math.sin(i * 191.7);
    v += breath * breathEnv * 0.06;
  }

  // Global fade-in (anti-click) and fade-out
  if (t < 0.001) v *= t / 0.001;
  if (t > pingDur - 0.02) v *= (pingDur - t) / 0.02;

  ping[i] = v;
}

writeWav(join(__dirname, '..', 'public', 'sounds', 'chasr-ping.wav'), ping);

// ── Chasr Spark: ch-click + warm ascending shimmer ──
const sparkDur = 0.65;
const sparkSamples = Math.floor(SAMPLE_RATE * sparkDur);
const spark = new Float64Array(sparkSamples);

for (let i = 0; i < sparkSamples; i++) {
  const t = i / SAMPLE_RATE;
  let v = 0;

  // 1) Same percussive click
  if (t < 0.018) {
    const env = Math.exp(-t / 0.004);
    const noise = (Math.sin(i * 137.3 + 97.1) * 0.6 + Math.sin(i * 293.7 + 31.9) * 0.3 + Math.sin(i * 719.3 + 512.1) * 0.1);
    v += noise * env * 0.5;
  }

  // 2) Warm ascending tone: 380Hz → 520Hz sine sweep
  if (t >= 0.03) {
    const dt = t - 0.03;
    const ascEnv = Math.exp(-dt / 0.22) * (1 - Math.exp(-dt / 0.01));
    const freq = 380 + (520 - 380) * (1 - Math.exp(-dt / 0.08));
    v += Math.sin(2 * Math.PI * freq * dt) * ascEnv * 0.35;
  }

  // 3) Sparkle layer: two high sines with gentle decay
  if (t >= 0.15) {
    const dt = t - 0.15;
    const sparkleEnv = Math.exp(-dt / 0.35) * (1 - Math.exp(-dt / 0.01));
    v += Math.sin(2 * Math.PI * 1174.66 * dt) * sparkleEnv * 0.07; // D6
    v += Math.sin(2 * Math.PI * 1567.98 * dt) * sparkleEnv * 0.04; // G6
  }

  // 4) Subtle shimmer modulation
  if (t >= 0.15 && t < 0.55) {
    const dt = t - 0.15;
    const shimmerEnv = Math.exp(-dt / 0.28);
    v += Math.sin(2 * Math.PI * 784 * dt) * Math.sin(2 * Math.PI * 3.7 * dt) * shimmerEnv * 0.04;
  }

  if (t < 0.001) v *= t / 0.001;
  if (t > sparkDur - 0.03) v *= (sparkDur - t) / 0.03;

  spark[i] = v;
}

writeWav(join(__dirname, '..', 'public', 'sounds', 'chasr-spark.wav'), spark);

console.log('Done — both sounds generated.');
