import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background} from '../components/Background';
import {Glass} from '../components/Glass';
import {MaskWords} from '../components/MaskText';
import {MotionBlur} from '../components/MotionBlur';
import {anticipate, glide, ramp, snap, stagger, tween} from '../motion';
import {DrawIcon, IconKind} from '../components/Icons';
import {SourceTag, win} from '../components/common';
import {byName, fmtUSD, gap} from '../data';
import {C, F, H, W, clamp, sec, tabular} from '../theme';
import {useDesignFrame} from '../clock';
import {SHOT_SECONDS} from '../timeline';

export const SHOT6_FRAMES = sec(SHOT_SECONDS.shot6); // was 75 s; the payoff has landed, so the outro is a recap, one ask and an end screen

/** Shot-local times (0 = the end of the reality check). End screen: 10 s (from `end` to the end of the shot, see SHOT_SECONDS). */
export const T = {
  cards: sec(0.5),
  pct: sec(3),
  next: sec(5.5),
  cursor: sec(8.5),
  click: sec(11),
  end: sec(13),
};

export const BUTTON = {x: 1500, y: 560};

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
  const cardsExit = ramp(f, T.next, T.next + 16, glide);

  // huge 27% behind the cards
  // 0.13 reads as designed type rather than print bleed (was 0.08); the RGB fringe below is the chromatic aberration pass
  const pctOpacity = 0.13 * ramp(f, T.pct, T.pct + 20, glide) * (1 - ramp(f, T.next + 4, T.next + 18, glide));
  const pctFringe = 6 + 2 * Math.sin(f / 40); // px of channel split, breathing slightly

  // next-video card
  const nextAt = (t: number) => tween(t, T.next + 8, 34, anticipate);
  const nextP = nextAt(f);
  const nextWin = win(f, T.next + 6, T.end, 12);

  // cursor, click, subscribed state, bell
  const cur = tween(f, T.cursor, 42, glide);
  const cursorX = 1900 + (BUTTON.x + 40 - 1900) * cur;
  const cursorY = 940 + (BUTTON.y + 30 - 940) * cur;
  const squish = f >= T.click && f < T.click + 10 ? 1 - 0.12 * Math.sin((Math.PI * (f - T.click)) / 10) : 1;
  const subscribed = f >= T.click + 4;
  const bellT = f - T.click - 6;
  const bell = bellT > 0 ? 24 * Math.exp(-bellT / 14) * Math.sin(bellT / 2.2) : 0;

  // end screen
  const endP = tween(f, T.end, 26, snap);
  const endP2 = tween(f, T.end + 10, 26, snap);
  const dash = -f * 0.9;

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
                  opacity: ramp(f, d, d + 10, glide) * (1 - cardsExit) * quiet,
                  transform: `perspective(1400px) rotateY(${(1 - p) * 90 + cardsExit * 35}deg) translateY(${cardsExit * 180}px)`,
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

        {/* 8:20: next-video card + subscribe button */}
        <div style={{position: 'absolute', inset: 0, opacity: nextWin}}>
          <MotionBlur dx={1100 * (nextAt(f) - nextAt(f - 1)) * -1} shutter={0.5} cap={50} style={{position: 'absolute', inset: 0}}>
          <div
            style={{
              position: 'absolute',
              left: 120,
              top: 230,
              width: 960,
              height: 540,
              borderRadius: 36,
              background: `linear-gradient(135deg, ${C.navy1}, #0d5f45 140%)`,
              border: `2px solid ${C.mint}88`,
              boxShadow: `0 0 60px ${C.emerald}44`,
              transform: `translateX(${(1 - nextP) * 1100}px)`,
              overflow: 'hidden',
            }}
          >
            <div style={{position: 'absolute', left: 44, top: 36, padding: '8px 26px', borderRadius: 999, background: 'rgba(232,238,247,0.16)', border: '1.5px solid rgba(232,238,247,0.5)', color: C.text, fontFamily: F.display, fontWeight: 700, fontSize: 30}}>NEXT VIDEO</div>
            <div style={{position: 'absolute', left: 44, top: 120, fontFamily: F.display, fontWeight: 700, fontSize: 250, lineHeight: 1, color: C.mint, textShadow: `0 0 50px ${C.emerald}`}}>$50K</div>
            <div style={{position: 'absolute', left: 52, top: 390, fontFamily: F.display, fontWeight: 700, fontSize: 96, color: C.text}}>10 CITIES</div>
          </div>
          </MotionBlur>

          {/* bell */}
          <div style={{position: 'absolute', left: BUTTON.x - 55, top: 370, width: 110, height: 110, transform: `rotate(${bell}deg)`, transformOrigin: '50% 10%'}}>
            <DrawIcon kind="bell" start={T.cursor} size={110} color={subscribed ? C.mint : C.text} strokeWidth={3.5} />
          </div>
          {/* subscribe button */}
          <div
            style={{
              position: 'absolute',
              left: BUTTON.x - 230,
              top: BUTTON.y - 60,
              width: 460,
              height: 120,
              borderRadius: 60,
              background: subscribed ? C.emerald : C.text,
              color: subscribed ? '#042a1b' : '#050E1D',
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${squish}) translateX(${(1 - nextP) * 900}px)`,
              boxShadow: subscribed ? `0 0 40px ${C.emerald}aa` : '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            {subscribed ? 'Subscribed' : 'Subscribe'}
          </div>
          {/* cursor */}
          {f >= T.cursor && (
            // brand cursor: a clean white arrow with an emerald glow; the tip (hotspot) is the transform origin so the click press stays on the button
            <svg
              width={84}
              height={84}
              viewBox="0 0 28 28"
              style={{
                position: 'absolute',
                left: cursorX,
                top: cursorY,
                overflow: 'visible',
                filter: `drop-shadow(0 6px 10px ${C.emerald}cc) drop-shadow(0 0 3px ${C.emerald}88)`,
                transformOrigin: '4px 3px',
                transform: `scale(${f >= T.click && f < T.click + 8 ? 0.85 : 1})`,
              }}
            >
              <path d="M4 3 L4 22.5 L9.2 17.8 L12.6 25.5 L16 24 L12.7 16.6 L19.6 16.6 Z" fill="#FFFFFF" stroke="#0B3B2B" strokeWidth={0.9} strokeLinejoin="round" />
            </svg>
          )}
        </div>

        {/* 8:40: end screen, two empty frames for YouTube's own elements */}
        {f >= T.end && (
          <>
            <div style={{position: 'absolute', left: 140, width: 840, top: 170, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 48, color: C.text, opacity: endP}}>Next video</div>
            <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
              {/* left: 16:9 video slot, 840 x 472 */}
              <rect
                x={140}
                y={250}
                width={840}
                height={472}
                rx={28}
                fill="rgba(232,238,247,0.04)"
                stroke={C.mint}
                strokeWidth={4}
                strokeDasharray="22 16"
                strokeDashoffset={dash}
                opacity={endP}
                style={{filter: `drop-shadow(0 0 ${10 + 6 * Math.sin(f / 10)}px ${C.emerald})`}}
              />
              {/* right: circular subscribe slot, 340 across */}
              <circle
                cx={1500}
                cy={420}
                r={170 * (0.85 + 0.15 * endP2)}
                fill="rgba(232,238,247,0.04)"
                stroke={C.mint}
                strokeWidth={4}
                strokeDasharray="22 16"
                strokeDashoffset={-dash}
                opacity={endP2}
                style={{filter: `drop-shadow(0 0 ${10 + 6 * Math.sin(f / 10 + 1)}px ${C.emerald})`}}
              />
            </svg>
            <div style={{position: 'absolute', left: 1330, width: 340, top: 620, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 40, color: C.text, opacity: endP2}}>Subscribe</div>
          </>
        )}
      </Background>
      {/* tag is hidden on the end screen */}
      <SourceTag opacity={1 - clamp((f - (T.end - 6)) / 6)} />
    </AbsoluteFill>
  );
};
