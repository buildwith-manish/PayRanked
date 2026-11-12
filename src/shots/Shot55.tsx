import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background} from '../components/Background';
import {Glass} from '../components/Glass';
import {DrawIcon} from '../components/Icons';
import {MaskLine, MaskWords} from '../components/MaskText';
import {MotionBlur} from '../components/MotionBlur';
import {Count} from '../components/Count';
import {Flash, SourceTag, win} from '../components/common';
import {exitIn, glide, ramp, snap, tween} from '../motion';
import {SALARY} from '../data';
import {C, F, sec, tabular} from '../theme';
import {useLayout} from '../layout';
import {useDesignFrame} from '../clock';
import {SHOT_SECONDS} from '../timeline';

/**
 * Shot 5.5 — Practical Takeaways (110 s).
 *
 * Opens on the cliffhanger that used to live in Shot 5 card3 ("So who actually wins?") and answers it for three
 * viewer profiles (remote worker, retiree, early career), then shows the formula so the viewer can plug in their
 * own salary, then teases the next video (cities). The point: turn the abstract ranking into something the viewer
 * can use, then leave them wanting the city-level breakdown.
 *
 * Visual style matches Shot 5's InfoCards (Glass panels with spring-in) and the cold-open formula (count-up,
 * MotionBlur). The three profiles use a 3D rotateY flip like Shot 6's recap cards.
 */
export const SHOT55_FRAMES = sec(SHOT_SECONDS.shot55);

/** Shot-local times (0 = the start of Shot 5.5). EXTEND-4: section is 110 s, not 80 s — the original spec
 *  had each profile at 20 s, but the body text needs ~25 s to read at a comfortable pace. The extra 30 s brings
 *  the video from 7:58 to 8:28, hitting the 8:30 mid-roll target. */
export const T = {
  hook:      sec(0),     // "So who actually wins?" big slam
  profile1:  sec(5),     // Remote worker card flips in (25 s read time)
  profile2:  sec(30),    // Retiree card flips in (25 s read time)
  profile3:  sec(55),    // Early career card flips in (25 s read time)
  formula:   sec(80),    // The formula reveal with count-up (20 s, was 10 s — more time to read)
  tease:     sec(100),   // "Cities next. Where does $50K actually go?" (10 s, was 5 s)
  // subscribe button, all inside the tease window (+300 frames): appears, cursor travels to it, hovers, clicks
  subIn:     sec(100) + 84,
  subMove:   sec(100) + 112,
  subHover:  sec(100) + 146,
  subClick:  sec(100) + 176,
};

const PROFILE_CARDS: {
  start: number;
  label: string;
  headline: string;
  body: string;
  color: string;
}[] = [
  {
    start: T.profile1,
    label: 'REMOTE WORKER',
    headline: 'Texas. Florida. Washington.',
    body: 'No wage tax helps — but check total cost, not just the headline. Property tax and insurance can eat the savings.',
    color: C.amber,
  },
  {
    start: T.profile2,
    label: 'RETIREE',
    headline: 'Cheapest states win.',
    body: 'Arkansas, Mississippi, Oklahoma stretch a fixed income furthest. But healthcare access matters more than price.',
    color: C.mint,
  },
  {
    start: T.profile3,
    label: 'EARLY CAREER',
    headline: 'Don\'t chase cheap.',
    body: 'Expensive states often pay enough to offset the cost. Chase income growth first, cost of living second.',
    color: C.red,
  },
];

