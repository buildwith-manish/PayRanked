import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {geoPath} from 'd3-geo';
import {useDesignFrame} from '../clock';
import {C, H, W} from '../theme';
import {glide, slam, tween} from '../motion';
import {FEATURES, GEO, USMap, projection} from '../components/USMap';
import {FONT, ROLE, TYPE} from './system';
import {METROS} from './layout';
import {Sync, radialTexture} from '../three/scene';
import {FOV, toWorld} from '../three/camera';

/** true = real 3D map (react-three-fiber). false = the old CSS-tilt map (MetroMapCss below), kept so it can be switched back. */
const USE_3D_MAP = true;

/** [longitude, latitude] of each metro's centre. Pins use ONLY geography: no rank, no colour by value, so nothing is spoiled. */
export const LONLAT: Record<string, [number, number]> = {
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
const MetroMapCss: React.FC<{at: number; out: number}> = ({at, out}) => {
  const f = useDesignFrame();
  const inP = tween(f, at, 22, glide) * (1 - tween(f, out, 14));
  if (inP <= 0.001) return null;
  const rise = tween(f, at, 30, glide);
  const drift = (f - at) * 0.05; // slow push across the shot so it never sits still
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: inP, background: 'rgba(5,14,29,0.97)'}}>
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

/* ------------------------------------------------------------------ 3D metro map */
/** World space is the same as the old flat map (x right, y up, z toward the viewer, origin at screen centre); the states stand on z = 0. */
const MAP_DEPTH = 12; // extrusion height of the states, world units
const SIMPLIFY = 1.2; // drop outline points closer than this (px) to the last kept one: the 10m atlas is far finer than the screen needs
const MIN_RING_AREA = 12; // px^2, smaller islands are dropped
const COL = {top: '#0c2342', edge: '#1f4a78', outline: C.emerald, glow: ROLE.buying};

type Pt = [number, number];
const ringArea = (r: Pt[]) => {
  let a = 0;
  for (let i = 0; i < r.length; i++) {
    const [x1, y1] = r[i];
    const [x2, y2] = r[(i + 1) % r.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
};
const inside = (p: Pt, r: Pt[]) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if (r[i][1] > p[1] !== r[j][1] > p[1] && p[0] < ((r[j][0] - r[i][0]) * (p[1] - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c;
  }
  return c;
};
const simplify = (r: Pt[]) => {
  const out: Pt[] = [r[0]];
  for (let i = 1; i < r.length; i++) if (Math.hypot(r[i][0] - out[out.length - 1][0], r[i][1] - out[out.length - 1][1]) >= SIMPLIFY) out.push(r[i]);
  return out;
};

/** Projected state outlines (same d3 projection as USMap) -> rings in world coordinates. */
const stateRings = (feat: unknown) => {
  const raw: Pt[][] = [];
  let cur: Pt[] = [];
  const ctx = {
    moveTo: (x: number, y: number) => { cur = [[x, y]]; raw.push(cur); },
    lineTo: (x: number, y: number) => { cur.push([x, y]); },
    closePath: () => {},
    arc: () => {},
    rect: () => {},
  };
  geoPath(projection, ctx as never)(feat as never);
  const rings = raw
    .map((r) => (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1] ? r.slice(0, -1) : r))
    .filter((r) => r.length >= 3 && Math.abs(ringArea(r)) >= MIN_RING_AREA)
    .map(simplify)
    .filter((r) => r.length >= 3);
  return rings;
};

type MapBuild = {caps: THREE.BufferGeometry; sides: THREE.BufferGeometry; outline: THREE.BufferGeometry; tris: number};
let built: MapBuild | null = null;
/** Builds every extruded state and one merged outline geometry. Runs once per page (module cache + useMemo), never per frame. */
const buildMap = (): MapBuild => {
  if (built) return built;
  const capPos: number[] = [], capNor: number[] = [], sidePos: number[] = [], sideNor: number[] = [];
  const lines: number[] = [];
  for (const feat of FEATURES) {
    const rings = stateRings(feat);
    if (!rings.length) continue;
    const sign = Math.sign(ringArea(rings.reduce((a, b) => (Math.abs(ringArea(b)) > Math.abs(ringArea(a)) ? b : a))));
    const outers = rings.filter((r) => Math.sign(ringArea(r)) === sign);
    const holes = rings.filter((r) => Math.sign(ringArea(r)) !== sign);
    for (const outer of outers) {
      const shape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(...toWorld(x, y))));
      for (const h of holes) if (inside(h[0], outer)) shape.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(...toWorld(x, y)))));
      // ExtrudeGeometry is non-indexed: group 0 = caps (bottom lid first, then top lid), group 1 = side walls.
      // The bottom lid is never seen, so only the top lid and the walls are kept, and everything goes into two merged buffers.
      const g = new THREE.ExtrudeGeometry(shape, {depth: MAP_DEPTH, bevelEnabled: false, curveSegments: 1});
      const pos = g.attributes.position.array as Float32Array;
      const nor = g.attributes.normal.array as Float32Array;
      const capVerts = g.groups[0].count;
      const top = capVerts / 2;
      for (let i = top * 3; i < capVerts * 3; i++) { capPos.push(pos[i]); capNor.push(nor[i]); }
      for (let i = capVerts * 3; i < pos.length; i++) { sidePos.push(pos[i]); sideNor.push(nor[i]); }
      g.dispose();
      for (const r of [outer, ...holes.filter((h) => inside(h[0], outer))]) {
        for (let i = 0; i < r.length; i++) {
          const a = toWorld(...r[i]);
          const b = toWorld(...r[(i + 1) % r.length]);
          lines.push(a[0], a[1], MAP_DEPTH + 0.3, b[0], b[1], MAP_DEPTH + 0.3);
        }
      }
    }
  }
  const outline = new THREE.BufferGeometry();
  outline.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
  const mk = (p: number[], n: number[]) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
    return geo;
  };
  built = {caps: mk(capPos, capNor), sides: mk(sidePos, sideNor), outline, tris: (capPos.length + sidePos.length) / 9};
  return built;
};

