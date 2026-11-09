import * as THREE from 'three';
import {toCreasedNormals} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {geoOf} from '../components/USMap';
import {STATES} from '../data';
import {toWorld} from './camera';

/**
 * Turns the existing 2D map paths into extruded, bevelled 3D states.
 * Reading the SVG path strings (instead of re-projecting raw coordinates) keeps the 3D map pixel-aligned with the old
 * 2D map and keeps d3's clipping for Alaska, Hawaii and the Aleutians.
 */

/** World units of height per BEA price-index point. Arkansas (cheapest) is the tallest, California the lowest. */
export const K = 6;
/** Bevel: the flat cap is inset by BEVEL_SIZE and the rim sits on the real outline. */
export const BEVEL_SIZE = 2;
export const BEVEL_THICK = 2.6;

type P = [number, number];

const R_MIN = Math.min(...STATES.map((s) => s.rpp));
const R_MAX = Math.max(...STATES.map((s) => s.rpp));

/** BEA index of a feature. DC and Puerto Rico are not in the data set, so they sit at the neutral 100. */
export const rppOf = (name: string) => STATES.find((s) => s.name === name)?.rpp ?? 100;

/** Height of the top face above the "US average" plane (z = 0). Above average buying power goes up, below goes down. */
export const topOf = (name: string) => (100 - rppOf(name)) * K;

/** Floor every state stands on, a little below the lowest top. */
export const FLOOR = Math.min(...STATES.map((s) => (100 - s.rpp) * K)) - 18;

const STOPS: [number, string][] = [
  [0, '#19C37D'], // emerald: most buying power
  [0.3, '#1B8F8A'],
  [0.55, '#2F5E8C'], // neutral slate-blue in the middle so the two ends carry all the colour
  [0.8, '#7A4A7A'],
  [1, '#FF5C5C'], // red: least buying power
];

/** Colour of a state by buying power, emerald to red. */
export const rppColor = (rpp: number) => {
  const t = Math.min(1, Math.max(0, (rpp - R_MIN) / (R_MAX - R_MIN)));
  for (let i = 1; i < STOPS.length; i++) {
    if (t <= STOPS[i][0]) {
      const [t0, c0] = STOPS[i - 1];
      const [t1, c1] = STOPS[i];
      return new THREE.Color(c0).lerp(new THREE.Color(c1), (t - t0) / (t1 - t0));
    }
  }
  return new THREE.Color(STOPS[STOPS.length - 1][1]);
};

