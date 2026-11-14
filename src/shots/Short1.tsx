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
export type CtaVariant = 'youtube' | 'social' | 'instagram';
/** 'social' is now Facebook only (link in the pinned first comment). 'instagram' is its own version: comment links are not tappable on
 *  Instagram, so the link lives in the bio and the card says so. */

/** The end card is shared by every Short (1-7) and is 4 s (SHORT1_CTA_SECONDS). Each platform has its own tap demo: YouTube (the Related video
 *  button), Facebook (comment -> pinned link -> video) and Instagram (bio link -> link page). Design frames (30 fps) are local to the card. */
const mmss = (frames: number) => {
  const s = Math.round(frames / 30);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
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

// ---------------------------------------------------------------------------------------------------------------------
// Facebook end card: a demo of what the viewer does. Facebook Reels have no "Related video" button, so the link lives in a pinned first
// comment. The card shows that path in one dark panel: (1) the page row and a comment bar, a touch point taps the bar; (2) the comments
// open with the pinned comment "Full ranking + #1:" and the link in blue, a second tap lands on the link; (3) the link stretches into the
// long video's thumbnail (same morph as the YouTube card). About 3 s of demo inside the 4 s card.
// ---------------------------------------------------------------------------------------------------------------------
/** What the link looks like in the pinned comment. Cosmetic: the real link is whatever you paste into the real comment. Edit to match it. */
export const FB_LINK_TEXT = 'facebook.com/PayRanked/videos';

const FB_T = {head: 4, hero: 20, panel: 22, ui: 28, bar: 32, finger: 34, push: 36, tap: 46, sheet: 48, sheetEnd: 58, finger2: 54, push2: 56, tap2: 68, open: 71, openEnd: 90, end: 120};
const FB_CUES: Cue[] = [
  {sfx: 'hit_big', at: FB_T.hero, gain: 0.35, hero: true}, // the low thud on the "#1" slam
  {sfx: 'whoosh_s', at: FB_T.panel + 2, gain: 0.22, hero: true},
  {sfx: 'pop', at: FB_T.bar + 2, gain: 0.28, hero: true},
  {sfx: 'tap_0', at: FB_T.tap, gain: 0.4, hero: true}, // tap 1: the comment bar
  {sfx: 'click', at: FB_T.tap, gain: 0.25, hero: true},
  {sfx: 'pop', at: FB_T.sheet + 6, gain: 0.3, hero: true}, // the comment appears
  {sfx: 'tap_1', at: FB_T.tap2, gain: 0.4, hero: true}, // tap 2: the link
  {sfx: 'click', at: FB_T.tap2, gain: 0.25, hero: true},
  {sfx: 'whoosh_m', at: FB_T.open, gain: 0.3, hero: true}, // the video opening
  {sfx: 'shimmer', at: FB_T.openEnd + 2, gain: 0.22, hero: true},
];
const FB = {bg: '#18191a', bubble: '#3a3b3c', bubblePressed: '#55565a', text: '#e4e6eb', muted: '#b0b3b8', link: '#4599ff', blue: '#0866ff'};
const FB_PH0 = 330; // page row + comment bar
const FB_PH1 = 400; // comments open
const FB_PH2 = 600; // video open: 450 px thumbnail + caption row
const FB_BAR_TOP = FB_PH0 - 40 - 84;
const FB_LINK = {l: 172, t: 216, w: 560, h: 52}; // where the link sits inside the pinned comment (panel coordinates)

const FacebookEndCard: React.FC = () => {
  const f = useDesignFrame();
  const fade = ramp(f, 0, 8);
  const panelIn = tween(f, FB_T.panel, 22, settle);
  const uiIn = ramp(f, FB_T.ui, FB_T.ui + 8);
  const barIn = tween(f, FB_T.bar, 16, settle);
  const finger1 = ramp(f, FB_T.finger, FB_T.tap, glide);
  const tapP1 = ramp(f, FB_T.tap, FB_T.tap + 8);
  const tapS1 = Math.sin(Math.PI * tapP1);
  const sheet = ramp(f, FB_T.sheet, FB_T.sheetEnd, glide); // panel grows: bar -> comments
  const s1 = uiIn * (1 - ramp(f, FB_T.tap + 2, FB_T.tap + 7)); // page row + bar: gone before the comments show
  const finger2 = ramp(f, FB_T.finger2, FB_T.tap2, glide);
  const tapP2 = ramp(f, FB_T.tap2, FB_T.tap2 + 8);
  const tapS2 = Math.sin(Math.PI * tapP2);
  const open = ramp(f, FB_T.open, FB_T.openEnd, glide); // the link stretches into the thumbnail
  const s2 = ramp(f, FB_T.sheet + 5, FB_T.sheet + 13) * (1 - ramp(f, FB_T.open - 2, FB_T.open + 8)); // the comments, in once the bar is gone
  const land = f - FB_T.openEnd;
  const bounce = land >= 0 ? 0.03 * Math.exp(-land / 5) * Math.sin(land * 1.15) : 0;
  const panelH = FB_PH0 + (FB_PH1 - FB_PH0) * sheet + (FB_PH2 - FB_PH1) * open;
  const PILL_W = PANEL_W - 80;
  const THUMB_H = (PILL_W * 9) / 16;
  const drift = ramp(f, FB_T.openEnd, FB_T.end);
  const badge = ramp(f, FB_T.openEnd - 6, FB_T.openEnd + 4) * (1 + 0.06 * Math.sin(f / 6));
  const wake1 = ramp(f, FB_T.bar + 6, FB_T.bar + 18) * (1 - ramp(f, FB_T.tap, FB_T.tap + 6)) * (0.5 + 0.5 * Math.sin(f / 6));
  const wake2 = ramp(f, FB_T.sheet + 8, FB_T.sheet + 18) * (1 - ramp(f, FB_T.tap2, FB_T.tap2 + 6)) * (0.5 + 0.5 * Math.sin(f / 6));
  const barPressed = tapS1 > 0.05 && f < FB_T.sheet + 4;
  const linkPressed = tapS2 > 0.05 && f < FB_T.open;
  // camera: push in on the bar, ease back as the comments open, push in on the link, pull back as the video opens, then a slow drift
  const cam = 1 + 0.08 * ramp(f, FB_T.push, FB_T.tap, glide) - 0.08 * ramp(f, FB_T.tap + 4, FB_T.sheetEnd, glide) + 0.08 * ramp(f, FB_T.push2, FB_T.tap2, glide) - 0.1 * ramp(f, FB_T.open, FB_T.openEnd, glide) + 0.02 * drift;
  const ring = (d: number, at: number, x: number, y: number, w: number, h: number) => {
    const r = ramp(f, at + d, at + d + 16);
    return <div key={`${at}-${d}`} style={{position: 'absolute', left: x - r * 30, top: y - r * 30, width: w + r * 60, height: h + r * 60, borderRadius: 999, border: `4px solid ${C.mint}`, opacity: r > 0 && r < 1 ? 0.8 * (1 - r) : 0}} />;
  };
  const touch = (x: number, y: number, tapS: number, vis: number) => (
    <div style={{position: 'absolute', left: x, top: y, width: 68, height: 68, marginLeft: -34, marginTop: -34, borderRadius: 34, background: 'rgba(255,255,255,0.5)', border: '4px solid rgba(255,255,255,0.92)', boxShadow: `0 ${16 - 10 * tapS}px ${30 - 18 * tapS}px rgba(0,0,0,${0.5 + 0.2 * tapS})`, opacity: vis, transform: `scale(${1 - 0.28 * tapS})`}} />
  );
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${C.navy1} 0%, ${C.navy2} 55%, ${C.navy3} 100%)`, opacity: fade}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: `540px ${640 + 260}px`}}>
        <div style={{position: 'absolute', left: 40, right: 40, top: 200, textAlign: 'center'}}>
          <Headline start={FB_T.head} />
        </div>

        <div style={{position: 'absolute', left: (1080 - PANEL_W) / 2, top: 640, width: PANEL_W, height: panelH, borderRadius: 40, background: FB.bg, border: '2px solid rgba(232,238,247,0.14)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', opacity: ramp(f, FB_T.panel, FB_T.panel + 6), transform: `translateY(${(1 - panelIn) * 120}px) scale(${0.92 + 0.08 * panelIn})`, overflow: 'hidden'}}>
          {/* stage 1: the page row (avatar, name, Follow) and the comment bar */}
          <div style={{position: 'absolute', left: 40, right: 40, top: 40, display: 'flex', alignItems: 'center', gap: 22, opacity: s1}}>
            <Img src={staticFile('profile.png')} style={{width: 96, height: 96, borderRadius: 48, objectFit: 'cover', flex: 'none'}} />
            <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 44, color: FB.text}}>PayRanked</div>
            <div style={{padding: '16px 34px', borderRadius: 14, background: FB.blue, fontFamily: F.body, fontWeight: 700, fontSize: 36, color: '#fff'}}>Follow</div>
          </div>
          <div style={{position: 'absolute', left: 40, top: FB_BAR_TOP, width: PILL_W, height: 84, borderRadius: 42, background: barPressed ? FB.bubblePressed : FB.bubble, display: 'flex', alignItems: 'center', gap: 22, padding: '0 34px', opacity: barIn * (1 - ramp(f, FB_T.tap + 2, FB_T.tap + 7)), boxShadow: `0 0 ${8 + 18 * wake1}px rgba(255,255,255,${0.1 + 0.2 * wake1})`, transform: `translateY(${(1 - barIn) * 36}px) scale(${1 - 0.06 * tapS1})`}}>
            <div style={{position: 'relative', width: 40, height: 32, borderRadius: 12, border: `5px solid ${FB.muted}`, flex: 'none'}} />
            <div style={{fontFamily: F.body, fontWeight: 500, fontSize: 36, color: FB.muted}}>Write a comment…</div>
          </div>

          {/* stage 2: the comments, with the pinned comment and the link */}
          <div style={{position: 'absolute', left: 0, top: 0, width: PANEL_W, height: FB_PH1, opacity: s2}}>
            <div style={{position: 'absolute', left: PANEL_W / 2 - 44, top: 20, width: 88, height: 8, borderRadius: 4, background: '#5a5c60'}} />
            <Img src={staticFile('profile.png')} style={{position: 'absolute', left: 40, top: 90, width: 84, height: 84, borderRadius: 42, objectFit: 'cover'}} />
            <div style={{position: 'absolute', left: 148, top: 90, width: 692, height: 202, borderRadius: 36, background: FB.bubble}}>
              <div style={{position: 'absolute', left: 24, top: 22, display: 'flex', alignItems: 'baseline', gap: 14, fontFamily: F.body}}>
                <span style={{fontWeight: 700, fontSize: 34, color: FB.text}}>PayRanked</span>
                <span style={{fontWeight: 500, fontSize: 26, color: FB.muted}}>· Pinned</span>
              </div>
              <div style={{position: 'absolute', left: 24, top: 74, fontFamily: F.body, fontWeight: 500, fontSize: 38, color: FB.text}}>Full ranking + #1:</div>
              <div style={{position: 'absolute', left: FB_LINK.l - 148, top: FB_LINK.t - 90, width: FB_LINK.w, height: FB_LINK.h, borderRadius: 10, background: linkPressed ? 'rgba(69,153,255,0.28)' : `rgba(69,153,255,${0.12 * wake2})`, fontFamily: F.body, fontWeight: 500, fontSize: 38, color: FB.link, lineHeight: `${FB_LINK.h}px`, whiteSpace: 'nowrap'}}>{FB_LINK_TEXT}</div>
            </div>
            <div style={{position: 'absolute', left: 172, top: 304, fontFamily: F.body, fontWeight: 600, fontSize: 28, color: FB.muted, display: 'flex', gap: 28}}>
              <span>Like</span><span>Reply</span><span style={{fontWeight: 400}}>Just now</span>
            </div>
          </div>

          {/* stage 3: ONE element, the link, that stretches into the long video's thumbnail (corners 10 -> 18) */}
          <div style={{position: 'absolute', left: FB_LINK.l + (40 - FB_LINK.l) * open, top: FB_LINK.t + (40 - FB_LINK.t) * open, width: FB_LINK.w + (PILL_W - FB_LINK.w) * open, height: FB_LINK.h + (THUMB_H - FB_LINK.h) * open, borderRadius: 10 + 8 * open, background: '#111', overflow: 'hidden', opacity: ramp(f, FB_T.open, FB_T.open + 3), transform: `scale(${1 + bounce})`, transformOrigin: '50% 50%'}}>
            <Img src={staticFile('thumbnail.jpg')} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: THUMB_H, objectFit: 'cover', opacity: ramp(open, 0.1, 0.55), transform: `scale(${1.02 + 0.05 * drift}) translate(${-6 * drift}px, ${-4 * drift}px)`}} />
            <div style={{position: 'absolute', left: '50%', top: THUMB_H / 2, width: 130, height: 130, marginLeft: -65, marginTop: -65, borderRadius: 65, background: 'rgba(0,0,0,0.55)', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.min(1, badge), transform: `scale(${badge})`}}>
              <div style={{width: 0, height: 0, marginLeft: 10, borderTop: '28px solid transparent', borderBottom: '28px solid transparent', borderLeft: '46px solid #fff'}} />
            </div>
            <div style={{position: 'absolute', right: 16, top: THUMB_H - 52, padding: '4px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.8)', fontFamily: F.body, fontWeight: 700, fontSize: 28, color: '#fff', ...tabular, opacity: ramp(f, FB_T.openEnd - 4, FB_T.openEnd + 4)}}>{mmss(VIDEO_FRAMES)}</div>
          </div>
          {/* the caption under the video: page avatar and the long video's title */}
          <div style={{position: 'absolute', left: 40, right: 40, top: 40 + THUMB_H + 20, display: 'flex', alignItems: 'center', gap: 20, opacity: ramp(f, FB_T.openEnd - 6, FB_T.openEnd + 4)}}>
            <Img src={staticFile('profile.png')} style={{width: 60, height: 60, borderRadius: 30, objectFit: 'cover', flex: 'none'}} />
            <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 30, color: FB.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{LONG_VIDEO_TITLE}</div>
          </div>

          {/* tap rings and the touch point, for both taps */}
          {[0, 5].map((d) => ring(d, FB_T.tap, 40, FB_BAR_TOP, PILL_W, 84))}
          {[0, 5].map((d) => ring(d, FB_T.tap2, FB_LINK.l - 12, FB_LINK.t - 8, FB_LINK.w + 24, FB_LINK.h + 16))}
          {touch(PANEL_W * 0.5 + (1 - finger1) * 260, FB_BAR_TOP + 42 + (1 - finger1) * 210, tapS1, ramp(f, FB_T.finger, FB_T.finger + 6) * (1 - ramp(f, FB_T.tap + 10, FB_T.tap + 16)))}
          {touch(FB_LINK.l + FB_LINK.w * 0.5 + (1 - finger2) * 200, FB_LINK.t + FB_LINK.h / 2 + (1 - finger2) * 170, tapS2, ramp(f, FB_T.finger2, FB_T.finger2 + 6) * (1 - ramp(f, FB_T.tap2 + 10, FB_T.tap2 + 16)))}
        </div>
      </div>
      <Flash at={FB_T.hero} duration={8} peak={0.2} />
      <SfxTrack cues={FB_CUES} offset={10_000_000} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// Instagram end card: a demo of the link in the bio. Instagram comments are not tappable, so the link lives in the bio. The card shows
// the profile (avatar, @handle, name, Follow / Message, bio, the link) with NO post / follower counts; a touch point taps the bio link and
// the link page opens like an in-app browser (that page is the PayRanked link page: brand film, "Data-backed finance", Subscribe on
// YouTube, then "Latest video"); a swipe scrolls it down to the newest long video. About 3 s of demo inside the 4 s card.
// ---------------------------------------------------------------------------------------------------------------------
export const IG_HANDLE = 'payranked.official';
export const IG_NAME = 'PayRanked';
export const IG_BIO = 'Visualizing US incomes, career pay gaps, and wealth-building data backed by official numbers.';
/** What the bio link looks like. Cosmetic: the real link is whatever is in your Instagram bio. Edit it to match. */
export const IG_LINK_TEXT = 'payranked.com/links';
const IG_TAGLINE = 'Visualizing US incomes, career pay gaps, and wealth-building data backed by official numbers.';

const IG_T = {head: 4, hero: 20, panel: 22, ui: 28, link: 34, finger: 36, push: 38, tap: 48, open: 51, openEnd: 64, scroll: 72, scrollEnd: 92, end: 120};
const IG_CUES: Cue[] = [
  {sfx: 'hit_big', at: IG_T.hero, gain: 0.35, hero: true}, // the low thud on the "#1" slam
  {sfx: 'whoosh_s', at: IG_T.panel + 2, gain: 0.22, hero: true},
  {sfx: 'pop', at: IG_T.link + 2, gain: 0.28, hero: true},
  {sfx: 'tap_0', at: IG_T.tap, gain: 0.4, hero: true}, // the tap on the bio link
  {sfx: 'click', at: IG_T.tap, gain: 0.25, hero: true},
  {sfx: 'whoosh_m', at: IG_T.open, gain: 0.3, hero: true}, // the page opening
  {sfx: 'pop', at: IG_T.openEnd + 2, gain: 0.25, hero: true},
  {sfx: 'swish', at: IG_T.scroll, gain: 0.25, hero: true}, // the swipe
  {sfx: 'shimmer', at: IG_T.scrollEnd + 2, gain: 0.22, hero: true},
];
const IGC = {bg: '#0c1014', btn: '#25292e', text: '#f5f5f5', muted: '#a8a8a8', link: '#e0f1ff', follow: '#0095f6'};
const IG_PH0 = 500; // profile
const IG_PH1 = 820; // link page open
const IG_BAR_H = 76; // the in-app browser's top bar
const IG_LINK = {l: 40, t: 396, w: 440, h: 52}; // the bio link, panel coordinates
const IG_SCROLL = 760; // how far the page scrolls to put the newest video in view

const InstagramEndCard: React.FC = () => {
  const f = useDesignFrame();
  const fade = ramp(f, 0, 8);
  const panelIn = tween(f, IG_T.panel, 22, settle);
  const uiIn = ramp(f, IG_T.ui, IG_T.ui + 8);
  const linkIn = tween(f, IG_T.link, 16, settle);
  const finger = ramp(f, IG_T.finger, IG_T.tap, glide);
  const tapP = ramp(f, IG_T.tap, IG_T.tap + 8);
  const tapS = Math.sin(Math.PI * tapP);
  const open = ramp(f, IG_T.open, IG_T.openEnd, glide); // the link grows into the page
  const s1 = uiIn * (1 - ramp(f, IG_T.tap + 2, IG_T.tap + 8)); // the profile: gone as the page opens
  const sc = ramp(f, IG_T.scroll, IG_T.scrollEnd, glide);
  const land = f - IG_T.openEnd;
  const bounce = land >= 0 ? 0.015 * Math.exp(-land / 5) * Math.sin(land * 1.15) : 0;
  const panelH = IG_PH0 + (IG_PH1 - IG_PH0) * open;
  const wake = ramp(f, IG_T.link + 6, IG_T.link + 20) * (1 - ramp(f, IG_T.tap, IG_T.tap + 6)) * (0.5 + 0.5 * Math.sin(f / 6));
  const linkPressed = tapS > 0.05 && f < IG_T.open;
  const pulse = 0.5 + 0.5 * Math.sin(f / 5);
  const cam = 1 + 0.08 * ramp(f, IG_T.push, IG_T.tap, glide) - 0.08 * ramp(f, IG_T.open, IG_T.openEnd, glide) + 0.02 * ramp(f, IG_T.scrollEnd, IG_T.end);
  const W = PANEL_W - 80; // content width on the page
  const swipeVis = ramp(f, IG_T.scroll - 4, IG_T.scroll) * (1 - ramp(f, IG_T.scrollEnd - 2, IG_T.scrollEnd + 4));
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${C.navy1} 0%, ${C.navy2} 55%, ${C.navy3} 100%)`, opacity: fade}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: `540px ${640 + 300}px`}}>
        <div style={{position: 'absolute', left: 40, right: 40, top: 200, textAlign: 'center'}}>
          <Headline start={IG_T.head} />
        </div>

        <div style={{position: 'absolute', left: (1080 - PANEL_W) / 2, top: 640, width: PANEL_W, height: panelH, borderRadius: 40, background: IGC.bg, border: '2px solid rgba(232,238,247,0.14)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', opacity: ramp(f, IG_T.panel, IG_T.panel + 6), transform: `translateY(${(1 - panelIn) * 120}px) scale(${0.92 + 0.08 * panelIn})`, overflow: 'hidden'}}>
          {/* stage 1: the profile. No post / follower / following counts. */}
          <div style={{position: 'absolute', inset: 0, opacity: s1}}>
            <Img src={staticFile('profile.png')} style={{position: 'absolute', left: 40, top: 36, width: 120, height: 120, borderRadius: 60, objectFit: 'cover'}} />
            <div style={{position: 'absolute', left: 190, top: 44, fontFamily: F.body, fontWeight: 700, fontSize: 42, color: IGC.text}}>{IG_HANDLE}</div>
            <div style={{position: 'absolute', left: 190, top: 100, fontFamily: F.body, fontWeight: 500, fontSize: 30, color: IGC.muted}}>{IG_NAME}</div>
            <div style={{position: 'absolute', left: 40, top: 190, width: 392, height: 76, borderRadius: 18, background: IGC.follow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.body, fontWeight: 700, fontSize: 32, color: '#fff'}}>Follow</div>
            <div style={{position: 'absolute', left: 448, top: 190, width: 392, height: 76, borderRadius: 18, background: IGC.btn, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.body, fontWeight: 700, fontSize: 32, color: IGC.text}}>Message</div>
            <div style={{position: 'absolute', left: 40, top: 296, width: 800, fontFamily: F.body, fontWeight: 500, fontSize: 30, lineHeight: '42px', color: IGC.text}}>{IG_BIO}</div>
            {/* the bio link: icon + text, lights up softly before the tap */}
            <div style={{position: 'absolute', left: IG_LINK.l - 12, top: IG_LINK.t, width: IG_LINK.w, height: IG_LINK.h, borderRadius: 14, background: linkPressed ? 'rgba(224,241,255,0.2)' : `rgba(224,241,255,${0.1 * wake})`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 12px', opacity: linkIn, transform: `translateY(${(1 - linkIn) * 30}px) scale(${1 - 0.05 * tapS})`}}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={IGC.link} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              <span style={{fontFamily: F.body, fontWeight: 600, fontSize: 32, color: IGC.link, whiteSpace: 'nowrap'}}>{IG_LINK_TEXT}</span>
            </div>
          </div>

          {/* stage 2: ONE element, the link, that grows into the in-app browser showing the PayRanked link page */}
          <div style={{position: 'absolute', left: IG_LINK.l * (1 - open), top: IG_LINK.t * (1 - open), width: IG_LINK.w + (PANEL_W - IG_LINK.w) * open, height: IG_LINK.h + (IG_PH1 - IG_LINK.h) * open, borderRadius: 14 * (1 - open), overflow: 'hidden', background: '#060d18', opacity: ramp(f, IG_T.open, IG_T.open + 2), transform: `scale(${1 + bounce})`, transformOrigin: '50% 30%'}}>
            <div style={{position: 'absolute', left: 0, top: 0, width: PANEL_W, height: IG_PH1, opacity: ramp(open, 0.5, 0.9)}}>
              {/* the page itself */}
              <div style={{position: 'absolute', left: 0, right: 0, top: IG_BAR_H, bottom: 0, overflow: 'hidden', background: 'radial-gradient(circle at 0% 0%, rgba(20,57,106,0.75), transparent 55%), radial-gradient(circle at 100% 100%, rgba(15,168,106,0.35), transparent 55%), #060d18'}}>
                <div style={{position: 'absolute', left: 40, top: 28, width: W, transform: `translateY(${-IG_SCROLL * sc}px)`}}>
                  <div style={{position: 'relative', width: W, height: 450, borderRadius: 24, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.08)'}}>
                    <Img src={staticFile('linkpage-poster.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  </div>
                  <div style={{display: 'flex', justifyContent: 'center', marginTop: 28}}>
                    <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, height: 46, padding: '0 26px', borderRadius: 999, border: '2px solid rgba(61,240,168,0.4)', background: 'rgba(61,240,168,0.07)', fontFamily: F.body, fontWeight: 600, fontSize: 22, color: C.mint}}>
                      <span style={{position: 'relative', width: 12, height: 12, borderRadius: 6, background: C.mint, boxShadow: `0 0 ${6 + 14 * pulse}px ${C.mint}`}} />
                      Data-backed finance
                    </div>
                  </div>
                  <div style={{width: 640, margin: '22px auto 0', textAlign: 'center', fontFamily: F.body, fontWeight: 500, fontSize: 26, lineHeight: '38px', color: C.muted}}>{IG_TAGLINE}</div>
                  <div style={{marginTop: 34, height: 92, borderRadius: 24, background: C.mint, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, fontFamily: F.body, fontWeight: 700, fontSize: 31, color: '#03150d', boxShadow: '0 16px 40px -14px rgba(61,240,168,0.6)'}}>
                    <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2C.5 9.1.5 12 .5 12s0 2.9.5 4.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8zM9.8 15.1V8.9l5.4 3.1-5.4 3.1z" /></svg>
                    Subscribe on YouTube
                  </div>
                  <div style={{marginTop: 44, fontFamily: F.display, fontWeight: 600, fontSize: 34, color: C.text}}>Latest video</div>
                  {/* the newest long video, as the page lists it */}
                  <div style={{position: 'relative', marginTop: 20, width: W, height: 590, borderRadius: 28, overflow: 'hidden', background: '#0c1626', border: '2px solid rgba(255,255,255,0.08)'}}>
                    <div style={{position: 'relative', width: W, height: 450}}>
                      <Img src={staticFile('thumbnail.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      <div style={{position: 'absolute', left: 20, top: 20, padding: '6px 18px', borderRadius: 999, background: C.mint, fontFamily: F.body, fontWeight: 700, fontSize: 22, color: '#03150d'}}>Newest</div>
                      <div style={{position: 'absolute', left: 20, bottom: 20, width: 84, height: 84, borderRadius: 42, background: 'rgba(6,13,24,0.72)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <div style={{width: 0, height: 0, marginLeft: 6, borderTop: '17px solid transparent', borderBottom: '17px solid transparent', borderLeft: '28px solid #fff'}} />
                      </div>
                    </div>
                    <div style={{padding: '22px 28px', fontFamily: F.display, fontWeight: 600, fontSize: 32, lineHeight: '42px', color: C.text}}>{LONG_VIDEO_TITLE}</div>
                  </div>
                </div>
              </div>
              {/* the in-app browser's top bar: close, and the address */}
              <div style={{position: 'absolute', left: 0, top: 0, width: PANEL_W, height: IG_BAR_H, background: IGC.bg, borderBottom: '2px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg style={{position: 'absolute', left: 30, top: 22}} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={IGC.text} strokeWidth="2.4" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19" /></svg>
                <span style={{fontFamily: F.body, fontWeight: 600, fontSize: 28, color: IGC.text}}>{IG_LINK_TEXT}</span>
              </div>
            </div>
          </div>

          {/* tap rings and the touch points: the tap on the link, then the swipe that scrolls the page */}
          {[0, 5].map((d) => {
            const r = ramp(f, IG_T.tap + d, IG_T.tap + d + 16);
            return <div key={d} style={{position: 'absolute', left: IG_LINK.l - 12 - r * 30, top: IG_LINK.t - r * 30, width: IG_LINK.w + r * 60, height: IG_LINK.h + r * 60, borderRadius: 999, border: `4px solid ${C.mint}`, opacity: r > 0 && r < 1 ? 0.8 * (1 - r) * (1 - ramp(f, IG_T.open, IG_T.open + 3)) : 0}} />;
          })}
          <div style={{position: 'absolute', left: IG_LINK.l + 200 + (1 - finger) * 300, top: IG_LINK.t + IG_LINK.h / 2 + (1 - finger) * 200, width: 68, height: 68, marginLeft: -34, marginTop: -34, borderRadius: 34, background: 'rgba(255,255,255,0.5)', border: '4px solid rgba(255,255,255,0.92)', boxShadow: `0 ${16 - 10 * tapS}px ${30 - 18 * tapS}px rgba(0,0,0,${0.5 + 0.2 * tapS})`, opacity: ramp(f, IG_T.finger, IG_T.finger + 6) * (1 - ramp(f, IG_T.tap + 2, IG_T.tap + 5)), transform: `scale(${1 - 0.28 * tapS})`}} />
          <div style={{position: 'absolute', left: PANEL_W * 0.5, top: 640 - 330 * sc, width: 68, height: 68, marginLeft: -34, marginTop: -34, borderRadius: 34, background: 'rgba(255,255,255,0.5)', border: '4px solid rgba(255,255,255,0.92)', boxShadow: '0 6px 12px rgba(0,0,0,0.7)', opacity: swipeVis, transform: 'scale(0.78)'}} />
        </div>
      </div>
      <Flash at={IG_T.hero} duration={8} peak={0.2} />
      <SfxTrack cues={IG_CUES} offset={10_000_000} />
    </AbsoluteFill>
  );
};

/** Shorts loop: the last frames fade to the navy the Short starts on, so the card cuts cleanly back to the first frame. */
const LoopFade: React.FC = () => {
  const f = useDesignFrame();
  return <AbsoluteFill style={{background: C.navy3, opacity: ramp(f, 110, 119), pointerEvents: 'none'}} />;
};

/** The end card of every Short: the YouTube demo, the Facebook comment-and-link demo, or the Instagram bio-link demo. */
export const Short1EndCard: React.FC<{variant?: CtaVariant}> = ({variant = 'youtube'}) => (
  <AbsoluteFill>
    {variant === 'youtube' ? <YouTubeEndCard /> : variant === 'social' ? <FacebookEndCard /> : <InstagramEndCard />}
    <LoopFade />
  </AbsoluteFill>
);
