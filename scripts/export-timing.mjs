#!/usr/bin/env node
/**
 * Exports the video's real timeline (every shot start, every reveal and break, the beats inside each shot) to
 * scripts/timing.json, in seconds on the master clock. scripts/make_music.py reads it, so the music bed is built against
 * the same numbers the video renders with and cannot drift when a shot is cut or a reveal changes length.
 *
 *   node scripts/export-timing.mjs      (also run by `npm run music`)
 *
 * The source is TypeScript, so it is bundled with esbuild (already a dependency of Remotion) and run in Node. The font
 * loader is stubbed: the timing does not depend on fonts, and it would try to load them from the network.
 */
import {build} from 'esbuild';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'payranked-timing-'));
const out = join(tmp, 'timing.mjs');

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

try {
  await build({
    entryPoints: [join(root, 'scripts', 'timing-entry.ts')],
    outfile: out,
    bundle: true,
    platform: 'node',
    format: 'esm',
    logLevel: 'error',
    loader: {'.css': 'empty', '.woff2': 'empty'},
    plugins: [stubFonts],
    banner: {js: "import {createRequire as __cr} from 'node:module';const require=__cr(import.meta.url);"},
  });
  const {default: timing} = await import(pathToFileURL(out).href);
  writeFileSync(join(root, 'scripts', 'timing.json'), JSON.stringify(timing, null, 2) + '\n');
  console.log(`scripts/timing.json: ${timing.total.toFixed(2)} s, ${timing.reveals.length} reveals, ${timing.breaks.length} breaks`);
} finally {
  rmSync(tmp, {recursive: true, force: true});
}
