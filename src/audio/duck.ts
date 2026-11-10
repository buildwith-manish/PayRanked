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
import {START, VIDEO_FRAMES} from '../timeline';
import {SHOT2_FRAMES} from '../shots/Shot2';
import {sec} from '../theme';

const frames = voEnvelope.frames as number[];

/** 0 = silence, 1 = the voice is speaking, at master-timeline frame `f`. */
export const voEnv = (f: number) => {
  const v = frames[Math.max(0, Math.round(f))];
  return v === undefined ? 0 : v / 100;
};

/** Gain for the SFX bus. Hero cues are never ducked. */
export const sfxDuck = (f: number, hero?: boolean) => (hero ? 1 : 1 - AUDIO.sfxDuck * voEnv(f));

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
 * Where the bed sits in each part of the video, before ducking. It fades in under the cold open, steps out for the
 * 2.6 s intro (which carries its own sound), comes back lower under the method, lifts for the countdown, and
 * fades away over the end screen.
 */
const END = VIDEO_FRAMES;
const INTRO_END = START.shot2 + SHOT2_FRAMES;
const SECTION_X = [0, 45, START.shot2 - 10, START.shot2 - 2, INTRO_END, INTRO_END + 24, START.shot4 - 30, START.shot4 + 20, START.shot5 - 30, START.shot5 + 30, START.shot6 + 30, END - 150, END];
const SECTION_Y = [0, 0.8, 0.8, 0, 0, 0.7, 0.7, 1, 1, 0.8, 0.9, 0.9, 0];
export const musicSection = (f: number) => interpolate(f, SECTION_X, SECTION_Y, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** Final music volume at master-timeline frame `f`: section level, voice-over duck, and impact dips. */
export const musicGain = (f: number) => {
  const duck = 1 - AUDIO.musicDuck * voEnv(f);
  const dip = 1 - AUDIO.dipDepth * dipAt(f);
  return Math.min(1, AUDIO.musicLevel * musicSection(f) * duck * dip);
};
