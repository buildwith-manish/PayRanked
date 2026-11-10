import React, {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {H, W} from '../theme';
import {FLOOR} from './geometry';

/**
 * Light and exposure knobs for the map scene. If a frame looks too dark or too hot after your first render, change these
 * first. Intensities are physical units (three r155+), so they look small next to the old "legacy" numbers.
 */
export const TUNE = {
  ambient: 0.25,
  hemi: 0.55,
  key: 2.6, // warm key, upper left
  rim: 2.4, // cold back light, makes the bevels read
  env: 0.55, // image-based light from the procedural studio
  shadow: 0.55, // darkness of cast shadows on the floor
  fogNear: 2600,
  fogFar: 6500,
};

/** Soft radial falloff used for glows and contact shadows. */
let radial: THREE.DataTexture | null = null;
export const radialTexture = () => {
  if (radial) return radial;
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.min(1, Math.hypot(x - c, y - c) / c);
      const a = Math.pow(1 - d, 2.2);
      const i = (y * size + x) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(a * 255);
    }
  }
  radial = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  radial.needsUpdate = true;
  return radial;
};

/** Procedural studio reflections, no files to download. Gives the metal coins and the clearcoat something to reflect. */
export const Env: React.FC<{intensity?: number}> = ({intensity = TUNE.env}) => {
  const {gl, scene} = useThree();
  useLayoutEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromScene(new RoomEnvironment(), 0.03);
    scene.environment = target.texture;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, intensity]);
  return null;
};

/**
 * Renders the scene once after every React commit. Remotion changes the props frame by frame, and this makes sure the
 * pixels on the canvas are always the ones for the frame that was just committed. Keep it last inside the canvas.
 */
export const Sync: React.FC = () => {
  const {gl, scene, camera} = useThree();
  useLayoutEffect(() => {
    gl.render(scene, camera);
  });
  return null;
};

/**
 * Places the camera by target + distance + pitch (0 = straight down) + yaw. With pitch 0, yaw 0, dist CAM_D and
 * target (0,0,0) it matches the old flat map. offsetX / offsetY slide the picture on screen (in pixels) without turning
 * the camera, which is how the zoomed state is kept left of centre.
 */
export const CameraRig: React.FC<{
  target: [number, number, number];
  dist: number;
  pitch: number;
  yaw: number;
  offsetX?: number;
  offsetY?: number;
}> = ({target, dist, pitch, yaw, offsetX = 0, offsetY = 0}) => {
  const {camera} = useThree();
  useLayoutEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    const p = (pitch * Math.PI) / 180;
    const y = (yaw * Math.PI) / 180;
    const [tx, ty, tz] = target;
    c.up.set(-Math.sin(y), Math.cos(y), 0);
    c.position.set(tx + dist * Math.sin(p) * Math.sin(y), ty - dist * Math.sin(p) * Math.cos(y), tz + dist * Math.cos(p));
    c.lookAt(tx, ty, tz);
    if (offsetX || offsetY) c.setViewOffset(W, H, offsetX, offsetY, W, H);
    else c.clearViewOffset();
    c.updateProjectionMatrix();
    c.updateMatrixWorld();
  });
  return null;
};

/** Lights, fog and a shadow-catching floor for the map scenes. `floorZ` is where the states stand. */
export const MapLights: React.FC<{
  glow?: {x: number; y: number; z: number; color: string; amount: number};
  floorZ?: number;
  floorSize?: number;
}> = ({glow, floorZ = FLOOR, floorSize = 3600}) => (
  <>
    <fog attach="fog" args={['#07162b', TUNE.fogNear, TUNE.fogFar]} />
    <ambientLight intensity={TUNE.ambient} />
    <hemisphereLight args={['#9ad7ff', '#0a1d38', TUNE.hemi]} />
    <directionalLight
      position={[-700, 650, 1100]}
      intensity={TUNE.key}
      color="#fff1dc"
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-1100}
      shadow-camera-right={1100}
      shadow-camera-top={700}
      shadow-camera-bottom={-700}
      shadow-camera-near={100}
      shadow-camera-far={4000}
      shadow-bias={-0.0004}
      shadow-radius={6}
    />
    {/* cold rim light from behind and low: lights the bevels and back edges */}
    <directionalLight position={[500, 1400, 260]} intensity={TUNE.rim} color="#5ad8ff" />
    {glow && glow.amount > 0.01 && (
      <>
        <pointLight position={[glow.x, glow.y, glow.z]} color={glow.color} intensity={42000 * glow.amount} distance={800} decay={2} />
        <sprite position={[glow.x, glow.y, glow.z]} scale={[460, 460, 1]}>
          <spriteMaterial
            map={radialTexture()}
            color={glow.color}
            opacity={0.16 * glow.amount}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            toneMapped={false}
          />
        </sprite>
      </>
    )}
    <mesh position={[0, 0, floorZ - 0.5]} receiveShadow>
      <planeGeometry args={[floorSize, floorSize * 0.7]} />
      <shadowMaterial opacity={TUNE.shadow} />
    </mesh>
    <Env />
  </>
);

/** Round pin with a pulsing ripple on the surface. `px` sizes are screen pixels; `scale` converts them to world units. */
export const Pin3D: React.FC<{
  x: number;
  y: number;
  z: number;
  drop: number; // 0-1 spring of the drop
  ring: number; // 0-1 phase of the ripple
  scale: number; // world units per screen pixel at the pin's distance
  pinPx: number;
  ringPx: number;
}> = ({x, y, z, drop, ring, scale, pinPx, ringPx}) => {
  const s = pinPx * scale;
  const r = ringPx * scale * (0.15 + ring);
  // amber pin: the lit top of a highlighted state is pale mint, so a white/mint pin vanished into it (worse when zoomed out).
  // Amber is the complement of green and already in the palette (C.amber), so it reads on both the pale top and the dark map.
  const red = useMemo(() => new THREE.Color('#FF9A1F'), []);
  const glowColor = useMemo(() => new THREE.Color('#FFB020'), []);
  return (
    <>
      {/* ripple: a dark under-ring gives the amber ring an edge against the pale state top, then the amber ring on top */}
      <mesh position={[x, y, z + 0.5]} scale={[r, r, 1]}>
        <ringGeometry args={[0.8, 1.08, 64]} />
        <meshBasicMaterial color="#06142B" transparent opacity={0.55 * (1 - ring) * Math.min(1, drop * 2)} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[x, y, z + 0.6]} scale={[r, r, 1]}>
        <ringGeometry args={[0.86, 1, 64]} />
        <meshBasicMaterial color="#FFB020" transparent opacity={Math.min(1, (1 - ring) * 1.4) * Math.min(1, drop * 2)} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <group position={[x, y, z + (1 - drop) * 90 * scale]} scale={[s * Math.min(1, drop * 1.5), s * Math.min(1, drop * 1.5), s * Math.min(1, drop * 1.5)]}>
        <mesh position={[0, 0, 0.27]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.2, 0.54, 24]} />
          <meshStandardMaterial color={red} emissive={glowColor} emissiveIntensity={0.4} roughness={0.35} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.72]} castShadow>
          <sphereGeometry args={[0.25, 32, 24]} />
          <meshStandardMaterial color={red} emissive={glowColor} emissiveIntensity={0.4} roughness={0.25} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.17, 0.8]}>
          <sphereGeometry args={[0.085, 16, 12]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      </group>
    </>
  );
};
