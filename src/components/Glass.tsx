import React from 'react';
import {C} from '../theme';

/**
 * Frosted glass panel: backdrop blur, a diagonal sheen, a gradient rim that is bright top-left and fades out, a thin
 * specular line along the top edge, inner shadow at the bottom and a soft drop shadow. `tint` colours the rim and glow.
 */
export const Glass: React.FC<{
  radius?: number;
  tint?: string; // #rrggbb
  strength?: number; // 0-2, how milky the glass is
  glow?: number; // px of coloured halo
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({radius = 24, tint = C.text, strength = 1, glow = 0, style, children}) => (
  <div
    style={{
      position: 'relative',
      borderRadius: radius,
      background: `linear-gradient(135deg, rgba(255,255,255,${0.14 * strength}) 0%, rgba(255,255,255,${0.04 * strength}) 52%, ${tint}${Math.round(
        20 * strength
      )
        .toString(16)
        .padStart(2, '0')} 100%)`,
      backdropFilter: 'blur(22px) saturate(1.5)',
      WebkitBackdropFilter: 'blur(22px) saturate(1.5)',
      boxShadow: [
        'inset 0 1px 0 rgba(255,255,255,0.30)',
        'inset 0 -28px 44px -24px rgba(0,0,0,0.40)',
        '0 26px 60px -12px rgba(0,0,0,0.50)',
        glow > 0 ? `0 0 ${glow}px ${tint}44` : '',
      ]
        .filter(Boolean)
        .join(', '),
      ...style,
    }}
  >
    {children}
    {/* gradient rim, drawn as a masked ring so the glass stays see-through */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: radius,
        padding: 2,
        background: `linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.10) 38%, ${tint}00 62%, ${tint}99 100%)`,
        WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        WebkitMaskComposite: 'xor',
        // NOTE: 'mask' with the 'exclude' keyword is NOT supported in Chromium (the engine Remotion
        // renders with). Using it alongside the -webkit variant caused the rim to render as a filled
        // opaque rectangle instead of a transparent ring. The -webkit version with 'xor' is sufficient.
        pointerEvents: 'none',
      }}
    />
    {/* specular line */}
    <div
      style={{
        position: 'absolute',
        left: radius * 0.6,
        right: radius * 0.6,
        top: 1,
        height: 1.5,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
        opacity: 0.7,
        pointerEvents: 'none',
      }}
    />
  </div>
);