/** Pin marker geometry in unit scale (ball radius 1, axis = +z), shared by all ten pins. */
let pinGeo: {ball: THREE.SphereGeometry; stem: THREE.CylinderGeometry; plane: THREE.PlaneGeometry; ring: THREE.RingGeometry} | null = null;
const getPinGeo = () => {
  if (pinGeo) return pinGeo;
  const stem = new THREE.CylinderGeometry(0.16, 0.16, 2.6, 10);
  stem.rotateX(Math.PI / 2);
  pinGeo = {ball: new THREE.SphereGeometry(1, 20, 14), stem, plane: new THREE.PlaneGeometry(2, 2), ring: new THREE.RingGeometry(0.93, 1, 64)};
  return pinGeo;
};

const PIN_R = 11; // ball radius in world units at camera distance PIN_REF_D: keeps the pins ~14 px on screen at any distance
const PIN_REF_D = 1500;
const DROP_H = 320;
const STEM = 2.6;
/** The camera passes each pin this many frames after its drop starts, i.e. as it lands. */
const PASS_LAG = 8;
const FLIGHT_END = 138; // frames after `at`: the camera is at the wide shot
const WIDE = {dist: 2000, pitch: 41};

const pinWorld = (name: string): [number, number] => {
  const p = projection(LONLAT[name]) as [number, number];
  return toWorld(p[0], p[1]);
};
const PIN_XY = PIN_ORDER.map(pinWorld);
const Y_MID = PIN_XY.reduce((a, p) => a + p[1], 0) / PIN_XY.length;
const X_MID = (Math.min(...PIN_XY.map((p) => p[0])) + Math.max(...PIN_XY.map((p) => p[0]))) / 2;

type Key = {t: number; look: THREE.Vector3; pos: THREE.Vector3; dist: number};
const keyOf = (t: number, x: number, y: number, dist: number, pitch: number): Key => {
  const p = (pitch * Math.PI) / 180;
  const look = new THREE.Vector3(x, y, MAP_DEPTH);
  return {t, look, pos: new THREE.Vector3(x, y - dist * Math.sin(p), MAP_DEPTH + dist * Math.cos(p)), dist};
};

