# PayRanked video 1: 3D depth + light/material pass

## First run
```
npm install          # new deps: three, @react-three/fiber, @remotion/three, @types/three
npm run dev          # look at Shot1-ColdOpen and RankReveal-Arkansas first
npm run typecheck
npm run still        # or: bash scripts/stills.sh Shot1-ColdOpen
```
`remotion.config.ts` now sets the ANGLE GL backend (needed for WebGL in headless Chrome) and a longer per-frame timeout.

## 1. Real depth (three.js via @remotion/three)
- `src/three/geometry.ts` reads the existing state outlines and extrudes them with a bevel. Height = buying power:
  `top = (100 - BEA) * K`, so Arkansas stands tallest and California sits lowest, below the "US average" plane (z = 0).
  Colour runs emerald (cheap) to red (expensive) with a neutral slate in the middle.
- `src/three/Map3D.tsx`: the states rise from the floor in order of buying power, cheapest first.
- `RankReveal.tsx`: the flat SVG zoom is gone. The camera flies in 3D (target, distance, pitch and yaw all move), the
  selected state lifts out of the map and the rest fall back into the dark, a 3D pin drops with a ripple, background
  layers slide at different rates for parallax, and the top and bottom of the frame defocus (tilt-shift).
- `Shot1.tsx` + `src/three/Shot1Scene.tsx`: both states rise to a faint average plane. When the counts land, Arkansas
  climbs and turns emerald while California sinks below the plane and turns red.
- `CoinStack.tsx` (same props as before): metal coins with studio reflections, milled rim, embossed face, a drop-in
  flip, a contact shadow, a coloured light pool and an amber $100,000 ring. Used in Shot 1 and every reveal.

## 2. Light and materials
- `Glass.tsx`: backdrop blur, sheen, gradient rim, specular top line, inner shadow. Used by chips, the number cards, the
  rail rows, the BEA chip and the fact card.
- `Grade.tsx`: one filmic grade for every composition (bloom, S-curve, teal shadows, warm highlights, lens dust and a
  warm light leak). `Aberration` splits the colour channels for a few frames on each slam.
- `Background.tsx`: soft bokeh lights plus camera parallax.

## Tuning
- Scene light and exposure: `TUNE` at the top of `src/three/scene.tsx`.
- Height exaggeration: `K` in `src/three/geometry.ts`.
- Bloom is the slowest part of the grade. Set `BLOOM = false` in `Grade.tsx` if renders are too slow.
- `npm run render:half` is a quick half-size check.

## Not touched
Shots 3, 5 and 6 keep their 2D layouts. They only get the new grade, glass chips and background.
Shot 5's map is still flat SVG because its labels and brackets are positioned in flat map coordinates.
