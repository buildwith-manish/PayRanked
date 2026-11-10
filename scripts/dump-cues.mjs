#!/usr/bin/env node
/**
 * Dumps the real cue sheet (every sound and the master-timeline second its impact lands on) to a JSON file, so
 * scripts/make_audio_previews.py can mix the effects on their own. Same esbuild trick as export-timing.mjs.
 *
 *   node scripts/dump-cues.mjs [out.json]      default: scripts/cues.json
 */
import {build} from 'esbuild';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'payranked-cues-'));
const entry = join(tmp, 'entry.ts');
const out = join(tmp, 'cues.mjs');

writeFileSync(
  entry,
  `import {CUES} from '${join(root, 'src', 'audio', 'cues').replace(/\\\\/g, '/')}';
import {START, timeline, breaks, VIDEO_FRAMES} from '${join(root, 'src', 'timeline').replace(/\\\\/g, '/')}';
import {DESIGN_FPS} from '${join(root, 'src', 'clock').replace(/\\\\/g, '/')}';
const s = (f: number) => f / DESIGN_FPS;
const put = (list: any[], offset: number, tag: string, acc: any[]) => list.forEach((c) => acc.push({sfx: c.sfx, t: s(offset + c.at), gain: c.gain, hero: !!c.hero, tag}));
const all: any[] = [];
put(CUES.shot1, START.shot1, 'shot1', all);
put(CUES.shot3, START.shot3, 'shot3', all);
timeline.forEach((t, i) => put(CUES.reveals[i], START.shot4 + t.from, 'reveal ' + t.label, all));
breaks.forEach((b, i) => put(CUES.breaks[i], START.shot4 + b.from, 'break', all));
put(CUES.shot5, START.shot5, 'shot5', all);
if ((CUES as any).shot55) put((CUES as any).shot55, (START as any).shot55, 'shot55', all);
put(CUES.shot6, START.shot6, 'shot6', all);
export default {total: s(VIDEO_FRAMES), shots: {shot1: s(START.shot1), shot3: s(START.shot3), countdown: s(START.shot4), shot5: s(START.shot5), shot55: s((START as any).shot55 ?? START.shot5), shot6: s(START.shot6)}, cues: all.sort((a, b) => a.t - b.t)};
`,
);

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
    entryPoints: [entry],
    outfile: out,
    bundle: true,
    platform: 'node',
    format: 'esm',
    logLevel: 'error',
    loader: {'.css': 'empty', '.woff2': 'empty', '.json': 'json'},
    plugins: [stubFonts],
    banner: {js: "import {createRequire as __cr} from 'node:module';const require=__cr(import.meta.url);"},
  });
  const {default: data} = await import(pathToFileURL(out).href);
  const dest = process.argv[2] || join(root, 'scripts', 'cues.json');
  writeFileSync(dest, JSON.stringify(data) + '\n');
  console.log(`${dest}: ${data.cues.length} cues over ${data.total.toFixed(1)} s`);
} finally {
  rmSync(tmp, {recursive: true, force: true});
}