/** Label side per city, as the label's screen offset direction (+1 right / -1 left, +1 down / -1 up). Keeps the dense north-east apart. */
const LABEL_DIR: Record<string, [number, number]> = {
  'Los Angeles': [-1, 0], Phoenix: [0, 1.7], Dallas: [-1, 0], Houston: [-1, 0], Chicago: [-1, 0], Atlanta: [-1, 0],
  Miami: [1, 0], Washington: [-1, 1.3], Philadelphia: [1, 1], 'New York': [1, -1],
};

const MetroMap3D: React.FC<{at: number; out: number}> = ({at, out}) => {
  const f = useDesignFrame();
  const inP = tween(f, at, 22, glide) * (1 - tween(f, out, 14));
  const mounted = f > at - 4 && f < out + 15; // mounts a few frames early (invisible) so GL setup is not paid on the first visible frame
  // geometry, materials, curves and the projection camera are all built once
  const map = useMemo(() => buildMap(), []);
  const pg = useMemo(() => getPinGeo(), []);
  const mats = useMemo(
    () => ({
      cap: new THREE.MeshLambertMaterial({color: COL.top}),
      side: new THREE.MeshLambertMaterial({color: COL.edge}),
      outline: new THREE.LineBasicMaterial({color: COL.outline, transparent: true, opacity: 0.9, toneMapped: false}),
      pin: new THREE.MeshStandardMaterial({color: ROLE.buying, emissive: ROLE.buying, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.2}),
    }),
    [],
  );
  const flight = useMemo(() => {
    const keys: Key[] = [];
    keys.push(keyOf(at, X_MID - 620, Y_MID - 120, 1500, 47));
    PIN_XY.forEach(([x, y], i) => {
      const k = i / (PIN_XY.length - 1); // 0..1 along the flight: the slow push-in and the gentle tilt both ride on this
      keys.push(keyOf(at + 26 + i * PIN_STEP + PASS_LAG, x, y + (Y_MID - y) * 0.3, 1080 - 280 * k, 45 - 6 * k));
    });
    keys.push(keyOf(at + FLIGHT_END, X_MID, Y_MID + 10, WIDE.dist, WIDE.pitch));
    const mk = (get: (k: Key) => THREE.Vector3) => new THREE.CatmullRomCurve3(keys.map((k) => get(k).clone()), false, 'centripetal');
    return {keys, pos: mk((k) => k.pos), look: mk((k) => k.look)};
  }, [at]);
  const projCam = useMemo(() => new THREE.PerspectiveCamera(FOV, W / H, 10, 9000), []);

  if (!mounted) return null;

  // ---- camera: one spline, passing each pin as it lands, easing only at the very start and into the wide shot
  const {keys} = flight;
  let seg = 0;
  while (seg < keys.length - 2 && f >= keys[seg + 1].t) seg++;
  let frac = Math.min(1, Math.max(0, (f - keys[seg].t) / (keys[seg + 1].t - keys[seg].t)));
  if (seg === keys.length - 2) frac = 1 - Math.pow(1 - frac, 2); // settle into the wide shot
  const u = (seg + frac) / (keys.length - 1);
  const camPos = flight.pos.getPoint(u);
  const camLook = flight.look.getPoint(u);
  // slow push-in that carries on through the hold on the wide shot
  const hold = tween(f, at + FLIGHT_END, out + 14 - (at + FLIGHT_END), (t) => t);
  camPos.sub(camLook).multiplyScalar(1 - 0.05 * hold).add(camLook);
  const camDist = camPos.distanceTo(camLook);
  const S = (PIN_R * Math.min(1.7, Math.max(0.55, camDist / PIN_REF_D)));

  projCam.position.copy(camPos);
  projCam.up.set(0, 1, 0);
  projCam.lookAt(camLook);
  projCam.updateProjectionMatrix();
  projCam.updateMatrixWorld();

  const pins = PIN_ORDER.map((name, i) => {
    const [x, y] = PIN_XY[i];
    const t = at + 26 + i * PIN_STEP;
    const drop = tween(f, t, 16, slam);
    return {name, x, y, drop, show: tween(f, t, 6), ring: tween(f, t + 4, 26, glide)};
  });
  const labels = pins.map((p) => {
    const lift = (1 - Math.min(1, p.drop)) * DROP_H;
    const v = new THREE.Vector3(p.x, p.y, MAP_DEPTH + lift + (STEM + 1) * S).project(projCam);
    return {...p, sx: ((v.x + 1) / 2) * W, sy: ((1 - v.y) / 2) * H};
  });

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: Math.max(0, inP), background: 'rgba(5,14,29,0.97)'}}>
      <ThreeCanvas width={W} height={H} camera={{fov: FOV, near: 10, far: 9000, position: [camPos.x, camPos.y, camPos.z]}} gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}} style={{position: 'absolute', left: 0, top: 0}}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[-700, -600, 1300]} intensity={2.2} color="#fff1dc" />
        <CameraSet pos={camPos} look={camLook} />

        <mesh geometry={map.caps} material={mats.cap} />
        <mesh geometry={map.sides} material={mats.side} />
        <lineSegments geometry={map.outline} material={mats.outline} />

        {pins.map((p) => {
          const lift = (1 - Math.min(1, p.drop)) * DROP_H;
          const grow = Math.max(0, Math.min(1.15, 0.45 + 0.55 * p.drop)) * (p.show > 0 ? 1 : 0);
          const rs = S * (3 + p.ring * 8);
          return (
            <React.Fragment key={p.name}>
              {/* soft glow on the ground under the pin */}
              <mesh geometry={pg.plane} position={[p.x, p.y, MAP_DEPTH + 0.5]} scale={[S * 6.5, S * 6.5, 1]} renderOrder={2}>
                <meshBasicMaterial map={radialTexture()} color={COL.glow} transparent opacity={0.6 * p.show * (0.8 + 0.2 * Math.min(1, p.drop))} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
              </mesh>
              {/* ring pulse on the surface */}
              <mesh geometry={pg.ring} position={[p.x, p.y, MAP_DEPTH + 0.8]} scale={[rs, rs, 1]} renderOrder={3}>
                <meshBasicMaterial color={ROLE.buying} transparent opacity={(1 - p.ring) * 0.9 * (p.drop > 0.5 ? 1 : 0)} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
              </mesh>
              <group position={[p.x, p.y, MAP_DEPTH + lift]} scale={[S * grow, S * grow, S * grow]}>
                <mesh geometry={pg.stem} material={mats.pin} position={[0, 0, STEM / 2]} />
                <mesh geometry={pg.ball} material={mats.pin} position={[0, 0, STEM + 1]} />
              </group>
            </React.Fragment>
          );
        })}
        <Sync />
      </ThreeCanvas>
      {/* billboarded labels: projected through the exact same camera, so they always face it and stay one readable size */}
      {labels.map((p) => {
        const [dx, dy] = LABEL_DIR[p.name] ?? [1, 0];
        return (
          <div
            key={p.name}
            style={{
              position: 'absolute', left: p.sx + dx * 26, top: p.sy + dy * 22, opacity: p.show, whiteSpace: 'nowrap',
              transform: `translate(${dx < 0 ? '-100%' : dx === 0 ? '-50%' : '0'}, -50%)`,
              fontFamily: FONT.text, fontWeight: 700, fontSize: TYPE.label * 0.8, color: C.text, textShadow: '0 2px 8px #000',
            }}
          >
            {SHORT[p.name] ?? p.name}
          </div>
        );
      })}
      <MapHeader />
    </div>
  );
};

