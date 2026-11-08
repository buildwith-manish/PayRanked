import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {C, F} from '../theme';
import {Env, Sync, radialTexture} from '../three/scene';
import {drop, glide, tween} from '../motion';
import {MotionBlur} from './MotionBlur';

const COIN_T = 22; // thickness
const PITCH = 25; // spacing between coins
const CAM_PITCH = 14; // how many degrees the camera looks down on the stack
const COIN_FOV = 22;

/** Same box as the old flat stack, so the layouts around it did not have to move. */
const box = (max: number, width: number) => ({w: width + 140, h: max * 26 + 40});

const cameraFor = (max: number, width: number) => {
  const {w, h} = box(max, width);
  const cam = new THREE.PerspectiveCamera(COIN_FOV, w / h, 10, 5000);
  const dist = h / 2 / Math.tan((COIN_FOV * Math.PI) / 360);
  const target = new THREE.Vector3(0, (max * PITCH) / 2, 0);
  const a = (CAM_PITCH * Math.PI) / 180;
  cam.position.set(0, target.y + dist * Math.sin(a), dist * Math.cos(a));
  cam.lookAt(target);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return cam;
};

/**
 * Stack of real 3D coins: metal with studio reflections, a milled rim and an embossed face, a soft contact shadow and a
 * coloured light pool underneath. `count` is the current (possibly fractional) number of coins; each coin drops in and
 * flips with a 3-frame stagger once `appearAt` is reached. `refLineAt` marks the $100,000 height with a neutral ring.
 */
export const CoinStack: React.FC<{
  count: number;
  max?: number;
  appearAt?: number;
  color?: string;
  refLineAt?: number;
  width?: number;
}> = ({count, max = 14, appearAt = 0, color = C.mint, refLineAt, width = 170}) => {
  const frame = useCurrentFrame();
  const {w, h} = box(max, width);
  const R = width / 2 - 8;
  const cx = width / 2 - w / 2; // stack sits at the left of the box, label room on the right

  const cam = useMemo(() => cameraFor(max, width), [max, width]);
  const tint = useMemo(() => new THREE.Color(color), [color]);
  const dark = useMemo(() => tint.clone().multiplyScalar(0.55), [tint]);

  // Each coin has its own curves: it falls under gravity with one bounce (drop), spins and settles (glide), squashes for
  // two frames when it lands and the light pool under the stack pulses on every landing (follow-through).
  const FALL = 22;
  const LAND = Math.round(FALL * 0.62);
  let fallSpeed = 0; // px per frame of the fastest falling coin, for motion blur
  let impact = 0;
  const coins: React.ReactNode[] = [];
  for (let i = 0; i < max; i++) {
    const t0 = appearAt + i * 3;
    const fall = tween(frame, t0, FALL, drop);
    const spin = tween(frame, t0, FALL + 6, glide);
    const f = Math.max(0, Math.min(1, count - i));
    if (frame < t0 || f <= 0.02) continue;
    fallSpeed = Math.max(fallSpeed, Math.abs(tween(frame, t0, FALL, drop) - tween(frame - 1, t0, FALL, drop)) * 220);
    const since = frame - (t0 + LAND);
    if (since >= 0) impact += Math.exp(-since / 5);
    const sq = since >= 0 ? 0.14 * Math.exp(-since / 3) : 0;
    const s = 0.35 + 0.65 * f;
    coins.push(
      <group
        key={i}
        position={[cx, i * PITCH + COIN_T / 2 + (1 - fall) * 220, 0]}
        rotation={[(1 - spin) * Math.PI * 1.3, 0, (1 - spin) * 0.4]}
        scale={[s * (1 + sq * 0.5), s * (1 - sq), s * (1 + sq * 0.5)]}
      >
        {/* body */}
        <mesh castShadow>
          <cylinderGeometry args={[R, R, COIN_T, 72]} />
          <meshPhysicalMaterial color={tint} metalness={0.92} roughness={0.26} clearcoat={0.4} clearcoatRoughness={0.25} envMapIntensity={1.5} />
        </mesh>
        {/* milled rim and raised inner disc */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R - 1.2, 2.4, 10, 72]} />
          <meshPhysicalMaterial color={dark} metalness={0.95} roughness={0.3} envMapIntensity={1.4} />
        </mesh>
        <mesh position={[0, COIN_T / 2 + 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R * 0.7, 1.6, 8, 72]} />
          <meshPhysicalMaterial color={dark} metalness={0.95} roughness={0.32} envMapIntensity={1.4} />
        </mesh>
        <mesh position={[0, COIN_T / 2 + 0.1, 0]}>
          <cylinderGeometry args={[R * 0.62, R * 0.62, 0.6, 64]} />
          <meshPhysicalMaterial color={tint} metalness={0.9} roughness={0.2} envMapIntensity={1.6} />
        </mesh>
      </group>
    );
  }
  const poolPulse = Math.min(1, impact);

  const refY = refLineAt !== undefined ? refLineAt * PITCH + 2 : undefined;
  // screen position of the right end of the reference ring, for the DOM label
  const labelY = useMemo(() => {
    if (refY === undefined) return 0;
    const v = new THREE.Vector3(cx + R + 14, refY, 0).project(cam);
    return ((1 - v.y) / 2) * h;
  }, [cam, cx, R, refY, h]);

  return (
    <div style={{position: 'relative', width: w, height: h}}>
      <MotionBlur dy={fallSpeed} shutter={0.35} cap={5} style={{position: 'absolute', left: 0, top: 0, width: w, height: h}}>
      <ThreeCanvas
        width={w}
        height={h}
        camera={cam}
        gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}}
        style={{position: 'absolute', left: 0, top: 0}}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[-320, 520, 520]} intensity={2.6} color="#fff1dc" />
        <directionalLight position={[380, 260, -420]} intensity={2.2} color="#5ad8ff" />
        <pointLight position={[cx, 120, 220]} intensity={40000} color={color} distance={700} decay={2} />
        <Env intensity={0.9} />

        {/* contact shadow and a pool of coloured light on the ground */}
        <mesh position={[cx, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[R * 3.2, R * 3.2]} />
          <meshBasicMaterial map={radialTexture()} color="#000000" transparent opacity={0.7} depthWrite={false} />
        </mesh>
        <mesh position={[cx, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[R * 4.4, R * 4.4]} />
          <meshBasicMaterial map={radialTexture()} color={color} transparent opacity={0.26 + 0.2 * poolPulse} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>

        {coins}

        {refY !== undefined && (
          <mesh position={[cx, refY, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[R + 14, 1.7, 8, 96]} />
            <meshBasicMaterial color={C.text} transparent opacity={0.7} toneMapped={false} />
          </mesh>
        )}
        <Sync />
      </ThreeCanvas>
      </MotionBlur>
      {refY !== undefined && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: labelY - 34,
            fontFamily: F.body,
            fontWeight: 500,
            fontSize: 22,
            color: C.text,
            opacity: 0.75,
          }}
        >
          $100,000
        </div>
      )}
    </div>
  );
};

/** Map a dollar value to a coin count: $100,000 = 10 coins. */
export const coinsFor = (dollars: number) => dollars / 10000;
