import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, F} from '../theme';
import {Accent, Layer, THUMBS} from './specs';

/**
 * Shorts thumbnail template (1080x1920). Edit specs.ts, not this file, for a new thumbnail.
 *
 * Safe zone: the Shorts feed shows the whole 9:16 frame, the channel grid crops it to about 3:4 (y 240..1680). The headline,
 * the face and the number all sit inside y 300..1500, and nothing important touches the edges (the app overlays UI there).
 */
export const THUMB_W = 1080;
export const THUMB_H = 1920;

/**
 * How many real frames (60 fps) the thumbnail covers at the very end of every Short.
 * It REPLACES the last frames of the end card, so the Short's length and the render workflows' TOTAL do not change.
 * In YouTube Studio drag the cover slider to the very end: every one of these frames is identical, so any of them is the thumbnail.
 */
export const THUMB_END_FRAMES = 12;

const pic = (n: string) => staticFile(`thumbnails/${n}.jpg`);

const GRAD: Record<Accent, string> = {
  gold: 'linear-gradient(180deg, #FFF3C4 0%, #FFD35C 40%, #F0A010 100%)',
  mint: 'linear-gradient(180deg, #E4FFF2 0%, #5DF5B4 45%, #12A86C 100%)',
  red: 'linear-gradient(180deg, #FFE1DA 0%, #FF7A66 45%, #D43434 100%)',
};
const GLOW: Record<Accent, string> = {gold: 'rgba(255,176,32,0.6)', mint: 'rgba(61,240,168,0.55)', red: 'rgba(255,92,92,0.55)'};

const LayerImg: React.FC<{l: Layer}> = ({l}) => {
  const h = l.w * 1.75;
  const top = l.cy - h / 2;
  return (
    <>
      {l.glow && (
        <div style={{position: 'absolute', left: l.cx - l.w * 0.6, top: top + h * 0.2, width: l.w * 1.2, height: h * 0.6, background: `radial-gradient(ellipse at 50% 50%, ${l.glow} 0%, rgba(0,0,0,0) 65%)`}} />
      )}
      <Img
        src={pic(l.file)}
        style={{
          position: 'absolute',
          left: l.cx - l.w / 2,
          top,
          width: l.w,
          height: h,
          mixBlendMode: 'screen',
          opacity: l.opacity ?? 1,
          transform: `${l.flip ? 'scaleX(-1) ' : ''}rotate(${l.rotate ?? 0}deg)`,
        }}
      />
    </>
  );
};

/** Gradient headline with a dark outline layer behind it, so it still reads at thumbnail size. */
const BigText: React.FC<{text: string; size: number; accent: Accent}> = ({text, size, accent}) => {
  const base: React.CSSProperties = {fontFamily: F.display, fontWeight: 700, fontSize: size, lineHeight: 1, letterSpacing: -size * 0.012, whiteSpace: 'nowrap'};
  return (
    <div style={{position: 'relative', display: 'inline-block'}}>
      <div style={{...base, position: 'absolute', inset: 0, color: '#04101F', WebkitTextStroke: `${size * 0.075}px #04101F`, textShadow: `0 14px 40px ${GLOW[accent]}`}}>{text}</div>
      <div style={{...base, position: 'relative', backgroundImage: GRAD[accent], WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent'}}>{text}</div>
    </div>
  );
};

/** Rough width of Clash Display Bold per character (em), used to shrink a line that would overflow the 1080 px frame. */
const fit = (chars: number, size: number, em: number, max = 960) => Math.min(size, max / (em * chars));

export const Thumbnail: React.FC<{id: number}> = ({id}) => {
  const t = THUMBS.find((x) => x.id === id) ?? THUMBS[0];
  const bigSize = fit(t.big.length, t.bigSize, 0.7);
  const subSize = fit(t.sub.length, 70, 0.56);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy3, overflow: 'hidden'}}>
      <Img src={pic(t.bg)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.95) saturate(1.2)'}} />
      {/* colour wash behind the headline so the number is always the brightest thing in the frame */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 220, height: 760, background: `radial-gradient(ellipse 62% 48% at 50% 50%, ${GLOW[t.accent]} 0%, rgba(0,0,0,0) 72%)`, opacity: 0.5}} />
      {t.layers.map((l) => (
        <LayerImg key={l.file} l={l} />
      ))}
      {/* top and bottom shading: text on top, logo at the bottom */}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,10,22,0.6) 0%, rgba(3,10,22,0) 26%, rgba(3,10,22,0) 66%, rgba(3,10,22,0.92) 100%)'}} />

      <div style={{position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center'}}>
        <div
          style={{
            display: 'inline-block',
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 50,
            letterSpacing: 7,
            color: t.accent === 'red' ? '#FFD9D3' : C.text,
            padding: '14px 38px',
            borderRadius: 999,
            border: `3px solid ${GLOW[t.accent]}`,
            background: 'rgba(3,10,22,0.72)',
          }}
        >
          {t.kicker}
        </div>
        {t.strike && (
          <div style={{position: 'relative', display: 'inline-block', marginTop: 22, marginLeft: 34, fontFamily: F.display, fontWeight: 700, fontSize: 120, color: '#FF8A7A', textShadow: '0 6px 20px rgba(0,0,0,0.7)'}}>
            {t.strike}
            <div style={{position: 'absolute', left: -14, right: -14, top: '54%', height: 14, borderRadius: 7, background: '#FF3B3B', transform: 'rotate(-7deg)', boxShadow: '0 0 24px rgba(255,59,59,0.8)'}} />
          </div>
        )}
        <div style={{marginTop: t.strike ? -4 : 20}}>
          <BigText text={t.big} size={bigSize} accent={t.accent} />
        </div>
        <div style={{marginTop: 10, fontFamily: F.display, fontWeight: 700, fontSize: subSize, lineHeight: 1.1, color: '#FFFFFF', WebkitTextStroke: '10px #04101F', paintOrder: 'stroke fill', textShadow: '0 6px 26px rgba(2,8,18,0.9)'}}>
          {t.sub}
        </div>
      </div>

      <div style={{position: 'absolute', left: 0, right: 0, top: 1610, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20}}>
        <Img src={staticFile('watermark/payranked-watermark.png')} style={{width: 100, height: 100}} />
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 52, letterSpacing: 8, color: C.text}}>PAYRANKED</div>
      </div>
    </AbsoluteFill>
  );
};
