import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Shot1} from './Shot1';
import {Shot3} from './Shot3';
import {C, F, sec, tabular} from '../theme';
import {useDesignFrame} from '../clock';
import {MaskLine, MaskWords} from '../components/MaskText';
import {SfxTrack} from '../audio/Sfx';
import {Cue} from '../audio/cues';
import {glide, ramp, snap, tween} from '../motion';
import {byName, COUNTDOWN, fmtUSD} from '../data';
import {VIDEO_FRAMES} from '../timeline';
import {Glass} from '../components/Glass';

// 13.7 s (was 13.5): clip 006 "...A hundred is the national average." is silent from 7.80 s to 8.12 s (measured on the WAV), and 13.7 s lands the cut
// at 7.82 s into the clip. 13.5 s cut inside "average"; the next beat (needle to California) starts at 13.72 s, so the picture stays clean.
export const SHORT1_METHOD_SECONDS = 13.7;
export const SHORT1_CTA_SECONDS = 3.5;
export const SHORT1_FRAMES = sec(27 + SHORT1_METHOD_SECONDS + SHORT1_CTA_SECONDS);

/** Which end line a render carries: 'youtube' = "on my channel" (the related-video button and pinned comment do the linking);
 *  'social' = Instagram and Facebook, where there is no related-video button, so the card says "link in comments" and points down. */
export type CtaVariant = 'youtube' | 'social';
export const CTA_LINE: Record<CtaVariant, string> = {youtube: 'on my channel', social: 'link in comments'};

/**
 * The end card, shared by every Short (1-7), so each one ends the same way. Design frames (30 fps) local to the card
 * (SHORT1_CTA_SECONDS = 3.5 s = 105 frames). It shows a small preview of the long video, then says where to find it:
 *   0-10   background fades in
 *   6-30   a video-style card slides up: header, then the countdown rows #10-#6 fill one after another (numbers from src/data)
 *   34-52  the #1 row lights up as a locked "???" (the Shorts never give away the winner) and a progress line sweeps the card
 *   40-60  "Full ranking + #1" rises word by word
 *   58-74  a mint rule draws, the platform line rises ("on my channel" or "link in comments"), then a pulse
 */
const CTA_T = {card: 6, rows: 14, rowStep: 5, mystery: 40, title: 44, rule: 62, sub: 68, pulse: 84};
// Sound cues are local to the card. The offset is far past the voice-over envelope, so the voice ducking never touches them.
const CTA_CUES: Cue[] = [
  {sfx: 'whoosh_s', at: CTA_T.card + 2, gain: 0.25, hero: true},
  {sfx: 'tick_0', at: CTA_T.rows + 4, gain: 0.2, hero: true},
  {sfx: 'tick_1', at: CTA_T.rows + 9, gain: 0.2, hero: true},
  {sfx: 'tick_2', at: CTA_T.rows + 14, gain: 0.2, hero: true},
  {sfx: 'tick_0', at: CTA_T.rows + 19, gain: 0.2, hero: true},
  {sfx: 'tick_1', at: CTA_T.rows + 24, gain: 0.2, hero: true},
  {sfx: 'pop', at: CTA_T.title + 6, gain: 0.35, hero: true},
  {sfx: 'ding_hi', at: CTA_T.sub + 8, gain: 0.3, hero: true},
];

const mmss = (frames: number) => {
  const s = Math.round(frames / 30);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** The long video's countdown, #10 to #6, as five rows. #1 stays locked. */
const PREVIEW_ROWS = COUNTDOWN.filter((c) => c.rank >= 6 && c.rank <= 10).map((c) => ({label: c.label, name: c.names.join(' · '), extra: byName(c.names[0]).display - 100000, value: fmtUSD(byName(c.names[0]).display)}));

export const Short1EndCard: React.FC<{variant?: CtaVariant}> = ({variant = 'youtube'}) => {
  const f = useDesignFrame();
  const fade = ramp(f, 0, 10);
  const card = tween(f, CTA_T.card, 22, snap);
  const bob = 5 * Math.sin(f / 14);
  const mystery = tween(f, CTA_T.mystery, 12, snap);
  const lit = 0.5 + 0.5 * Math.sin(f / 5);
  const sweep = ramp(f, CTA_T.rows, CTA_T.title + 20); // the progress line of the card
  const rule = ramp(f, CTA_T.rule, CTA_T.rule + 16, glide);
  const pulse = Math.sin(Math.PI * ramp(f, CTA_T.pulse, CTA_T.pulse + 20));
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
      <div style={{position: 'absolute', left: 56, right: 56, top: 1000, textAlign: 'center'}}>
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 108, lineHeight: 1.1, color: C.text}}>
          <MaskWords text="Full ranking + #1" start={CTA_T.title} step={5} dur={18} />
        </div>
        <div style={{margin: '28px auto 0', height: 8, width: 520 * rule, borderRadius: 4, background: C.mint, boxShadow: `0 0 ${24 + 30 * pulse}px ${C.mint}${pulse > 0.2 ? 'aa' : '66'}`}} />
        <div style={{marginTop: 28, fontFamily: F.body, fontWeight: 600, fontSize: 54, color: C.mint, transform: `scale(${1 + 0.05 * pulse})`}}>
          <MaskLine start={CTA_T.sub} dur={16}>{CTA_LINE[variant]}</MaskLine>
        </div>
        {variant === 'social' && (
          // a chevron that points down toward the comments and bobs, so the card keeps moving until the end
          <div style={{margin: '44px auto 0', width: 40, height: 40, borderRight: `10px solid ${C.mint}`, borderBottom: `10px solid ${C.mint}`, borderRadius: 3, opacity: ramp(f, CTA_T.sub + 14, CTA_T.sub + 26), transform: `translateY(${8 * Math.sin(f / 5)}px) rotate(45deg)`}} />
        )}
      </div>
      <SfxTrack cues={CTA_CUES} offset={10_000_000} />
    </AbsoluteFill>
  );
};
