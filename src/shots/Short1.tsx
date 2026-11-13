import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Shot1} from './Shot1';
import {Shot3} from './Shot3';
import {C, F, sec, tabular} from '../theme';
import {useDesignFrame} from '../clock';
import {SfxTrack} from '../audio/Sfx';
import {Cue} from '../audio/cues';
import {glide, ramp, slam, snap, tween} from '../motion';
import {Flash} from '../components/common';
import {byName, COUNTDOWN, fmtUSD} from '../data';
import {VIDEO_FRAMES} from '../timeline';
import {Glass} from '../components/Glass';

// 13.7 s (was 13.5): clip 006 "...A hundred is the national average." is silent from 7.80 s to 8.12 s (measured on the WAV), and 13.7 s lands the cut
// at 7.82 s into the clip. 13.5 s cut inside "average"; the next beat (needle to California) starts at 13.72 s, so the picture stays clean.
export const SHORT1_METHOD_END = 13.7;
// The Short has no "Welcome to PayRanked" clip: the method opener starts at the gauge, 6.3 s into the long video's Shot 3 (the welcome line,
// voice-over clip 005 and its title card, runs 0-6.3 s). The cut-in is the same moment the long video draws the gauge.
export const SHORT1_METHOD_SKIP = 6.3;
export const SHORT1_METHOD_SECONDS = Math.round((SHORT1_METHOD_END - SHORT1_METHOD_SKIP) * 10) / 10; // 7.4 s
export const SHORT1_CTA_SECONDS = 4; // 120 design frames
export const SHORT1_FRAMES = sec(27 + SHORT1_METHOD_SECONDS + SHORT1_CTA_SECONDS);

/** Which end line a render carries: 'youtube' = a button that looks like YouTube's "Related video" button, with a tap animation (the real
 *  button, set in Studio, does the linking); 'social' = Instagram and Facebook, which have no such button, so the card says "link in comments". */
export type CtaVariant = 'youtube' | 'social';
export const CTA_LINE: Record<CtaVariant, string> = {youtube: 'Related video', social: 'link in comments'};

/**
 * The end card, shared by every Short (1-7), so each one ends the same way. Design frames (30 fps) local to the card
 * (SHORT1_CTA_SECONDS = 4 s = 120 frames). It shows a small preview of the long video, then says where to find it:
 *   0-10   background fades in
 *   6-30   a video-style card slides up: header, then the countdown rows #10-#6 fill one after another (numbers from src/data)
 *   34-52  the #1 row lights up as a locked "???" (the Shorts never give away the winner) and a progress line sweeps the card
 *   44-72  headline: "Full", "ranking", "+" land with an overshoot, "#1" slams in larger (flash, hit), a light sweeps across once
 *   64-90  the button: YouTube = a "Related video" button that rises, a touch point glides in and taps it at 86 (rings, click);
 *          social = a "link in comments" bubble. An arrow bobs toward where the real button / the comments are.
 */
const CTA_T = {card: 6, rows: 12, rowStep: 5, mystery: 38, title: 44, hero: 56, pill: 64, tap: 86, pulse: 90};
// Sound cues are local to the card. The offset is far past the voice-over envelope, so the voice ducking never touches them.
const CTA_CUES: Cue[] = [
  {sfx: 'whoosh_s', at: CTA_T.card + 2, gain: 0.25, hero: true},
  {sfx: 'tick_0', at: CTA_T.rows + 4, gain: 0.2, hero: true},
  {sfx: 'tick_1', at: CTA_T.rows + 9, gain: 0.2, hero: true},
  {sfx: 'tick_2', at: CTA_T.rows + 14, gain: 0.2, hero: true},
  {sfx: 'tick_0', at: CTA_T.rows + 19, gain: 0.2, hero: true},
  {sfx: 'tick_1', at: CTA_T.rows + 24, gain: 0.2, hero: true},
  {sfx: 'hit_med', at: CTA_T.hero, gain: 0.4, hero: true},
  {sfx: 'pop', at: CTA_T.pill + 6, gain: 0.35, hero: true},
  {sfx: 'click', at: CTA_T.tap, gain: 0.4, hero: true},
  {sfx: 'ding_hi', at: CTA_T.tap + 3, gain: 0.25, hero: true},
];

