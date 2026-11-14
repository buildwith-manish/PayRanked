/**
 * Sidechain ducking and the music bed's shape.
 *
 * The voice-over's loudness per frame is measured once, offline, by `scripts/vo_envelope.py` (it reads public/vo.wav and
 * writes vo-envelope.json). Because the whole file is known in advance the duck can look ahead: the music is already
 * on its way down when the first word starts, which a live compressor cannot do.
 */
import {interpolate} from 'remotion';
import voEnvelope from './vo-envelope.json';
import {AUDIO} from './config';
import {HERO_BEATS} from './cues';
import {VIDEO2_FRAMES} from '../timeline2';

const frames = voEnvelope.frames as number[];

/** 0 = silence, 1 = the voice is speaking, at master-timeline frame `f`. */
export const voEnv = (f: number) => {
  const v = frames[Math.max(0, Math.round(f))];
  return v === undefined ? 0 : v / 100;
};

/** Gain for the SFX bus. Hero cues duck less (AUDIO.heroDuck) so they punch without masking the voice. */
export const sfxDuck = (f: number, hero?: boolean) => 1 - (hero ? AUDIO.heroDuck : AUDIO.sfxDuck) * voEnv(f);

/** Music dips for the big hits: down just before the strike, back up slowly after it. 0 = no dip, 1 = full. */
const dipAt = (f: number) => {
  let d = 0;
  for (const b of HERO_BEATS) {
    if (f < b - AUDIO.dipPre || f > b + AUDIO.dipRelease * 4) continue;
    const v = f < b ? (f - (b - AUDIO.dipPre)) / AUDIO.dipPre : Math.exp(-(f - b) / AUDIO.dipRelease);
    d = Math.max(d, Math.min(1, v));
  }
  return d;
};

/**
 * Where the bed sits across the video, before ducking: fades in under the cold open and out over the end screen.
 * Per-section levels get added here once the Video 2 cue sheet exists.
 */
const END = VIDEO2_FRAMES;
const SECTION_X = [0, 45, END - 150, END];
const SECTION_Y = [0, 0.8, 0.9, 0];
export const musicSection = (f: number) => interpolate(f, SECTION_X, SECTION_Y, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** Final music volume at master-timeline frame `f`: section level, voice-over duck, and impact dips. */
export const musicGain = (f: number) => {
  const duck = 1 - AUDIO.musicDuck * voEnv(f);
  const dip = 1 - AUDIO.dipDepth * dipAt(f);
  return Math.min(1, AUDIO.musicLevel * musicSection(f) * duck * dip);
};
