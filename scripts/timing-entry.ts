// Entry point for scripts/export-timing.mjs: gathers the timeline numbers the music needs and returns them in seconds.
import {breaks, COUNTDOWN_TOTAL, START, timeline, VIDEO_FRAMES, SHOT_SECONDS} from '../src/timeline';
import {timing} from '../src/components/RankReveal';
import {BRACKET_START, CHIPS_START, COUNT_START, EXPLAIN_START, HEAD_START, HEAD2_START, REST_START, SEAM_START, SHAPE_START, SLAM} from '../src/shots/Shot1';
import {T as T3} from '../src/shots/Shot3';
import {T as T5} from '../src/shots/Shot5';
import {T as T55} from '../src/shots/Shot55'; // EXTEND-4
import {T as T6} from '../src/shots/Shot6';
import {DESIGN_FPS} from '../src/clock';

const s = (f: number) => f / DESIGN_FPS;
const secs = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, s(v)]));

export default {
  fps: DESIGN_FPS,
  total: s(VIDEO_FRAMES),
  shots: {
    shot1: {start: s(START.shot1), dur: SHOT_SECONDS.shot1},
    shot2: {start: s(START.shot2), dur: SHOT_SECONDS.shot2},
    shot3: {start: s(START.shot3), dur: SHOT_SECONDS.shot3},
    countdown: {start: s(START.shot4), dur: s(COUNTDOWN_TOTAL)},
    shot5: {start: s(START.shot5), dur: SHOT_SECONDS.shot5},
    shot55: {start: s(START.shot55), dur: SHOT_SECONDS.shot55}, // EXTEND-4
    shot6: {start: s(START.shot6), dur: SHOT_SECONDS.shot6},
  },
  // beats inside each shot, in seconds from the start of that shot
  shot1: secs({seam: SEAM_START, shape: SHAPE_START, count: COUNT_START, head: HEAD_START, explain: EXPLAIN_START, head2: HEAD2_START, rest: REST_START, bracket: BRACKET_START, slam: SLAM, chips: CHIPS_START}),
  shot3: secs(T3),
  shot5: secs(T5),
  shot55: secs(T55), // EXTEND-4
  shot6: secs(T6),
  // every reveal and break, in order, in seconds from the start of the countdown
  reveals: timeline.map((t) => {
    const T = timing(t.fast);
    return {label: t.label, names: t.names, fast: t.fast, from: s(t.from), dur: s(t.dur), name: s(T.name), bea: s(T.bea), dollars: s(T.dollars), lock: s(T.lock), mapOut: s(T.mapOut)};
  }),
  breaks: breaks.map((b) => ({kind: b.kind, from: s(b.from), dur: s(b.dur)})),
};
