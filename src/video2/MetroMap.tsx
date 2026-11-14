import React from 'react';
import {useDesignFrame} from '../clock';
import {C} from '../theme';
import {glide, slam, tween} from '../motion';
import {USMap, projection} from '../components/USMap';
import {FONT, ROLE} from './system';
import {METROS} from './layout';

/** [longitude, latitude] of each metro's centre. Pins use ONLY geography: no rank, no colour by value, so nothing is spoiled. */
const LONLAT: Record<string, [number, number]> = {
  Houston: [-95.37, 29.76], Atlanta: [-84.39, 33.75], Philadelphia: [-75.17, 39.95], Dallas: [-96.8, 32.78], Phoenix: [-112.07, 33.45],
  Chicago: [-87.63, 41.88], Washington: [-77.04, 38.91], 'New York': [-74.01, 40.71], 'Los Angeles': [-118.24, 34.05], Miami: [-80.19, 25.76],
};
/** West to east, so the pins sweep across the country like a camera pan and not in countdown order. */
export const PIN_ORDER = METROS.map((m) => m.name).sort((a, b) => LONLAT[a][0] - LONLAT[b][0]);
export const PIN_STEP = 9;
const TILT = 42;
const DEPTH = 9; // stacked layers that fake the extrusion (cheap fake 3D: no WebGL, so it renders fast headless)

const SHORT: Record<string, string> = {Washington: 'Washington, DC'};

/**
 * Pseudo-3D US map: the flat states map is tilted back with CSS perspective and given thickness by stacked darker copies.
 * Ten metro pins stand upright on it and drop in, west to east, starting at `at` (design frame local to the scene).
 */
export const MetroMap: React.FC<{at: number; out: number}> = ({at, out}) => {
  const f = useDesignFrame();
  const inP = tween(f, at, 22, glide) * (1 - tween(f, out, 14));
  if (inP <= 0.001) return null;
  const rise = tween(f, at, 30, glide);
  const drift = (f - at) * 0.05; // slow push across the shot so it never sits still
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: inP, background: 'rgba(5,14,29,0.9)'}}>
      <div style={{position: 'absolute', left: 160, top: 70, fontFamily: FONT.num, fontWeight: 700, fontSize: 60, color: ROLE.buying}}>10 METRO AREAS</div>
      <div style={{position: 'absolute', left: 160, top: 150, fontFamily: FONT.text, fontWeight: 600, fontSize: 34, color: C.muted}}>not just city limits</div>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, perspective: 2200, perspectiveOrigin: '50% 30%'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformStyle: 'preserve-3d', transformOrigin: '50% 55%', transform: `translateY(${60 - rise * 20}px) scale(${0.86 + drift * 0.004}) rotateX(${TILT * rise}deg)`}}>
          {Array.from({length: DEPTH}, (_, i) => (
            <div key={i} style={{position: 'absolute', inset: 0, transform: `translateY(${(DEPTH - i) * 3 * rise}px)`}}>
              <USMap fill={() => '#0e2a4a'} stroke="rgba(0,0,0,0.35)" />
            </div>
          ))}
          <USMap fill={() => '#1c3d63'} stroke="rgba(232,238,247,0.35)" />
          {PIN_ORDER.map((name, i) => {
            const pt = projection(LONLAT[name]);
            if (!pt) return null;
            const t = at + 26 + i * PIN_STEP;
            const drop = tween(f, t, 16, slam);
            const ring = tween(f, t + 4, 26, glide);
            return (
              <div key={name} style={{position: 'absolute', left: pt[0], top: pt[1], transformStyle: 'preserve-3d', opacity: tween(f, t, 6)}}>
                <div style={{position: 'absolute', left: -40, top: -40, width: 80, height: 80, borderRadius: 40, border: `3px solid ${ROLE.buying}`, opacity: (1 - ring) * 0.9, transform: `scale(${0.3 + ring * 1.2})`}} />
                <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `rotateX(${-TILT * rise}deg)`}}>
                  <div style={{position: 'absolute', left: -13, top: -(46 + (1 - drop) * 90), width: 26, height: 26, borderRadius: 13, background: ROLE.buying, boxShadow: `0 0 26px ${ROLE.buying}`, border: '3px solid #fff'}} />
                  <div style={{position: 'absolute', left: -2, top: -22, width: 4, height: 22, background: ROLE.buying, opacity: drop}} />
                  <div style={{position: 'absolute', left: 22, top: -58 - (1 - drop) * 90, whiteSpace: 'nowrap', fontFamily: FONT.text, fontWeight: 700, fontSize: 32, color: C.text, textShadow: '0 2px 8px #000'}}>{SHORT[name] ?? name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
