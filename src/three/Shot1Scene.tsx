import React from 'react';
import {anticipate, glide, tween} from '../motion';
import * as THREE from 'three';
import {H, W, C, clamp} from '../theme';
import {CAM_D, lerp, toWorld} from './camera';
import {CameraRig, MapLights, Sync} from './scene';
import {FLOOR, rppColor, rppOf, stateGeo} from './geometry';
import {State3D} from './State3D';

const NEUTRAL = new THREE.Color('#3a5a85');
const FIT = 0.8; // how much of the 400 x 380 slot the state fills, so the height has room

/**
 * Cold open: California as a 3D state on a faint "US average" plane. It rises to the plane first; when the count lands
 * it sinks below the plane and turns red, so the number on the card is also the shape of the state.
 * The other side of the split is deliberately empty (a "?" is drawn over it in Shot1.tsx): the winner is not shown
 * until #1. Pass `leftName` to draw a second state there.
 *
 * Scale rule: when two states are shown together they share a single scale derived from the larger of their two
 * bounding boxes — same world-units-per-map-pixel for both — so a viewer's mental map of US geography is not
 * contradicted. Without this, Arkansas (tall, narrow) and California (wide) each filled their own 400×380 slot
 * and appeared nearly identical in size, which read as a data error before anyone processed the salary numbers.
 * When only one state is shown (the cold open "?" half) the per-state scale is used as before.
 */
export const Shot1Scene: React.FC<{
  frame: number;
  shapeStart: number;
  lxPx: number;
  rxPx: number;
  /** frame at which each state starts moving to its true height */
  riseA?: number;
  riseB: number;
  /** optional state for the left half; the cold open leaves it out so the winner stays hidden */
  leftName?: string;
}> = ({frame, shapeStart, lxPx, rxPx, riseA = 0, riseB, leftName}) => {
  const trace = tween(frame, shapeStart, 20, glide);
  // the states rise to the neutral plane with a long calm curve: nothing else is moving yet
  const grow = tween(frame, shapeStart + 14, 40, glide);

  // Shared scale: when two states are displayed side-by-side, derive one scale from the union of both bounding
  // boxes so they appear at the same pixels-per-mile. This preserves the viewer's geographic intuition.
  // When only California is shown (leftName absent) fall back to its own independent scale.
  const sharedScale = React.useMemo(() => {
    const smCal = stateGeo('California');
    if (!leftName || !smCal) return null;
    const smLeft = stateGeo(leftName);
    if (!smLeft) return null;
    // Use the larger of the two bounding-box dimensions to set the scale so both states fit their slot.
    const maxW = Math.max(smCal.size[0], smLeft.size[0]);
    const maxH = Math.max(smCal.size[1], smLeft.size[1]);
    const pad = Math.max(maxW, maxH) * 0.06;
    return FIT * Math.min(400 / (maxW + 2 * pad), 380 / (maxH + 2 * pad));
  }, [leftName]);

  const one = (name: string, cxPx: number, rise: number, lineColor: string) => {
    const sm = stateGeo(name);
    if (!sm) return null;
    // Use the shared scale when two states are shown; fall back to per-state scale for the solo California reveal.
    const pad = Math.max(sm.size[0], sm.size[1]) * 0.06;
    const s = sharedScale ?? FIT * Math.min(400 / (sm.size[0] + 2 * pad), 380 / (sm.size[1] + 2 * pad));
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
      {leftName && one(leftName, lxPx, riseA, C.mint)}
      {one('California', rxPx, riseB, C.red)}
      <Sync />
    </>
  );
};
