import {H, W} from '../theme';

/** Vertical field of view of every 3D camera, in degrees. */
export const FOV = 32;

/**
 * Camera distance at which one world unit equals one screen pixel on the z = 0 plane.
 * World space is the old map space (x right, y up, z toward the viewer) with the origin at the screen centre,
 * so a camera at (0, 0, CAM_D) looking straight down reproduces the old flat 2D map exactly.
 */
export const CAM_D = H / 2 / Math.tan((FOV * Math.PI) / 360);

/** Map-pixel (SVG, y down) to world coordinates (y up, origin at screen centre). */
export const toWorld = (x: number, y: number): [number, number] => [x - W / 2, -(y - H / 2)];

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Vertical field of view that keeps "one world unit = one screen pixel at distance CAM_D" on a canvas that is `h` px tall.
 * The 1920x1080 canvas gets exactly FOV; a 1080x1920 canvas needs a wider vertical FOV, with the same camera distance, so
 * fog, shadows and every distance-based tuning stay the same as in the landscape video.
 */
export const fovFor = (h: number) => (h === H ? FOV : (2 * Math.atan(h / 2 / CAM_D) * 180) / Math.PI);
