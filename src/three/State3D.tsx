import React, {useMemo} from 'react';
import * as THREE from 'three';
import {BEVEL_THICK, rppColor, rppOf, stateGeo} from './geometry';

const NAVY = new THREE.Color('#0b2543');

/**
 * One extruded state.
 * Height is either `grow` (0-1 of the way from the floor to its true top, plus `extra` world units) or, when `topZ` is
 * given, an absolute world z for the top face. `color` overrides the buying-power colour; `dim` (0-1) pushes the state
 * toward the dark background; `glow` adds emissive light in the state's own colour.
 */
export const State3D: React.FC<{
  name: string;
  grow?: number;
  extra?: number;
  topZ?: number;
  color?: THREE.Color;
  dim?: number;
  glow?: number;
  /** 0-1: how much of the rim outline is drawn */
  trace?: number;
  lineColor?: string;
  lineOpacity?: number;
}> = ({name, grow = 1, extra = 0, topZ, color, dim = 0, glow = 0, trace = 1, lineColor = '#E8EEF7', lineOpacity = 0.22}) => {
  const sm = stateGeo(name);
  const base = useMemo(() => color ?? rppColor(rppOf(name)), [color, name]);
  if (!sm) return null;

  const total = sm.top - sm.bottom;
  const now = topZ !== undefined ? topZ - sm.bottom : grow * total + extra;
  const sz = Math.max(0.001, now / total);

  const c = base.clone().lerp(NAVY, dim * 0.8);
  const verts = Math.floor((sm.outlineVerts * Math.min(1, Math.max(0, trace))) / 2) * 2;

  return (
    <mesh geometry={sm.geometry} position={[0, 0, sm.bottom + BEVEL_THICK]} scale={[1, 1, sz]} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={c}
        emissive={base}
        emissiveIntensity={glow * (1 - dim)}
        roughness={0.38 + dim * 0.3}
        metalness={0.12}
        clearcoat={0.6 * (1 - dim)}
        clearcoatRoughness={0.28}
        envMapIntensity={1 - dim * 0.6}
      />
      <lineSegments
        geometry={sm.outline}
        ref={(o: THREE.LineSegments | null) => {
          if (o) o.geometry.setDrawRange(0, verts);
        }}
      >
        <lineBasicMaterial color={lineColor} transparent opacity={lineOpacity} toneMapped={false} />
      </lineSegments>
    </mesh>
  );
};

/** World z of the top face right now, for placing pins and glows on a state that is still growing. */
export const currentTop = (name: string, grow: number, extra = 0) => {
  const sm = stateGeo(name);
  if (!sm) return 0;
  return sm.bottom + grow * (sm.top - sm.bottom) + extra;
};
