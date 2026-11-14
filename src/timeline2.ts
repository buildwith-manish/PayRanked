/**
 * Video 2 timeline, in design frames (30 fps; see clock.ts). Every length comes from the recorded voiceover
 * (scripts/vo_layout.py -> src/audio/vo-layout.json): each shot = its voice + 0.4 s.
 */
import {SECTIONS, TOTAL_DESIGN, d} from './video2/layout';

export const PLAN = SECTIONS.map((s) => ({id: s.id, seconds: s.seconds}));
export type SectionId = 'coldOpen' | 'intro' | 'method' | 'countdown' | 'twist' | 'takeaway' | 'outro';
export const START = Object.fromEntries(SECTIONS.map((s) => [s.id, d(s.start)])) as Record<SectionId, number>;
export const VIDEO2_FRAMES = TOTAL_DESIGN;
