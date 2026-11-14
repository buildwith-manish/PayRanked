import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, F} from '../theme';

/**
 * Shorts thumbnails (1080x1920). One template, seven configs, one per Short.
 *
 * Safe zone: the Shorts feed shows the full 9:16 frame, but the channel grid crops it to roughly 3:4 (the middle
 * 1080x1440, y 240..1680). Everything that must be read sits between y 300 and y 1500.
 *
 * Every claim here is the same one the Short's hook makes (src/shots/ShortOverlays.tsx), so the thumbnail never promises
 * more than the video delivers.
 */
export const THUMB_W = 1080;
export const THUMB_H = 1920;

const img = (n: string) => staticFile(`thumbs/${n}.jpg`);

type Hero = {
  src: string;
  /** box the picture is cropped into (object-fit: cover) */
  box: {left: number; top: number; width: number; height: number};
  /** how the picture sits on the dark background: 'screen' drops black backgrounds, 'mask' fades grey studio backgrounds to nothing */
  mode: 'screen' | 'mask';
  pos?: string; // object-position
  scale?: number;
  filter?: string;
};

export type ThumbSpec = {
  id: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  bg: 'bg-teal' | 'bg-teal2';
  kicker: string;
  big: string;
  bigSize: number;
  sub: string;
  accent: 'gold' | 'mint' | 'red';
  heroes: Hero[];
};

const MASK = 'radial-gradient(ellipse 52% 58% at 50% 52%, #000 48%, rgba(0,0,0,0) 100%)';

export const THUMBS: ThumbSpec[] = [
  {
    id: 1,
    bg: 'bg-teal',
    kicker: 'CALIFORNIA',
    big: '$90K',
    bigSize: 360,
    sub: 'is what your $100K really buys',
    accent: 'red',
    heroes: [{src: 'question', box: {left: 0, top: 880, width: 1080, height: 900}, mode: 'screen', pos: '50% 40%', scale: 1.15}],
  },
  {
    id: 2,
    bg: 'bg-teal2',
    kicker: 'TWO STATES TIE',
    big: '+$20K',
    bigSize: 340,
    sub: 'more than California',
    accent: 'mint',
    heroes: [{src: 'cash-pile', box: {left: 0, top: 960, width: 1080, height: 820}, mode: 'mask', pos: '50% 50%', filter: 'brightness(0.9) saturate(1.1)'}],
  },
  {
    id: 3,
    bg: 'bg-teal',
    kicker: 'TEXAS',
    big: '#26',
    bigSize: 460,
    sub: "isn't even top 25",
    accent: 'gold',
    heroes: [{src: 'man-shock', box: {left: 0, top: 900, width: 1080, height: 1000}, mode: 'mask', pos: '45% 40%', filter: 'brightness(0.82) contrast(1.08)'}],
  },
  {
    id: 4,
    bg: 'bg-teal2',
    kicker: 'HIGHEST SALES TAX IN THE US',
    big: '#5',
    bigSize: 500,
    sub: 'and it still ranks in the top five',
    accent: 'gold',
    heroes: [{src: 'tower', box: {left: 0, top: 920, width: 1080, height: 900}, mode: 'mask', pos: '50% 55%', scale: 1.1}],
  },
  {
    id: 5,
    bg: 'bg-teal',
    kicker: 'CHEAP STATES',
    big: 'NOT $100K',
    bigSize: 250,
    sub: "cheap doesn't mean you'd earn it",
    accent: 'red',
    heroes: [{src: 'man-point', box: {left: 0, top: 900, width: 1080, height: 1000}, mode: 'mask', pos: '40% 40%', filter: 'brightness(0.82) contrast(1.08)'}],
  },
  {
    id: 6,
    bg: 'bg-teal2',
    kicker: 'THE REMOTE WORKER',
    big: 'WHO WINS?',
    bigSize: 235,
    sub: 'the real winner may surprise you',
    accent: 'mint',
    heroes: [{src: 'face', box: {left: 0, top: 900, width: 1080, height: 1000}, mode: 'mask', pos: '42% 35%', filter: 'brightness(0.85) contrast(1.1)'}],
  },
  {
    id: 7,
    bg: 'bg-teal',
    kicker: 'YOUR TURN',
    big: 'YOUR PAY',
    bigSize: 250,
    sub: 'run the formula on your own salary',
    accent: 'gold',
    heroes: [
      {src: 'arrow', box: {left: 0, top: 880, width: 1080, height: 900}, mode: 'screen', pos: '50% 45%', scale: 1.2},
    ],
  },
];

