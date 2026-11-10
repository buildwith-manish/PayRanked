// Entry point for scripts/camera-check.mjs: samples cameraPose() for every frame of one full and one fast reveal,
// and returns the frame-by-frame poses plus the beat boundaries needed to check for speed jumps. The actual
// comparisons (speed deltas, the handover check) are done in the .mjs wrapper so this file stays a thin,
// esbuild-bundleable export of pure data.
import {cameraPose, T, T_FAST, flyDurOf, riseAtOf, OVERVIEW, CameraInput} from '../src/components/RankReveal';

// A representative camera input. The pose maths doesn't depend on which real state this is — wx/wy/topZ/targetZoom
// just stand in for "some state at some zoom", so one fixed input is enough to check the curve's own continuity.
const inputFor = (fast: boolean): CameraInput => ({fast, wx: 420, wy: -180, topZ: 260, targetZoom: 2.1});

const sample = (fast: boolean) => {
  const t = fast ? T_FAST : T;
  const poses: ReturnType<typeof cameraPose>[] = [];
  for (let f = 0; f <= t.end; f++) poses.push(cameraPose(f, inputFor(fast)));
  return {
    poses,
    beats: Object.entries(t).map(([label, frame]) => ({label, frame})),
    flyDur: flyDurOf(fast),
    riseAt: riseAtOf(fast),
    end: t.end,
  };
};

export default {
  full: sample(false),
  fast: sample(true),
  overview: OVERVIEW,
};
