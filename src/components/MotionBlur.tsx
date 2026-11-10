import React, {useId, useRef} from 'react';

import {blurLength} from '../motion';
import {useDesignFrame} from '../clock';

const safeId = (s: string) => 'mb' + s.replace(/[^a-zA-Z0-9_-]/g, '_');

/**
 * Real directional motion blur for one element, driven by how far it travelled this frame.
 * `dx` / `dy` are the pixels moved since the previous frame. The blur runs along the direction of travel only
 * (a horizontal move is blurred horizontally), with a 180 degree shutter, so it reads as camera blur and not as
 * a soft-focus effect. Below about 1 px of travel nothing is drawn and the element stays crisp.
 */
export const MotionBlur: React.FC<{
  dx?: number;
  dy?: number;
  shutter?: number;
  cap?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({dx = 0, dy = 0, shutter = 0.5, cap = 60, style, children}) => {
  // Bug fix: safeId(useId()) alone can collide — React's ':r0:' → 'mb_r0_', and multiple
  // MotionBlur instances in the same frame (e.g. the dozen bars in Shot3 or the coin stacks)
  // end up with the same sanitised ID, so the wrong filter is applied to the wrong element.
  // A stable random uid from useRef makes every instance unique for its lifetime.
  const uid = useRef(Math.random().toString(36).slice(2, 8));
  const id = safeId(uid.current + useId());
  const bx = blurLength(dx, shutter, cap);
  const by = blurLength(dy, shutter, cap);
  if (bx === 0 && by === 0) return <div style={style}>{children}</div>;
  return (
    <div style={{...style, filter: `url(#${id})`}}>
      <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
        <defs>
          {/* Bug fix: old region (x="-30%" width="160%") clipped the blur trail on fast large elements
              (rank slam, coin stacks, rising bars). 50% margin = 200% total gives enough room for any
              realistic blur length without meaningfully increasing render cost. */}
          <filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${bx} ${by}`} />
          </filter>
        </defs>
      </svg>
      {children}
    </div>
  );
};

/**
 * Velocity from a position function. `pos` gives the element's [x, y] in pixels for any frame (a pure function of
 * the frame), and this returns how far it moved since the frame before: feed it straight into <MotionBlur>.
 */
export const useVelocity = (pos: (frame: number) => [number, number]) => {
  const frame = useDesignFrame();
  const [x1, y1] = pos(frame);
  const [x0, y0] = pos(frame - 1);
  return {dx: x1 - x0, dy: y1 - y0};
};
