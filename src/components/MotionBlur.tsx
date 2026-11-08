import React, {useId} from 'react';
import {useCurrentFrame} from 'remotion';
import {blurLength} from '../motion';

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
  const id = safeId(useId());
  const bx = blurLength(dx, shutter, cap);
  const by = blurLength(dy, shutter, cap);
  if (bx === 0 && by === 0) return <div style={style}>{children}</div>;
  return (
    <div style={{...style, filter: `url(#${id})`}}>
      <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
        <defs>
          <filter id={id} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
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
  const frame = useCurrentFrame();
  const [x1, y1] = pos(frame);
  const [x0, y0] = pos(frame - 1);
  return {dx: x1 - x0, dy: y1 - y0};
};
