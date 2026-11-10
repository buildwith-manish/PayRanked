import React from 'react';

import {C} from '../theme';
import {glide, roll as rollEase} from '../motion';
import {Odometer} from './Odometer';
import {useDesignFrame} from '../clock';

/**
 * Number that rolls from `from` to `to` on odometer wheels (used to be a fading text count).
 * Colour follows direction unless overridden. `prefix` / `suffix` replace the old `format` function.
 */
export const Count: React.FC<{
  from?: number;
  to: number;
  start?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  size?: number;
  color?: string;
  glow?: number;
  style?: React.CSSProperties;
}> = ({from = 0, to, start = 0, duration = 50, prefix = '$', suffix = '', size = 120, color, glow = 0, style}) => {
  const frame = useDesignFrame();
  const v = countValue(frame, from, to, start, duration);
  const pv = countValue(frame - 1, from, to, start, duration);
  return (
    <Odometer
      value={v}
      prevValue={pv}
      sinceLanding={frame - (start + duration)}
      // Bug 6 fix: pre-compute digit count from the final target so Odometer never shifts
      // layout when the rolling value crosses a power-of-ten boundary mid-animation.
      targetDigits={Math.max(String(Math.floor(Math.abs(to))).length, String(Math.floor(Math.abs(from))).length)}
      size={size}
      color={color ?? (to >= from ? C.mint : C.red)}
      prefix={prefix}
      suffix={suffix}
      glow={glow}
      style={style}
    />
  );
};

/** Current counted value (for pairing with sound, gauges or coins). */
export const countValue = (frame: number, from: number, to: number, start: number, duration: number) => {
  const t = Math.min(1, Math.max(0, (frame - start) / duration));
  return from + (to - from) * rollEase(t);
};

export {glide};
