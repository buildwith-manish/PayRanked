import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {glide, ramp, snap, trail, tween} from '../motion';
import {Glass} from './Glass';
import {MotionBlur} from './MotionBlur';

/**
 * Glass chip. The box arrives on a `snap` curve (crisp, tiny overshoot) with directional motion blur while it travels;
 * its text and icon follow through, landing 4 frames after the box, so the label feels carried by the chip.
 * `pulse` is a slow breathing glow (not a bounce), for the one chip that should keep drawing the eye.
 */
export const Chip: React.FC<{
  text: string;
  delay?: number;
  from?: 'bottom' | 'top' | 'left' | 'right';
  color?: string;
  bg?: string;
  size?: number;
  pulse?: boolean;
  tilt?: number;
  icon?: React.ReactNode;
  /** colour of the rim and glow; defaults to the text colour. Pass the neutral text colour for a quiet chip. */
  tint?: string;
}> = ({text, delay = 0, from = 'bottom', color = C.text, size = 40, pulse = false, tilt = 0, icon, tint}) => {
  const frame = useCurrentFrame();
  const dist = 140;
  const dx = from === 'left' ? -dist : from === 'right' ? dist : 0;
  const dy = from === 'bottom' ? dist : from === 'top' ? -dist : 0;
  const pAt = (f: number) => tween(f, delay, 20, snap);
  const p = pAt(frame);
  const opacity = ramp(frame, delay, delay + 8, glide);
  // follow-through: the label lands a few frames after the box
  const inner = trail(frame, delay, 16, glide, 4);
  const breathe = pulse && frame > delay + 20 ? 0.5 + 0.5 * Math.sin((frame - delay) / 14) : 0;
  const rim = tint ?? (color.startsWith('#') && color.length === 7 ? color : C.text);
  return (
    <MotionBlur dx={dx * (pAt(frame) - pAt(frame - 1)) * -1} dy={dy * (pAt(frame) - pAt(frame - 1)) * -1} shutter={0.6} cap={40}>
      <Glass
        radius={999}
        tint={rim}
        glow={pulse ? 14 + 16 * breathe : 6}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 16,
          padding: '18px 34px',
          color,
          fontFamily: F.display,
          fontWeight: 700,
          fontSize: size,
          opacity,
          transform: `translate(${dx * (1 - p)}px, ${dy * (1 - p)}px) rotate(${tilt * (1 - p)}deg) scale(${1 + 0.012 * breathe})`,
          whiteSpace: 'nowrap',
          textShadow: pulse ? `0 0 18px ${color}55` : undefined,
        }}
      >
        <span style={{display: 'inline-flex', alignItems: 'center', gap: 16, opacity: inner, transform: `translateY(${(1 - inner) * 10}px)`}}>
          {icon}
          {text}
        </span>
      </Glass>
    </MotionBlur>
  );
};
