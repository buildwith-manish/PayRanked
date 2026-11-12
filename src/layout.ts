import {useVideoConfig} from 'remotion';

/**
 * Orientation of the composition that is currently rendering.
 *
 * Every landscape composition is 1920x1080 and every vertical Short is 1080x1920, so a component can ask the
 * composition it is inside for its size instead of importing the fixed W/H from theme.ts. In a landscape
 * composition useLayout() returns exactly {w: 1920, h: 1080, vertical: false}, so nothing in the long video changes.
 */
export type Layout = {w: number; h: number; vertical: boolean};

export const useLayout = (): Layout => {
  const {width, height} = useVideoConfig();
  return {w: width, h: height, vertical: height > width};
};

/** Shorts shelf and player UI cover the top ~150 px and the bottom ~380 px (and a column on the right). Keep key content between. */
export const SHORTS_SAFE = {top: 150, bottom: 1540, left: 48, right: 1032};

export const VW = 1080;
export const VH = 1920;
