#!/usr/bin/env node
/**
 * Samples the camera pose (src/components/RankReveal.ts' cameraPose) for every frame of one full reveal and one
 * fast reveal, and checks two things:
 *
 *   1. Speed jumps at beat boundaries — the maximum frame-to-frame change in per-frame speed ("jerk") of each
 *      pose value (target x/y/z, dist, pitch, yaw, offsetX), measured in a small window around every beat in T
 *      and T_FAST. A camera with no wind-up and no sudden direction change should show no sharp spike right at
 *      a beat; this prints the worst jerk near each beat so a regression is visible as a number, not a hunch.
 *   2. The reveal-to-reveal handover — frame 0 of a reveal must equal the last frame (T.end) of the previous
 *      one, since by construction both are the shared OVERVIEW pose (see camera-check-entry.ts / RankReveal.tsx).
 *      Any value that differs prints as a FAIL.
 *
 *   npm run camera-check
 *
 * Source is TypeScript, so it is bundled with esbuild (already a Remotion dependency) and run in Node, the same
 * way scripts/export-timing.mjs does it. The font loader is stubbed: pose maths doesn't touch fonts, and loading
 * them for real would reach the network.
 */
import {build} from 'esbuild';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'payranked-camcheck-'));
const out = join(tmp, 'camera-check.mjs');

const stubFonts = {
  name: 'stub-fonts',
  setup(b) {
    b.onResolve({filter: /load-fonts$/}, () => ({path: 'load-fonts', namespace: 'stub'}));
    b.onLoad({filter: /.*/, namespace: 'stub'}, () => ({
      loader: 'js',
      contents:
        "const f={body:'x',numbers:'x',heading:'x',display:'x'};export const PAYRANKED_FONTS=f;export const QUIZ_FONTS=f;" +
        'export const FONT_SIZES={};export const FONT_WEIGHTS={};export const GOOGLE_FONTS={};export const FONTSHARE_FONTS={};',
    }));
  },
};

const POSE_KEYS = ['dist', 'pitch', 'yaw', 'offsetX'];
const VEC_KEYS = ['target'];
const WINDOW = 3; // frames either side of a beat to scan for the worst jerk

// per-frame speed of one scalar field across the sampled poses
const speeds = (poses, get) => {
  const s = [0];
  for (let i = 1; i < poses.length; i++) s.push(Math.abs(get(poses[i]) - get(poses[i - 1])));
  return s;
};

const worstJerkNear = (speedArr, frame) => {
  let worst = 0;
  for (let f = Math.max(1, frame - WINDOW); f <= Math.min(speedArr.length - 1, frame + WINDOW); f++) {
    worst = Math.max(worst, Math.abs(speedArr[f] - speedArr[f - 1]));
  }
  return worst;
};

const fieldsOf = (poses) => {
  const fields = {};
  for (const k of POSE_KEYS) fields[k] = speeds(poses, (p) => p[k]);
  for (const k of VEC_KEYS) {
    for (let i = 0; i < 3; i++) fields[`${k}[${i}]`] = speeds(poses, (p) => p[k][i]);
  }
  return fields;
};

const checkVariant = (label, sample) => {
  console.log(`\n${label} reveal (${sample.poses.length} frames, fly ${sample.flyDur}f, rise at ${sample.riseAt.toFixed(1)}f):`);
  const fields = fieldsOf(sample.poses);
  for (const {label: beatLabel, frame} of sample.beats) {
    const worstField = Object.entries(fields)
      .map(([name, s]) => [name, worstJerkNear(s, frame)])
      .sort((a, b) => b[1] - a[1])[0];
    console.log(`  beat ${beatLabel.padEnd(9)} @ f${frame.toString().padStart(4)}  max jerk: ${worstField[1].toFixed(4)} (${worstField[0]})`);
  }
  return sample.poses;
};

const posesEqual = (a, b, eps = 1e-6) =>
  POSE_KEYS.every((k) => Math.abs(a[k] - b[k]) < eps) && VEC_KEYS.every((k) => a[k].every((v, i) => Math.abs(v - b[k][i]) < eps));

try {
  await build({
    entryPoints: [join(root, 'scripts', 'camera-check-entry.ts')],
    outfile: out,
    bundle: true,
    platform: 'node',
    format: 'esm',
    logLevel: 'error',
    loader: {'.css': 'empty', '.woff2': 'empty'},
    plugins: [stubFonts],
    banner: {js: "import {createRequire as __cr} from 'node:module';const require=__cr(import.meta.url);"},
  });
  const {default: data} = await import(pathToFileURL(out).href);

  const fullPoses = checkVariant('Full', data.full);
  const fastPoses = checkVariant('Fast', data.fast);

  console.log('\nReveal-to-reveal handover (next reveal\'s frame 0 vs. this one\'s last frame, both should be OVERVIEW):');
  let failed = false;
  for (const [label, poses] of [['full', fullPoses], ['fast', fastPoses]]) {
    const first = poses[0];
    const last = poses[poses.length - 1];
    const firstOk = posesEqual(first, data.overview);
    const lastOk = posesEqual(last, data.overview);
    const handoverOk = posesEqual(first, last);
    console.log(`  ${label}: frame 0 == OVERVIEW: ${firstOk ? 'ok' : 'FAIL'}, last frame == OVERVIEW: ${lastOk ? 'ok' : 'FAIL'}, frame 0 == last frame: ${handoverOk ? 'ok' : 'FAIL'}`);
    if (!firstOk || !lastOk || !handoverOk) failed = true;
  }

  if (failed) {
    console.error('\ncamera-check: FAILED — a pose value jumps at the reveal-to-reveal handover.');
    process.exitCode = 1;
  } else {
    console.log('\ncamera-check: ok — no handover jump in either variant.');
  }
} finally {
  rmSync(tmp, {recursive: true, force: true});
}
