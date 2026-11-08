import React from 'react';
import {anticipate, glide, tween} from '../motion';
import * as THREE from 'three';
import {H, W, C, clamp} from '../theme';
import {CAM_D, lerp, toWorld} from './camera';
import {CameraRig, MapLights, Sync} from './scene';
import {FLOOR, rppColor, rppOf, stateGeo} from './geometry';
import {State3D} from './State3D';

const NEUTRAL = new THREE.Color('#3a5a85');
const FIT = 0.8; // how much of the old 400 x 380 box the state fills, so the height has room

/**
 * Cold open: Arkansas and California as 3D states on a faint "US average" plane.
 * Both rise to the plane first. When the counts land, Arkansas climbs high and turns emerald while California sinks
 * below the plane and turns red, so the numbers on the cards are also the shape of the states.
 */
export const Shot1Scene: React.FC<{
  frame: number;
  shapeStart: number;
  lxPx: number;
  rxPx: number;
  /** frame at which each state starts moving to its true height */
  riseA: number;
  riseB: number;
}> = ({frame, shapeStart, lxPx, rxPx, riseA, riseB}) => {
  const trace = tween(frame, shapeStart, 20, glide);
  // the states rise to the neutral plane with a long calm curve: nothing else is moving yet
  const grow = tween(frame, shapeStart + 14, 40, glide);

  const one = (name: string, cxPx: number, rise: number, lineColor: string) => {
    const sm = stateGeo(name);
    if (!sm) return null;
    const pad = Math.max(sm.size[0], sm.size[1]) * 0.06;
    const s = FIT * Math.min(400 / (sm.size[0] + 2 * pad), 380 / (sm.size[1] + 2 * pad));
    const [gx, gy] = toWorld(cxPx, 300);
    // the true height: a short wind-up (the state dips a touch), then it climbs or sinks, overshoots and settles
    const b = tween(frame, rise, 46, anticipate);
    // neutral height first (the plane), then the true height
    const topNeutral = lerp(sm.bottom, 0, grow);
    const topZ = lerp(topNeutral, sm.top, b);
    const color = NEUTRAL.clone().lerp(rppColor(rppOf(name)), clamp(b * 1.2));
    return (
      <group position={[gx, gy, 0]} scale={[s, s, s]}>
        <group position={[-sm.center[0], -sm.center[1], 0]}>
          <State3D name={name} topZ={topZ} color={color} glow={0.35 * Math.max(0, b)} trace={trace} lineColor={lineColor} lineOpacity={0.95} />
        </group>
        {/* shadow catcher under this state */}
        <mesh position={[0, 0, FLOOR - 0.5]} receiveShadow>
          <planeGeometry args={[900, 700]} />
          <shadowMaterial opacity={0.5} />
        </mesh>
      </group>
    );
  };

  const grid = React.useMemo(() => {
    const g = new THREE.GridHelper(2200, 44, C.mint, C.mint);
    const m = g.material as THREE.LineBasicMaterial;
    m.transparent = true;
    m.opacity = 0.14;
    m.toneMapped = false;
    g.rotation.x = Math.PI / 2;
    return g;
  }, []);

  const mid = toWorld(W / 2, 300);
  return (
    <>
      <MapLights floorZ={-2000} floorSize={1} />
      <CameraRig
        target={[0, mid[1], 0]}
        dist={CAM_D * 1.0}
        pitch={lerp(36, 30, tween(frame, shapeStart, 60, glide))}
        yaw={Math.sin(frame / 70) * 3}
        offsetY={H / 2 - 300}
      />
      <primitive object={grid} position={[0, mid[1], 0]} />
      {one('Arkansas', lxPx, riseA, C.mint)}
      {one('California', rxPx, riseB, C.red)}
      <Sync />
    </>
  );
};