const mmss = (frames: number) => {
  const s = Math.round(frames / 30);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** The long video's countdown, #10 to #6, as five rows. #1 stays locked. */
const PREVIEW_ROWS = COUNTDOWN.filter((c) => c.rank >= 6 && c.rank <= 10).map((c) => ({label: c.label, name: c.names.join(' · '), extra: byName(c.names[0]).display - 100000, value: fmtUSD(byName(c.names[0]).display)}));

const SocialEndCard: React.FC<{variant: CtaVariant}> = ({variant}) => {
  const f = useDesignFrame();
  const fade = ramp(f, 0, 10);
  const card = tween(f, CTA_T.card, 22, snap);
  const bob = 5 * Math.sin(f / 14);
  const mystery = tween(f, CTA_T.mystery, 12, snap);
  const lit = 0.5 + 0.5 * Math.sin(f / 5);
  const sweep = ramp(f, CTA_T.rows, CTA_T.title + 20); // the progress line of the card
  const pulse = Math.sin(Math.PI * ramp(f, CTA_T.pulse, CTA_T.pulse + 14));
  const pillIn = tween(f, CTA_T.pill, 18, slam);
  const tapP = ramp(f, CTA_T.tap, CTA_T.tap + 10);
  const press = 1 - 0.07 * Math.sin(Math.PI * tapP);
  const shine = ramp(f, CTA_T.hero + 8, CTA_T.hero + 30);
  const CW = [{t: 'Full'}, {t: 'ranking'}, {t: '+'}, {t: '#1', hero: true}];
  const rows = PREVIEW_ROWS;
  const maxExtra = 16000;
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${C.navy1} 0%, ${C.navy2} 55%, ${C.navy3} 100%)`, opacity: fade}}>
      {/* soft mint glow behind the card */}
      <div style={{position: 'absolute', left: 140, right: 140, top: 330, height: 520, borderRadius: 260, background: `${C.mint}22`, filter: 'blur(90px)', opacity: card}} />

      {/* the preview card */}
      <div style={{position: 'absolute', left: 80, right: 80, top: 330, opacity: ramp(f, CTA_T.card, CTA_T.card + 8), transform: `translateY(${(1 - card) * 90 + bob}px) scale(${0.94 + 0.06 * card})`}}>
        <Glass radius={34} tint={C.mint} strength={1.1} glow={20} style={{padding: '30px 36px 26px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
            <div style={{width: 0, height: 0, borderTop: '14px solid transparent', borderBottom: '14px solid transparent', borderLeft: `24px solid ${C.mint}`}} />
            <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 36, color: C.text}}>Where does $100,000 go the furthest?</div>
          </div>
          <div style={{marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12}}>
            {rows.map((r, i) => {
              const p = tween(f, CTA_T.rows + i * CTA_T.rowStep, 18, glide);
              return (
                <div key={r.label} style={{display: 'flex', alignItems: 'center', gap: 16, opacity: ramp(f, CTA_T.rows + i * CTA_T.rowStep, CTA_T.rows + i * CTA_T.rowStep + 6)}}>
                  <div style={{width: 76, fontFamily: F.display, fontWeight: 700, fontSize: 34, color: C.mint, ...tabular}}>{r.label}</div>
                  <div style={{width: 250, fontFamily: F.body, fontWeight: 600, fontSize: 30, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden'}}>{r.name}</div>
                  <div style={{flex: 1, height: 22, borderRadius: 11, background: 'rgba(232,238,247,0.10)', position: 'relative'}}>
                    <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(1, r.extra / maxExtra) * 100 * p}%`, borderRadius: 11, background: `linear-gradient(90deg, ${C.emerald}, ${C.mint})`}} />
                  </div>
                  <div style={{width: 130, textAlign: 'right', fontFamily: F.body, fontWeight: 600, fontSize: 30, color: C.muted, ...tabular}}>{r.value}</div>
                </div>
              );
            })}
            {/* #1 stays locked: the Shorts never give the winner away */}
            <div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: ramp(f, CTA_T.mystery, CTA_T.mystery + 6), transform: `scale(${0.9 + 0.1 * mystery})`, transformOrigin: '0% 50%'}}>
              <div style={{width: 76, fontFamily: F.display, fontWeight: 700, fontSize: 34, color: C.amber, ...tabular}}>#1</div>
              <div style={{flex: 1, height: 52, borderRadius: 14, border: `3px solid ${C.amber}`, background: `${C.amber}${lit > 0.5 ? '33' : '1F'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 32, letterSpacing: '0.3em', color: C.amber, boxShadow: `0 0 ${16 + 16 * lit}px ${C.amber}66`}}>? ? ?</div>
            </div>
          </div>
          {/* video progress line */}
          <div style={{marginTop: 22, display: 'flex', alignItems: 'center', gap: 16}}>
            <div style={{flex: 1, height: 8, borderRadius: 4, background: 'rgba(232,238,247,0.14)', position: 'relative'}}>
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${sweep * 38}%`, borderRadius: 4, background: C.mint}} />
              <div style={{position: 'absolute', top: -6, left: `${sweep * 38}%`, width: 20, height: 20, marginLeft: -10, borderRadius: 10, background: C.text}} />
            </div>
            <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 26, color: C.muted, ...tabular}}>{mmss(sweep * 0.38 * VIDEO_FRAMES)} / {mmss(VIDEO_FRAMES)}</div>
          </div>
        </Glass>
      </div>

      {/* the call to action, under the card */}
      <Flash at={CTA_T.hero} duration={8} peak={0.22} />
      <div style={{position: 'absolute', left: 40, right: 40, top: 950, textAlign: 'center'}}>
        {/* headline: the words land one by one with an overshoot, "#1" slams in larger, then a light sweeps across it once */}
        <div style={{position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', columnGap: 26, fontFamily: F.display, fontWeight: 700, fontSize: 104, lineHeight: 1.12, color: C.text, padding: '10px 0'}}>
          {CW.map((w, i) => {
            const at = CTA_T.title + i * 4 + (w.hero ? 4 : 0);
            const p = tween(f, at, w.hero ? 16 : 14, slam);
            return (
              <span key={i} style={{display: 'inline-block', opacity: ramp(f, at, at + 4), color: w.hero ? C.mint : C.text, fontSize: w.hero ? 150 : 104, transform: `translateY(${(1 - p) * 40}px) scale(${1 + (1 - p) * (w.hero ? 1.1 : 0.4)})`, filter: p < 0.9 ? `blur(${(1 - p) * 7}px)` : undefined, textShadow: w.hero ? `0 0 ${24 + 30 * pulse}px ${C.mint}88` : undefined}}>
                {w.t}
              </span>
            );
          })}
          <div style={{position: 'absolute', top: 0, bottom: 0, left: `${-20 + 140 * shine}%`, width: 90, transform: 'skewX(-20deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.28), rgba(255,255,255,0))', opacity: shine > 0 && shine < 1 ? 1 : 0, pointerEvents: 'none'}} />
        </div>

        {variant === 'youtube' ? (
          <>
            {/* a button that looks like YouTube's "Related video" button; a touch point glides in, taps it and rings spread out */}
            <div style={{position: 'relative', margin: '34px auto 0', width: 560, height: 118, opacity: ramp(f, CTA_T.pill, CTA_T.pill + 6), transform: `translateY(${(1 - pillIn) * 70}px) scale(${(0.8 + 0.2 * pillIn) * press})`}}>
              {[0, 5].map((d) => {
                const r = ramp(f, CTA_T.tap + d, CTA_T.tap + d + 18);
                return <div key={d} style={{position: 'absolute', left: -r * 40, right: -r * 40, top: -r * 40, bottom: -r * 40, borderRadius: 999, border: `5px solid ${C.mint}`, opacity: r > 0 && r < 1 ? 0.7 * (1 - r) : 0}} />;
              })}
              <div style={{position: 'absolute', inset: 0, borderRadius: 999, background: `linear-gradient(90deg, ${C.emerald}, ${C.mint})`, boxShadow: `0 0 ${22 + 34 * pulse}px ${C.mint}${pulse > 0.2 ? 'bb' : '77'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22}}>
                <div style={{width: 0, height: 0, borderTop: '20px solid transparent', borderBottom: '20px solid transparent', borderLeft: `34px solid ${C.navy3}`}} />
                <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 56, color: C.navy3}}>{CTA_LINE.youtube}</div>
              </div>
              {/* the touch point */}
              <div style={{position: 'absolute', left: 330 + (1 - ramp(f, CTA_T.pill + 6, CTA_T.tap, glide)) * 150, top: 56 + (1 - ramp(f, CTA_T.pill + 6, CTA_T.tap, glide)) * 130, width: 64, height: 64, marginLeft: -32, marginTop: -32, borderRadius: 32, background: 'rgba(255,255,255,0.55)', border: '4px solid rgba(255,255,255,0.9)', opacity: ramp(f, CTA_T.pill + 6, CTA_T.pill + 14) * (1 - ramp(f, CTA_T.tap + 12, CTA_T.tap + 20)), transform: `scale(${1 - 0.25 * Math.sin(Math.PI * tapP)})`}} />
            </div>
            <div style={{marginTop: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, fontFamily: F.body, fontWeight: 600, fontSize: 46, color: C.text, opacity: ramp(f, CTA_T.pill + 12, CTA_T.pill + 24)}}>
              {/* the real button sits in the Shorts player, bottom left: the arrow bobs toward it */}
              <div style={{width: 30, height: 30, borderLeft: `9px solid ${C.mint}`, borderBottom: `9px solid ${C.mint}`, borderRadius: 3, transform: `translate(${-6 * Math.sin(f / 5)}px, ${6 * Math.sin(f / 5)}px) rotate(0deg)`}} />
              <span>tap the button below</span>
            </div>
          </>
        ) : (
          <>
            {/* Instagram / Facebook: a comment bubble that says where the link is, with a chevron pointing down at the comments */}
            <div style={{position: 'relative', margin: '34px auto 0', width: 700, height: 118, opacity: ramp(f, CTA_T.pill, CTA_T.pill + 6), transform: `translateY(${(1 - pillIn) * 70}px) scale(${(0.8 + 0.2 * pillIn) * (1 + 0.04 * pulse)})`}}>
              <div style={{position: 'absolute', inset: 0, borderRadius: 40, border: `5px solid ${C.mint}`, background: `${C.mint}1F`, boxShadow: `0 0 ${22 + 30 * pulse}px ${C.mint}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 58, color: C.mint}}>{CTA_LINE.social}</div>
              <div style={{position: 'absolute', left: 64, bottom: -20, width: 36, height: 36, borderRight: `5px solid ${C.mint}`, borderBottom: `5px solid ${C.mint}`, background: C.navy2, transform: 'rotate(45deg) skew(8deg, 8deg)'}} />
            </div>
            <div style={{margin: '56px auto 0', width: 40, height: 40, borderRight: `10px solid ${C.mint}`, borderBottom: `10px solid ${C.mint}`, borderRadius: 3, opacity: ramp(f, CTA_T.pill + 14, CTA_T.pill + 26), transform: `translateY(${8 * Math.sin(f / 5)}px) rotate(45deg)`}} />
          </>
        )}
      </div>
      <SfxTrack cues={CTA_CUES} offset={10_000_000} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// YouTube end card: a demo of the real thing. The bottom of a Short on YouTube shows the channel row (avatar, @handle, Subscribe) and,
// under it, a dark pill with a play triangle and the long video's title: the "Related video" button. The card shows that block,
// a touch point taps the pill, and the long video's thumbnail opens. About 2.5 s of demo inside the 3.5 s card.
// ---------------------------------------------------------------------------------------------------------------------
/** The channel handle and the long video's title as the real button shows them: on a phone the title is cut with "..." after about 40
 *  characters of this pill, so the full title is kept here and CSS does the cutting. */
export const CHANNEL_HANDLE = '@PayRanked';
export const LONG_VIDEO_TITLE = 'Your $100K Is Worth Up to $115K in These 10 States (Ranked)';

const Y_T = {head: 4, hero: 20, panel: 22, ui: 30, pill: 38, finger: 46, push: 50, tap: 68, open: 71, openEnd: 94, end: 120};
const Y_CUES: Cue[] = [
  {sfx: 'hit_big', at: Y_T.hero, gain: 0.35, hero: true}, // the low thud on the "#1" slam
  {sfx: 'whoosh_s', at: Y_T.panel + 2, gain: 0.22, hero: true},
  {sfx: 'pop', at: Y_T.pill + 2, gain: 0.28, hero: true},
  {sfx: 'tap_0', at: Y_T.tap, gain: 0.4, hero: true}, // the tap
  {sfx: 'click', at: Y_T.tap, gain: 0.25, hero: true},
  {sfx: 'whoosh_m', at: Y_T.open, gain: 0.3, hero: true}, // the thumbnail opening
  {sfx: 'shimmer', at: Y_T.openEnd + 2, gain: 0.22, hero: true}, // a small shimmer as it lands
];
const PANEL_W = 880;
const PANEL_H0 = 330; // the channel block
const PANEL_H1 = 560; // after the thumbnail opens (16:9 at 800 px wide = 450 px, plus padding)

const Headline: React.FC<{start: number}> = ({start}) => {
  const f = useDesignFrame();
  const words = [{t: 'Full'}, {t: 'ranking'}, {t: '+'}, {t: '#1', hero: true}];
  const shine = ramp(f, start + 18, start + 40);
  const glow = 0.5 + 0.5 * Math.sin(f / 7);
  return (
    <div style={{position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', columnGap: 26, fontFamily: F.display, fontWeight: 700, lineHeight: 1.12, color: C.text, padding: '10px 0'}}>
      {words.map((w, i) => {
        const at = start + i * 4 + (w.hero ? 4 : 0);
        const p = tween(f, at, w.hero ? 16 : 14, slam);
        return (
          <span key={i} style={{display: 'inline-block', opacity: ramp(f, at, at + 4), color: w.hero ? C.mint : C.text, fontSize: w.hero ? 150 : 104, transform: `translateY(${(1 - p) * 40}px) scale(${1 + (1 - p) * (w.hero ? 1.1 : 0.4)})`, filter: p < 0.9 ? `blur(${(1 - p) * 7}px)` : undefined, textShadow: w.hero ? `0 0 ${14 + 10 * glow}px ${C.mint}66` : undefined}}>
            {w.t}
          </span>
        );
      })}
      <div style={{position: 'absolute', top: 0, bottom: 0, left: `${-20 + 140 * shine}%`, width: 90, transform: 'skewX(-20deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.28), rgba(255,255,255,0))', opacity: shine > 0 && shine < 1 ? 1 : 0, pointerEvents: 'none'}} />
    </div>
  );
};

/** Same easing everywhere in the demo: a fast ease-out with a small overshoot on arrival. */
const settle = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

const YouTubeEndCard: React.FC = () => {
  const f = useDesignFrame();
  const fade = ramp(f, 0, 8);
  const panelIn = tween(f, Y_T.panel, 22, settle);
  const uiIn = ramp(f, Y_T.ui, Y_T.ui + 8);
  const pillIn = tween(f, Y_T.pill, 16, settle);
  const finger = ramp(f, Y_T.finger, Y_T.tap, glide);
  const tapP = ramp(f, Y_T.tap, Y_T.tap + 8);
  const tapS = Math.sin(Math.PI * tapP); // 0 -> 1 -> 0 over the press
  const open = ramp(f, Y_T.open, Y_T.openEnd, glide); // the pill stretches into the thumbnail: one move, 0 -> 1
  const uiOut = 1 - ramp(f, Y_T.open - 2, Y_T.open + 8);
  const land = f - Y_T.openEnd;
  const bounce = land >= 0 ? 0.03 * Math.exp(-land / 5) * Math.sin(land * 1.15) : 0; // a tiny bounce when the thumbnail lands
  const press = f < Y_T.open ? 1 - 0.06 * tapS : 1;
  const panelH = PANEL_H0 + (PANEL_H1 - PANEL_H0) * open;
  const PILL_W = PANEL_W - 80;
  const PILL_TOP = PANEL_H0 - 40 - 84; // the pill's top inside the panel before it opens
  const THUMB_H = (PILL_W * 9) / 16;
  // camera: push in toward the button before the tap, pull back as the thumbnail opens, then a slow drift
  const cam = 1 + 0.1 * ramp(f, Y_T.push, Y_T.tap, glide) - 0.1 * ramp(f, Y_T.open, Y_T.openEnd, glide) + 0.02 * ramp(f, Y_T.openEnd, Y_T.end);
  const drift = ramp(f, Y_T.openEnd, Y_T.end); // the thumbnail keeps drifting slowly once open
  const badge = ramp(f, Y_T.openEnd - 6, Y_T.openEnd + 4) * (1 + 0.06 * Math.sin(f / 6));
  const wake = ramp(f, Y_T.pill + 6, Y_T.pill + 20) * (1 - ramp(f, Y_T.tap, Y_T.tap + 6)) * (0.5 + 0.5 * Math.sin(f / 6)); // soft glow so the button is the brightest thing
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${C.navy1} 0%, ${C.navy2} 55%, ${C.navy3} 100%)`, opacity: fade}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: `540px ${640 + PILL_TOP + 42}px`}}>
        <div style={{position: 'absolute', left: 40, right: 40, top: 200, textAlign: 'center'}}>
          <Headline start={Y_T.head} />
        </div>

        {/* the demo panel: black, like the bottom of a Short */}
        <div style={{position: 'absolute', left: (1080 - PANEL_W) / 2, top: 640, width: PANEL_W, height: panelH, borderRadius: 40, background: '#000', border: '2px solid rgba(232,238,247,0.14)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', opacity: ramp(f, Y_T.panel, Y_T.panel + 6), transform: `translateY(${(1 - panelIn) * 120}px) scale(${0.92 + 0.08 * panelIn})`, overflow: 'hidden'}}>
          {/* channel row: avatar, handle, Subscribe */}
          <div style={{position: 'absolute', left: 40, right: 40, top: 40, display: 'flex', alignItems: 'center', gap: 22, opacity: uiIn * uiOut}}>
            <Img src={staticFile('profile.png')} style={{width: 96, height: 96, borderRadius: 48, objectFit: 'cover', flex: 'none'}} />
            <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 44, color: '#fff'}}>{CHANNEL_HANDLE}</div>
            <div style={{padding: '16px 34px', borderRadius: 999, background: '#fff', fontFamily: F.body, fontWeight: 700, fontSize: 36, color: '#000'}}>Subscribe</div>
          </div>

          {/* ONE element: the Related video pill that, on the tap, stretches into the thumbnail (height 84 -> 450, corners 42 -> 18) */}
          <div style={{position: 'absolute', left: 40, top: PILL_TOP + (55 - PILL_TOP) * open, width: PILL_W, height: 84 + (THUMB_H - 84) * open, borderRadius: 42 - 24 * open, background: tapS > 0.05 && f < Y_T.open ? '#505050' : '#2a2a2a', overflow: 'hidden', opacity: pillIn, boxShadow: `0 0 ${8 + 18 * wake}px rgba(255,255,255,${0.12 + 0.2 * wake})`, transform: `translateY(${(1 - pillIn) * 36}px) scale(${(press + bounce) * (1 + 0.0 * open)})`, transformOrigin: '50% 50%'}}>
            {/* pill content: play triangle and the long video's title only */}
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 84, display: 'flex', alignItems: 'center', gap: 22, padding: '0 30px', opacity: 1 - ramp(open, 0, 0.3)}}>
              <div style={{width: 0, height: 0, flex: 'none', borderTop: '16px solid transparent', borderBottom: '16px solid transparent', borderLeft: '28px solid #fff'}} />
              <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 32, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{LONG_VIDEO_TITLE}</div>
            </div>
            {/* the thumbnail, revealed as the pill grows, drifting slowly once it is open */}
            <Img src={staticFile('thumbnail.jpg')} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: THUMB_H, objectFit: 'cover', opacity: ramp(open, 0.12, 0.6), transform: `scale(${1.02 + 0.05 * drift}) translate(${-6 * drift}px, ${-4 * drift}px)`}} />
            <div style={{position: 'absolute', left: '50%', top: THUMB_H / 2, width: 130, height: 130, marginLeft: -65, marginTop: -65, borderRadius: 65, background: 'rgba(0,0,0,0.55)', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.min(1, badge), transform: `scale(${badge})`}}>
              <div style={{width: 0, height: 0, marginLeft: 10, borderTop: '28px solid transparent', borderBottom: '28px solid transparent', borderLeft: '46px solid #fff'}} />
            </div>
            <div style={{position: 'absolute', right: 16, top: THUMB_H - 52, padding: '4px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.8)', fontFamily: F.body, fontWeight: 700, fontSize: 28, color: '#fff', ...tabular, opacity: ramp(f, Y_T.openEnd - 4, Y_T.openEnd + 4)}}>{mmss(VIDEO_FRAMES)}</div>
          </div>

          {/* tap rings */}
          {[0, 5].map((d) => {
            const r = ramp(f, Y_T.tap + d, Y_T.tap + d + 16);
            return <div key={d} style={{position: 'absolute', left: 40 - r * 30, top: PILL_TOP - r * 30, width: PILL_W + r * 60, height: 84 + r * 60, borderRadius: 999, border: `4px solid ${C.mint}`, opacity: r > 0 && r < 1 ? 0.8 * (1 - r) : 0}} />;
          })}
          {/* the touch point: a soft shadow under it that tightens on the press */}
          <div style={{position: 'absolute', left: PANEL_W * 0.5 + (1 - finger) * 260, top: PILL_TOP + 42 + (1 - finger) * 210, width: 68, height: 68, marginLeft: -34, marginTop: -34, borderRadius: 34, background: 'rgba(255,255,255,0.5)', border: '4px solid rgba(255,255,255,0.92)', boxShadow: `0 ${16 - 10 * tapS}px ${30 - 18 * tapS}px rgba(0,0,0,${0.5 + 0.2 * tapS})`, opacity: ramp(f, Y_T.finger, Y_T.finger + 6) * (1 - ramp(f, Y_T.tap + 10, Y_T.tap + 16)), transform: `scale(${1 - 0.28 * tapS})`}} />
        </div>
      </div>
      <Flash at={Y_T.hero} duration={8} peak={0.2} />
      <SfxTrack cues={Y_CUES} offset={10_000_000} />
    </AbsoluteFill>
  );
};

/** Shorts loop: the last frames fade to the navy the Short starts on, so the card cuts cleanly back to the first frame. */
const LoopFade: React.FC = () => {
  const f = useDesignFrame();
  return <AbsoluteFill style={{background: C.navy3, opacity: ramp(f, 110, 119), pointerEvents: 'none'}} />;
};

/** The end card of every Short: the YouTube demo, or the comment bubble for Instagram and Facebook. */
export const Short1EndCard: React.FC<{variant?: CtaVariant}> = ({variant = 'youtube'}) => (
  <AbsoluteFill>
    {variant === 'youtube' ? <YouTubeEndCard /> : <SocialEndCard variant={variant} />}
    <LoopFade />
  </AbsoluteFill>
);