/** One profile card with a 3D rotateY flip on entrance. */
const ProfileCard: React.FC<{
  start: number;
  end: number;
  label: string;
  headline: string;
  body: string;
  color: string;
}> = ({start, end, label, headline, body, color}) => {
  const f = useDesignFrame();
  const {vertical: V} = useLayout();
  if (f < start - 6 || f > end + 12) return null;
  const inAt = (t: number) => tween(t, start, 28, snap);
  const p = inAt(f);
  const out = ramp(f, end - 12, end, exitIn);
  // 3D rotateY: 80deg at start, 0deg when settled
  const rotateY = 80 * (1 - p);
  // Vertical Shorts only (the 16:9 video is untouched): the card keeps moving while the voice reads it. It drifts slowly toward
  // the viewer, the headline glow breathes, and the body appears one sentence at a time instead of all at once.
  const drift = V ? 1 + 0.03 * ramp(f, start, end - 12) : 1;
  const breathe = V ? 0.5 + 0.5 * Math.sin((f - start) / 12) : 0;
  const sentences = V ? body.split(/(?<=\.)\s+/) : [body];
  return (
    <MotionBlur dx={-180 * (inAt(f) - inAt(f - 1))} shutter={0.6} cap={40} style={{position: 'absolute', left: V ? 48 : 240, right: V ? 48 : 240, top: V ? 400 : 200, height: V ? 900 : 620, perspective: 1400}}>
      <div
        style={{
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rotateY}deg) translateX(${(1 - p) * -120}px) scale(${drift})`,
          opacity: ramp(f, start, start + 8) * (1 - out),
        }}
      >
        <Glass
          radius={36}
          tint={color}
          strength={1.2}
          glow={28}
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: V ? '0 56px' : '0 80px',
            gap: V ? 34 : 28,
          }}
        >
          <div style={{fontFamily: F.body, fontWeight: 600, fontSize: V ? 46 : 36, color, letterSpacing: '0.18em', opacity: ramp(f, start + 6, start + 16)}}>
            {label}
          </div>
          <div style={{fontFamily: F.display, fontWeight: 700, fontSize: V ? 104 : 84, color: C.text, lineHeight: 1.05, opacity: ramp(f, start + 10, start + 22), textShadow: V ? `0 0 ${18 + 22 * breathe}px ${color}66` : undefined}}>
            <MaskWords text={headline} start={start + 10} step={3} dur={20} />
          </div>
          <div style={{fontFamily: F.body, fontWeight: 500, fontSize: V ? 54 : 38, color: C.muted, lineHeight: V ? 1.3 : 1.4, maxWidth: 1100, opacity: V ? 1 : ramp(f, start + 20, start + 32)}}>
            {sentences.map((sentence, i) => (
              <span key={i} style={{opacity: V ? ramp(f, start + 20 + i * sec(5.5), start + 32 + i * sec(5.5)) : 1}}>
                {sentence}
                {i < sentences.length - 1 ? ' ' : ''}
              </span>
            ))}
          </div>
        </Glass>
      </div>
    </MotionBlur>
  );
};

export const Shot55: React.FC = () => {
  const f = useDesignFrame();
  // Vertical Shorts (6 and 7) play the hook, the profile cards and the formula. The tease of the next video is not part of
  // either Short, so it keeps its 16:9 layout.
  const {w: W, h: H, vertical: V} = useLayout();
  return (
    <AbsoluteFill>
      <Background glowX={W * 0.5} glowY={H * 0.45} glowColor={f < T.formula ? C.emerald : C.amber}>
        {/* 0-5s: hook slam — "So who actually wins?" */}
        {f < T.profile1 + sec(0.5) && (
          <div
            style={{
              position: 'absolute',
              left: V ? 56 : 0,
              right: V ? 56 : 0,
              top: V ? 640 : 380,
              textAlign: 'center',
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: V ? 170 : 110,
              lineHeight: V ? 1.05 : undefined,
              color: C.text,
              letterSpacing: '-0.02em',
              opacity: win(f, T.hook, T.profile1, 12),
            }}
          >
            <MaskWords text="So who actually wins?" start={T.hook + 4} step={4} dur={20} leaveAt={T.profile1 - 6} />
          </div>
        )}

        {/* 5-65s: three profile cards, one at a time, 20s each */}
        {PROFILE_CARDS.map((p, i) => {
          const next = i < PROFILE_CARDS.length - 1 ? PROFILE_CARDS[i + 1].start : T.formula;
          return (
            <ProfileCard
              key={p.label}
              start={p.start}
              end={next}
              label={p.label}
              headline={p.headline}
              body={p.body}
              color={p.color}
            />
          );
        })}

        {/* 65-75s: the formula reveal — "YOUR TURN: $salary ÷ (RPP ÷ 100) = your real buying power" */}
        {f >= T.formula - 6 && f < T.tease + sec(0.5) && V && (
          // vertical: one term per line, big and centred, so no line is wider than the 1080 px frame
          <div
            style={{
              position: 'absolute',
              left: 56,
              right: 56,
              top: 400,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 22,
              opacity: win(f, T.formula, T.tease, 12),
            }}
          >
            <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 44, color: C.amber, letterSpacing: '0.18em'}}>
              <MaskLine start={T.formula} dur={18}>YOUR TURN</MaskLine>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: F.display, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', ...tabular}}>
              <span style={{color: C.mint, opacity: ramp(f, T.formula + 6, T.formula + 14)}}>
                <Count to={SALARY} start={T.formula + 6} duration={40} size={148} color={C.mint} prefix="$" />
              </span>
              <span style={{fontSize: 104, color: C.muted, opacity: ramp(f, T.formula + 12, T.formula + 18)}}>÷</span>
              <span style={{fontSize: 112, opacity: ramp(f, T.formula + 16, T.formula + 22)}}>(RPP ÷ 100)</span>
              <span style={{fontSize: 104, color: C.muted, opacity: ramp(f, T.formula + 22, T.formula + 28)}}>=</span>
              <span style={{fontSize: 84, color: C.amber, opacity: ramp(f, T.formula + 28, T.formula + 36)}}>your real buying power</span>
            </div>
            <div style={{marginTop: 26, fontFamily: F.body, fontWeight: 500, fontSize: 46, lineHeight: 1.3, color: C.muted, textAlign: 'center', opacity: ramp(f, T.formula + 36, T.formula + 48)}}>
              Plug in your salary and your state's BEA score. That's what your money actually buys.
            </div>
          </div>
        )}

        {f >= T.formula - 6 && f < T.tease + sec(0.5) && !V && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 280,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 36,
              opacity: win(f, T.formula, T.tease, 12),
            }}
          >
            <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 36, color: C.amber, letterSpacing: '0.18em'}}>
              <MaskLine start={T.formula} dur={18}>YOUR TURN</MaskLine>
            </div>
            {/* two rows, never wrapping: on one line the equation is about 2100 px wide, so flex squeezed it, clipped the "$" and broke "(RPP ÷ 100)" */}
            <div
              style={{
                fontFamily: F.display,
                fontWeight: 700,
                fontSize: 80,
                color: C.text,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
                whiteSpace: 'nowrap',
                ...tabular,
              }}
            >
              <div style={{display: 'flex', alignItems: 'baseline', gap: 26, flexShrink: 0}}>
                <span style={{color: C.mint, opacity: ramp(f, T.formula + 6, T.formula + 14), flexShrink: 0}}>
                  <Count to={SALARY} start={T.formula + 6} duration={40} size={80} color={C.mint} prefix="$" />
                </span>
                <span style={{color: C.muted, opacity: ramp(f, T.formula + 12, T.formula + 18), flexShrink: 0}}>÷</span>
                <span style={{opacity: ramp(f, T.formula + 16, T.formula + 22), flexShrink: 0}}>(RPP ÷ 100)</span>
              </div>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 26, flexShrink: 0}}>
                <span style={{color: C.muted, opacity: ramp(f, T.formula + 22, T.formula + 28), flexShrink: 0}}>=</span>
                <span style={{color: C.amber, opacity: ramp(f, T.formula + 28, T.formula + 36), flexShrink: 0}}>your real buying power</span>
              </div>
            </div>
            <div style={{fontFamily: F.body, fontWeight: 500, fontSize: 38, color: C.muted, textAlign: 'center', maxWidth: 1200, opacity: ramp(f, T.formula + 36, T.formula + 48)}}>
              Plug in your salary and your state's BEA score. That's what your money actually buys.
            </div>
          </div>
        )}

        {/* Tease of the NEXT video (same timing as before: appears at T.tease, leaves with the shot).
            Laid out like a video end card so it reads as "the next video", not as more of this one:
            a NEXT VIDEO badge, the line, then a thumbnail-style card with a play button. */}
        {f >= T.tease - 6 && (
          <div style={{position: 'absolute', inset: 0, opacity: win(f, T.tease, SHOT55_FRAMES, 12)}}>
            {/* badge */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 64,
                display: 'flex',
                justifyContent: 'center',
                opacity: ramp(f, T.tease, T.tease + 10, glide),
                transform: `translateY(${(1 - tween(f, T.tease, 20, snap)) * 24}px)`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 30px',
                  borderRadius: 999,
                  border: `2px solid ${C.mint}`,
                  background: `${C.mint}1F`,
                  fontFamily: F.display,
                  fontWeight: 700,
                  fontSize: 30,
                  letterSpacing: '0.2em',
                  color: C.mint,
                }}
              >
                <span style={{width: 12, height: 12, borderRadius: 6, background: C.mint, opacity: 0.6 + 0.4 * Math.sin(f / 6)}} />
                NEXT VIDEO
              </div>
            </div>

            {/* headline + line */}
            <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: F.display, fontWeight: 700, fontSize: 88, color: C.text, letterSpacing: '-0.02em'}}>
              <MaskWords text="Cities next." start={T.tease + 6} step={3} dur={16} />
              <div style={{marginTop: 14, fontFamily: F.body, fontWeight: 500, fontSize: 42, color: C.muted, letterSpacing: 0}}>
                <MaskLine start={T.tease + 20} dur={18}>Where does $50K actually go?</MaskLine>
              </div>
            </div>

            {/* thumbnail-style card */}
            {(() => {
              const inAt = (t: number) => tween(t, T.tease + 26, 28, snap);
              const p = inAt(f);
              return (
                <MotionBlur dy={60 * (inAt(f) - inAt(f - 1)) * -1} style={{position: 'absolute', left: W / 2 - 400, top: 370, width: 800, height: 450}}>
                  <Glass
                    radius={28}
                    tint={C.mint}
                    strength={1.1}
                    glow={18}
                    style={{
                      width: 800,
                      height: 450,
                      overflow: 'hidden',
                      opacity: ramp(f, T.tease + 26, T.tease + 36, glide),
                      transform: `translateY(${(1 - p) * 60}px) scale(${0.96 + 0.04 * p})`,
                    }}
                  >
                    {/* skyline icon + big figure, like a thumbnail */}
                    <div style={{position: 'absolute', left: 48, top: 44, opacity: ramp(f, T.tease + 40, T.tease + 52, glide)}}>
                      <DrawIcon kind="buildings" start={T.tease + 40} size={150} color={C.mint} strokeWidth={3} />
                    </div>
                    <div style={{position: 'absolute', right: 56, top: 40, textAlign: 'right', fontFamily: F.display, fontWeight: 700, fontSize: 150, lineHeight: 1, color: C.amber, opacity: ramp(f, T.tease + 44, T.tease + 58, glide), ...tabular}}>
                      $50K
                    </div>
                    <div style={{position: 'absolute', left: 48, right: 48, top: 232, fontFamily: F.display, fontWeight: 700, fontSize: 54, lineHeight: 1.12, color: C.text, opacity: ramp(f, T.tease + 50, T.tease + 64, glide)}}>
                      Same salary. Now by city.
                    </div>
                    <div style={{position: 'absolute', left: 48, right: 48, top: 318, fontFamily: F.body, fontWeight: 500, fontSize: 32, color: C.muted, opacity: ramp(f, T.tease + 58, T.tease + 72, glide)}}>
                      PayRanked · City edition
                    </div>
                    {/* play button */}
                    <div
                      style={{
                        position: 'absolute',
                        right: 48,
                        bottom: 48,
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        background: C.mint,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: ramp(f, T.tease + 62, T.tease + 74, glide),
                        transform: `scale(${1 + 0.05 * Math.sin(f / 8)})`,
                        boxShadow: `0 0 36px ${C.mint}88`,
                      }}
                    >
                      <div style={{width: 0, height: 0, marginLeft: 8, borderTop: '22px solid transparent', borderBottom: '22px solid transparent', borderLeft: '36px solid #06222A'}} />
                    </div>
                    {/* fake progress bar, like a video player */}
                    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 8, background: 'rgba(232,238,247,0.15)'}}>
                      <div style={{width: `${ramp(f, T.tease + 40, T.tease + 90) * 22}%`, height: '100%', background: C.mint}} />
                    </div>
                  </Glass>
                </MotionBlur>
              );
            })()}

            {/* Subscribe button: pops in under the card, a mouse cursor glides to it, hovers (button lifts and glows),
                clicks (press + ripple), and the button flips to "Subscribed" with a ringing bell. */}
            {(() => {
              const BW = 420;
              const BH = 96;
              const bx = W / 2 - BW / 2;
              const by = 862;
              const inP = tween(f, T.subIn, 22, snap);
              const travel = tween(f, T.subMove, 34, glide);
              const hover = ramp(f, T.subHover, T.subHover + 8, glide);
              const press = ramp(f, T.subClick, T.subClick + 3) * (1 - ramp(f, T.subClick + 6, T.subClick + 14));
              const done = ramp(f, T.subClick + 4, T.subClick + 12, glide); // 0 = Subscribe, 1 = Subscribed
              const ripple = ramp(f, T.subClick, T.subClick + 22, glide);
              const sinceDone = Math.max(0, f - (T.subClick + 8));
              const bell = done > 0 ? Math.sin(sinceDone * 0.9) * 22 * Math.exp(-sinceDone / 16) : 0; // rings, then settles
              const scale = (0.9 + 0.1 * inP) * (1 + 0.05 * hover * (1 - done)) * (1 - 0.06 * press);
              // cursor path: in from the lower right, tip lands slightly right of the button centre
              const cx = W / 2 + 520 + (W / 2 + 60 - (W / 2 + 520)) * travel;
              const cy = 1090 + (by + BH / 2 + 8 - 1090) * travel;
              const cursorOpacity = ramp(f, T.subMove - 4, T.subMove + 6) * (1 - ramp(f, T.subClick + 44, T.subClick + 60));
              return (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      left: bx,
                      top: by,
                      width: BW,
                      height: BH,
                      opacity: ramp(f, T.subIn, T.subIn + 8, glide),
                      transform: `translateY(${(1 - inP) * 30}px) scale(${scale})`,
                      borderRadius: BH / 2,
                      overflow: 'hidden',
                      background: done > 0.5 ? 'rgba(232,238,247,0.16)' : `rgb(${255},${Math.round(30 + 40 * hover)},${Math.round(50 + 30 * hover)})`,
                      boxShadow: done > 0.5 ? 'none' : `0 0 ${10 + 36 * hover}px rgba(255,40,60,${0.35 + 0.4 * hover})`,
                      border: done > 0.5 ? '2px solid rgba(232,238,247,0.35)' : '2px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 16,
                      fontFamily: F.display,
                      fontWeight: 700,
                      fontSize: 42,
                      color: '#fff',
                    }}
                  >
                    <span style={{opacity: 1 - done, position: 'absolute'}}>Subscribe</span>
                    <span style={{opacity: done, display: 'flex', alignItems: 'center', gap: 16}}>
                      <span style={{display: 'inline-block', transform: `rotate(${bell}deg)`, transformOrigin: '50% 10%'}}>
                        <DrawIcon kind="bell" start={T.subClick + 8} size={46} color="#fff" strokeWidth={3} />
                      </span>
                      Subscribed
                    </span>
                    {/* click ripple from the cursor tip */}
                    <div
                      style={{
                        position: 'absolute',
                        left: BW / 2 + 60 - 100 * ripple,
                        top: BH / 2 + 8 - 100 * ripple,
                        width: 200 * ripple,
                        height: 200 * ripple,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.35)',
                        opacity: ripple > 0 ? 1 - ripple : 0,
                      }}
                    />
                  </div>
                  {/* mouse cursor (arrow), shrinks a little on the click */}
                  <svg
                    width={56}
                    height={72}
                    viewBox="0 0 28 36"
                    style={{
                      position: 'absolute',
                      left: cx,
                      top: cy,
                      opacity: cursorOpacity,
                      transform: `scale(${1 - 0.14 * press})`,
                      transformOrigin: '0 0',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
                    }}
                  >
                    <path d="M2 2 L2 28 L9 21.5 L14 33 L19 31 L14 19.5 L24 19.5 Z" fill="#fff" stroke="#111" strokeWidth={2} strokeLinejoin="round" />
                  </svg>
                </>
              );
            })()}
          </div>
        )}
      </Background>
      <SourceTag />
      <Flash at={T.hook + 4} duration={8} peak={0.45} />
      <Flash at={T.formula + 6} duration={6} peak={0.35} />
    </AbsoluteFill>
  );
};
