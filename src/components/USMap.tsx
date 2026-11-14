import React, {useMemo} from 'react';
import {geoAlbersUsa, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import us from 'us-atlas/states-10m.json';
import {W, H, MARGIN} from '../theme';

type Feat = {type: 'Feature'; properties: {name: string}; geometry: any; id?: string};

export const projection = geoAlbersUsa().fitExtent(
  [
    [MARGIN, MARGIN],
    [W - MARGIN, H - MARGIN],
  ],
  feature(us as any, (us as any).objects.nation) as any
);
const path = geoPath(projection);

export const FEATURES: Feat[] = (feature(us as any, (us as any).objects.states) as any).features;

export type Bounds = [[number, number], [number, number]];
export type MapGeo = {name: string; d: string; centroid: [number, number]; bounds: Bounds};

export const GEO: MapGeo[] = FEATURES.map((f) => ({
  name: f.properties.name,
  d: path(f as any) ?? '',
  centroid: path.centroid(f as any) as [number, number],
  bounds: path.bounds(f as any) as Bounds,
}));

export const geoOf = (name: string) => {
  const g = GEO.find((x) => x.name === name);
  if (!g) throw new Error(`No map shape for ${name}`);
  return g;
};

/**
 * Full US map. fill() colours each state, dim() gives 0-1 opacity, draw() gives 0-1 stroke-draw progress
 * (used for the "outline traces itself" effect on highlighted states).
 */
export const USMap: React.FC<{
  fill?: (name: string) => string;
  opacity?: (name: string) => number;
  draw?: (name: string) => number;
  stroke?: string;
  glow?: string[];
}> = ({fill = () => 'rgba(141,162,187,0.18)', opacity = () => 1, draw, stroke = 'rgba(232,238,247,0.35)', glow = [] as string[]}) => {
  const shapes = useMemo(() => GEO, []);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <filter id="stateGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {shapes.map((g) => {
        const p = draw ? draw(g.name) : 1;
        const isGlow = glow.includes(g.name);
        return (
          <path
            key={g.name}
            d={g.d}
            fill={fill(g.name)}
            fillOpacity={draw ? Math.max(0, (p - 0.6) / 0.4) : 1}
            stroke={stroke}
            strokeWidth={isGlow ? 3 : 1}
            pathLength={1}
            strokeDasharray={draw ? 1 : undefined}
            strokeDashoffset={draw ? 1 - p : undefined}
            opacity={opacity(g.name)}
            filter={isGlow ? 'url(#stateGlow)' : undefined}
          />
        );
      })}
    </svg>
  );
};
