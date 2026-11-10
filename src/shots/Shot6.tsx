import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background} from '../components/Background';
import {Glass} from '../components/Glass';
import {MaskWords} from '../components/MaskText';
import {MotionBlur} from '../components/MotionBlur';
import {anticipate, glide, ramp, stagger, tween} from '../motion';
import {DrawIcon, IconKind} from '../components/Icons';
import {SourceTag} from '../components/common';
import {byName, fmtUSD, gap} from '../data';
import {C, F, H, W, sec, tabular} from '../theme';
import {useDesignFrame} from '../clock';
import {SHOT_SECONDS} from '../timeline';

export const SHOT6_FRAMES = sec(SHOT_SECONDS.shot6); // the payoff has landed, so the outro is just the recap, then a fade to black (no next-video card, subscribe button or end screen)

/** Shot-local times (0 = the end of the reality check). */
export const T = {
  cards: sec(0.5),
  pct: sec(3),
  /** the shot fades to black over its last second */
  fade: SHOT6_FRAMES - sec(1),
};

// recap card grid: 130px gutters (was 60), the row stays centred in the 1920 frame
const CARD_W = 480;
const CARD_GAP = 130;
const CARD_PITCH = CARD_W + CARD_GAP;
const CARD_LEFT = (W - (3 * CARD_W + 2 * CARD_GAP)) / 2;

export const Shot6: React.FC = () => {
  const f = useDesignFrame();
  const ark = byName('Arkansas');
  const cal = byName('California');
  const g = gap('Arkansas', 'California');

  const cards: {text: string; icon: IconKind}[] = [
    {text: `${fmtUSD(cal.display)} to ${fmtUSD(ark.display)}`, icon: 'bars'},
    {text: 'No tax isn’t always cheaper', icon: 'percent'},
    {text: 'City beats state', icon: 'buildings'},
  ];

  // huge 27% behind the cards
  // 0.13 reads as designed type rather than print bleed (was 0.08); the RGB fringe below is the chromatic aberration pass
  const pctOpacity = 0.13 * ramp(f, T.pct, T.pct + 20, glide);
  const pctFringe = 6 + 2 * Math.sin(f / 40); // px of channel split, breathing slightly

  // fade to black over the last second
  const fadeOut = ramp(f, T.fade, SHOT6_FRAMES, glide);

  return (
    <AbsoluteFill>
      <Background glowX={W * 0.5} glowY={H * 0.5}>
        {/* 27% behind the cards */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 40 + Math.sin(f / 50) * 20,
            height: 940,
            opacity: pctOpacity,
            transform: `translateX(${Math.sin(f / 70) * 40}px)`,
            isolation: 'isolate',
          }}
        >
          {/* chromatic aberration: a warm fringe left, a cool fringe right, the mint core on top; screen-blended so the edges glow instead of muddying */}
          {[
            {color: '#FF4F7A', dx: -pctFringe, blend: 'screen' as const},
            {color: '#3FA0FF', dx: pctFringe, blend: 'screen' as const},
            {color: C.mint, dx: 0, blend: 'normal' as const},
          ].map((layer, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                textAlign: 'center',
                fontFamily: F.display,
                fontWeight: 700,
                fontSize: 940,
                lineHeight: 1,
                color: layer.color,
                mixBlendMode: layer.blend,
                transform: `translateX(${layer.dx}px)`,
                ...tabular,
              }}
            >
              {Math.round(g.pct)}%
            </div>
          ))}
        </div>

        {/* recap cards: a 3D flip on the anticipate curve (a small wind-up, a whip, a settle), each text following its card */}
        {cards.map((c, i) => {
          const d = T.cards + stagger(i, 10);
          const flipAt = (t: number) => tween(t, d, 36, anticipate);
          const p = flipAt(f);
          const quiet = i === 0 ? 1 : 0.9;
          return (
            <MotionBlur
              key={c.text}
              dx={90 * (flipAt(f) - flipAt(f - 1)) * -1}
              shutter={0.6}
              cap={30}
              style={{position: 'absolute', left: CARD_LEFT + i * CARD_PITCH, top: 230 + Math.sin(f / 30 + i * 1.3) * 5, width: CARD_W, height: 580}}
            >
              <Glass
                radius={32}
                tint={C.text}
                strength={1.1}
                style={{
                  width: CARD_W,
                  height: 580,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 40,
                  padding: 36,
                  textAlign: 'center',
                  opacity: ramp(f, d, d + 10, glide) * quiet,
                  transform: `perspective(1400px) rotateY(${(1 - p) * 90}deg)`,
                }}
              >
                <DrawIcon kind={c.icon} start={d + 16} size={160} color={C.mint} strokeWidth={3} />
                <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 52, lineHeight: 1.15, color: C.text, ...tabular}}>
                  <MaskWords text={c.text} start={d + 20} step={4} dur={20} />
                </div>
              </Glass>
            </MotionBlur>
          );
        })}

      </Background>
      <SourceTag />
      <AbsoluteFill style={{background: '#000', opacity: fadeOut, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
