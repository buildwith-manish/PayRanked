/**
 * Video 2 timeline, in design frames (30 fps; see clock.ts).
 *
 * PLACEHOLDER: every section's length will come from the recorded voiceover (scripts/vo_layout.py -> vo-layout.json),
 * each shot = its voiceover + 0.4 s. These are the planned section lengths in seconds, used only until the clips exist.
 */
import {DESIGN_FPS} from './clock';

const s = (seconds: number) => Math.round(seconds * DESIGN_FPS);

export const PLAN = [
  {id: 'coldOpen', seconds: 20},
  {id: 'intro', seconds: 4},
  {id: 'method', seconds: 46},
  {id: 'countdown', seconds: 280},
  {id: 'twist', seconds: 100},
  {id: 'takeaway', seconds: 65},
  {id: 'outro', seconds: 30},
] as const;

export type SectionId = (typeof PLAN)[number]['id'];

let t = 0;
export const START = Object.fromEntries(
  PLAN.map((p) => {
    const from = t;
    t += s(p.seconds);
    return [p.id, from];
  }),
) as Record<SectionId, number>;

export const VIDEO2_FRAMES = t;