const ACCENT = {
  gold: 'linear-gradient(180deg, #FFE9A8 0%, #FFC94D 45%, #D98E10 100%)',
  mint: 'linear-gradient(180deg, #C9FFE6 0%, #3DF0A8 50%, #129B64 100%)',
  red: 'linear-gradient(180deg, #FFD0C9 0%, #FF6B5C 50%, #C52B2B 100%)',
} as const;
const GLOW = {gold: 'rgba(255,176,32,0.55)', mint: 'rgba(61,240,168,0.5)', red: 'rgba(255,92,92,0.5)'} as const;

const HeroImg: React.FC<{h: Hero}> = ({h}) => (
  <div
    style={{
      position: 'absolute',
      ...h.box,
      overflow: 'hidden',
      mixBlendMode: h.mode === 'screen' ? 'screen' : 'normal',
      WebkitMaskImage: h.mode === 'mask' ? MASK : undefined,
      maskImage: h.mode === 'mask' ? MASK : undefined,
    }}
  >
    <Img
      src={img(h.src)}
      style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: h.pos ?? '50% 50%', transform: `scale(${h.scale ?? 1})`, filter: h.filter}}
    />
  </div>
);

export const Thumbnail: React.FC<{id: number}> = ({id}) => {
  const t = THUMBS.find((x) => x.id === id) ?? THUMBS[0];
  return (
    <AbsoluteFill style={{backgroundColor: C.navy3, overflow: 'hidden'}}>
      <Img src={img(t.bg)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.85) saturate(1.15)'}} />
      <Img src={img('bokeh')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'screen', opacity: 0.5}} />
      {/* glow behind the headline */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 260, height: 760, background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${GLOW[t.accent]} 0%, rgba(0,0,0,0) 70%)`, opacity: 0.55}} />
      {t.heroes.map((h) => (
        <HeroImg key={h.src} h={h} />
      ))}
      {/* top and bottom darkening so the text and the logo always read */}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,14,29,0.55) 0%, rgba(5,14,29,0) 28%, rgba(5,14,29,0) 70%, rgba(5,14,29,0.9) 100%)'}} />

      <div style={{position: 'absolute', left: 48, right: 48, top: 330, textAlign: 'center'}}>
        <div
          style={{
            display: 'inline-block',
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 46,
            letterSpacing: 6,
            color: C.text,
            padding: '14px 34px',
            borderRadius: 999,
            border: `2px solid ${GLOW[t.accent]}`,
            background: 'rgba(5,14,29,0.6)',
          }}
        >
          {t.kicker}
        </div>
        <div
          style={{
            marginTop: 28,
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: t.bigSize,
            lineHeight: 0.95,
            letterSpacing: -4,
            backgroundImage: ACCENT[t.accent],
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 10px 30px ${GLOW[t.accent]}) drop-shadow(0 4px 0 rgba(0,0,0,0.5))`,
          }}
        >
          {t.big}
        </div>
        <div style={{marginTop: 26, fontFamily: F.display, fontWeight: 600, fontSize: 64, lineHeight: 1.15, color: C.text, textShadow: '0 4px 24px rgba(2,8,18,0.8)'}}>
          {t.sub}
        </div>
      </div>

      <div style={{position: 'absolute', left: 0, right: 0, top: 1480, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20}}>
        <Img src={staticFile('watermark/payranked-watermark.png')} style={{width: 110, height: 110}} />
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 56, letterSpacing: 8, color: C.text}}>PAYRANKED</div>
      </div>
    </AbsoluteFill>
  );
};

/** Frames (real, 60 fps) the thumbnail covers at the very end of each Short. Inside the video's existing length, so no TOTAL in the render workflows changes. */
export const THUMB_END_FRAMES = 2;