/** Places the camera on every commit (Remotion changes the props frame by frame). */
const CameraSet: React.FC<{pos: THREE.Vector3; look: THREE.Vector3}> = ({pos, look}) => {
  const {camera} = useThree() as {camera: THREE.PerspectiveCamera};
  useLayoutEffect(() => {
    camera.position.copy(pos);
    camera.up.set(0, 1, 0);
    camera.lookAt(look);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  });
  return null;
};

/** The title and caption: plain 2D, above the canvas. */
const MapHeader: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: 160, top: 70, fontFamily: FONT.num, fontWeight: 700, fontSize: 60, color: ROLE.buying}}>10 METRO AREAS</div>
    <div style={{position: 'absolute', left: 160, top: 150, fontFamily: FONT.text, fontWeight: 600, fontSize: 34, color: C.muted}}>not just city limits</div>
  </>
);

/** Metro map moment. Switch USE_3D_MAP to go back to the CSS-tilt version. Timing (`at`, `out`) comes from methodBeats(). */
export const MetroMap: React.FC<{at: number; out: number}> = ({at, out}) => (USE_3D_MAP ? <MetroMap3D at={at} out={out} /> : <MetroMapCss at={at} out={out} />);

/* ------------------------------------------------------------------ locator map for the countdown shots */
const BB = GEO.reduce(
  (b, g) => [Math.min(b[0], g.bounds[0][0]), Math.min(b[1], g.bounds[0][1]), Math.max(b[2], g.bounds[1][0]), Math.max(b[3], g.bounds[1][1])],
  [Infinity, Infinity, -Infinity, -Infinity] as number[],
);
const BW = BB[2] - BB[0], BH = BB[3] - BB[1];
const loc = (name: string) => projection(LONLAT[name]) as [number, number];