const area = (r: P[]) => {
  let a = 0;
  for (let i = 0; i < r.length; i++) {
    const [x0, y0] = r[i];
    const [x1, y1] = r[(i + 1) % r.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
};

const inside = ([x, y]: P, r: P[]) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i];
    const [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

/** d3-geo writes "M x,y L x,y ... Z" per ring. */
export const parseRings = (d: string): P[][] => {
  const rings: P[][] = [];
  let cur: P[] | null = null;
  const re = /([MLZ])([^MLZ]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    if (m[1] === 'Z') {
      if (cur && cur.length > 2) rings.push(cur);
      cur = null;
      continue;
    }
    const [x, y] = m[2].split(/[ ,]+/).filter(Boolean).map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (m[1] === 'M') cur = [[x, y]];
    else cur?.push([x, y]);
  }
  if (cur && cur.length > 2) rings.push(cur);
  return rings;
};

/** Drops points closer than `min` px to the last kept one. */
const decimate = (r: P[], min = 0.7): P[] => {
  const out: P[] = [r[0]];
  for (let i = 1; i < r.length; i++) {
    const [x, y] = out[out.length - 1];
    if (Math.hypot(r[i][0] - x, r[i][1] - y) >= min) out.push(r[i]);
  }
  return out;
};

/**
 * Relaxes the pixel stair-steps out of a coastline: each point moves toward the midpoint of its neighbours
 * ([1 2 1] / 4, two passes), except at corners and on long straight borders. Neighbouring states share the same border points, and the kernel is symmetric, so
 * shared borders come out identical on both sides and no gaps open up between states.
 */
const smoothRing = (r: P[], passes = 2): P[] => {
  // Corners and long straight borders must not move: only relax points on short, gently turning runs (a coastline).
  const fixed = r.map((p, i) => {
    const a = r[(i - 1 + r.length) % r.length];
    const b = r[(i + 1) % r.length];
    const la = Math.hypot(p[0] - a[0], p[1] - a[1]);
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    if (Math.max(la, lb) > 4) return true;
    const turn = Math.abs(Math.atan2(p[0] - a[0], p[1] - a[1]) - Math.atan2(b[0] - p[0], b[1] - p[1]));
    return Math.min(turn, 2 * Math.PI - turn) > 1.25; // sharper than about 70 degrees is a real corner
  });
  let cur = r;
  for (let k = 0; k < passes; k++) {
    cur = cur.map((p, i) => {
      if (fixed[i]) return p;
      const a = cur[(i - 1 + cur.length) % cur.length];
      const b = cur[(i + 1) % cur.length];
      return [0.25 * a[0] + 0.5 * p[0] + 0.25 * b[0], 0.25 * a[1] + 0.5 * p[1] + 0.25 * b[1]] as P;
    });
  }
  return cur;
};

export type StateGeo = {
  name: string;
  /** world z of the top face at full height */
  top: number;
  /** world z of the bottom face */
  bottom: number;
  /** straight wall height, between the two bevels */
  depth: number;
  geometry: THREE.ExtrudeGeometry;
  /** line segments tracing the rim, in order around each ring (so a draw range traces it) */
  outline: THREE.BufferGeometry;
  outlineVerts: number;
  /** map centroid in world units */
  centroid: [number, number];
  /** map bounds centre and size in world units */
  center: [number, number];
  size: [number, number];
};

const cache = new Map<string, StateGeo | null>();

export const stateGeo = (name: string): StateGeo | null => {
  if (cache.has(name)) return cache.get(name) ?? null;
  const g = geoOf(name);
  const rings = parseRings(g.d)
    .map((r) => smoothRing(decimate(r)))
    .filter((r) => r.length >= 3 && Math.abs(area(r)) >= 6)
    .sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)));
  if (!rings.length) {
    cache.set(name, null);
    return null;
  }

  // The biggest ring fixes which winding is an outer ring; opposite winding means a hole.
  const sign = Math.sign(area(rings[0]));
  const outers: {ring: P[]; holes: P[][]}[] = [];
  for (const r of rings) {
    if (Math.sign(area(r)) === sign) outers.push({ring: r, holes: []});
    else outers.find((o) => inside(r[0], o.ring))?.holes.push(r);
  }

  const v2 = ([x, y]: P) => {
    const [wx, wy] = toWorld(x, y);
    return new THREE.Vector2(wx, wy);
  };
  const shapes = outers.map((o) => {
    const s = new THREE.Shape(o.ring.map(v2));
    o.holes.forEach((h) => s.holes.push(new THREE.Path(h.map(v2))));
    return s;
  });

  const top = topOf(name);
  const bottom = FLOOR;
  const depth = Math.max(2, top - bottom - 2 * BEVEL_THICK);
  const raw = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelSize: BEVEL_SIZE,
    bevelOffset: -BEVEL_SIZE,
    bevelThickness: BEVEL_THICK,
    bevelSegments: 3,
    curveSegments: 1,
    steps: 1,
  });
  // Smooth the shading along coastlines. ExtrudeGeometry gives every wall facet its own flat normal, so a jagged
  // coast catches the light as vertical stripes. Blending normals across angles under 50 degrees removes the banding
  // while the 90 degree edges (top face to wall) and real corners (state borders) stay crisp.
  const geometry = toCreasedNormals(raw, Math.PI * (50 / 180)) as THREE.ExtrudeGeometry;
  raw.dispose();
  // Flat faces (the top and bottom caps) must stay exactly flat: averaging them with the bevel next to them made
  // fan-shaped streaks across the big top faces. Reset every cap triangle to its true face normal.
  {
    const P = geometry.getAttribute('position');
    const Nn = geometry.getAttribute('normal');
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    for (let i = 0; i + 2 < P.count; i += 3) {
      a.fromBufferAttribute(P, i);
      b.fromBufferAttribute(P, i + 1);
      c.fromBufferAttribute(P, i + 2);
      const n = b.sub(a).cross(c.sub(a)).normalize();
      if (Math.abs(n.z) > 0.999) for (let k = 0; k < 3; k++) Nn.setXYZ(i + k, 0, 0, Math.sign(n.z));
    }
    Nn.needsUpdate = true;
  }

  // rim outline, sitting on the wall-to-bevel edge (local z = depth)
  const pos: number[] = [];
  for (const o of outers) {
    const w = o.ring.map(([x, y]) => toWorld(x, y));
    for (let i = 0; i < w.length; i++) {
      const a = w[i];
      const b = w[(i + 1) % w.length];
      pos.push(a[0], a[1], depth + 0.2, b[0], b[1], depth + 0.2);
    }
  }
  const outline = new THREE.BufferGeometry();
  outline.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));

  const [[x0, y0], [x1, y1]] = g.bounds;
  const out: StateGeo = {
    name,
    top,
    bottom,
    depth,
    geometry,
    outline,
    outlineVerts: pos.length / 3,
    centroid: toWorld(g.centroid[0], g.centroid[1]),
    center: toWorld((x0 + x1) / 2, (y0 + y1) / 2),
    size: [x1 - x0, y1 - y0],
  };
  cache.set(name, out);
  return out;
};