/**
 * Small flat US map for one countdown shot: this city's pin drops in at `at` and keeps pulsing; cities already revealed stay as faint dots;
 * the NEXT city shows only as an unlabeled pulsing ring from `nextAt` (a hint, never a name). Geography only: no values, so no spoilers beyond the teaser.
 */
export const LocatorMap: React.FC<{name: string; at: number; done: string[]; next?: string; nextAt: number; width?: number; frame?: number}> = ({name, at, done, next, nextAt, width = 240, frame}) => {
  // `frame` lets a persistent parent (CountdownNav) drive this with a scene-local frame it computed itself,
  // instead of this component reading the design clock directly (which would be the *global* frame if this
  // were ever rendered outside its own <Sequence>).
  const own = useDesignFrame();
  const f = frame ?? own;
  const h = (width * BH) / BW;
  const k = BW / width; // user units per px
  const drop = tween(f, at, 16, slam);
  const cyc = ((f - at) % 45) / 45;
  const here = loc(name);
  const nx = next ? loc(next) : null;
  const nextP = tween(f, nextAt, 14, glide);
  const nCyc = ((f - nextAt) % 40) / 40;
  return (
    <div style={{width: width + 28, height: h + 28, boxSizing: 'border-box', padding: 14, borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)'}}>
      <svg width={width} height={h} viewBox={`${BB[0]} ${BB[1]} ${BW} ${BH}`} style={{display: 'block', overflow: 'visible'}}>
        {GEO.map((g) => <path key={g.name} d={g.d} fill="rgba(141,162,187,0.2)" stroke="rgba(232,238,247,0.32)" strokeWidth={1.1 * k} />)}
        {done.map((n) => {
          const [x, y] = loc(n);
          return <circle key={n} cx={x} cy={y} r={3.2 * k} fill={C.muted} opacity={0.55} />;
        })}
        {nx && nextP > 0 && (
          <>
            <circle cx={nx[0]} cy={nx[1]} r={4 * k} fill="none" stroke={ROLE.buying} strokeWidth={1.4 * k} opacity={0.8 * nextP} />
            <circle cx={nx[0]} cy={nx[1]} r={(4 + nCyc * 12) * k} fill="none" stroke={ROLE.buying} strokeWidth={1.2 * k} opacity={(1 - nCyc) * 0.7 * nextP} />
          </>
        )}
        {f >= at && (
          <>
            <circle cx={here[0]} cy={here[1]} r={(5 + cyc * 20) * k} fill="none" stroke={ROLE.buying} strokeWidth={1.6 * k} opacity={(1 - cyc) * 0.9} />
            <circle cx={here[0]} cy={here[1] - (1 - drop) * 30 * k} r={5.2 * k} fill={ROLE.buying} stroke="#fff" strokeWidth={1.5 * k} opacity={tween(f, at, 5)} />
          </>
        )}
      </svg>
    </div>
  );
};
