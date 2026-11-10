import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background} from '../components/Background';
import {Glass} from '../components/Glass';
import {MaskLine, MaskWords} from '../components/MaskText';
import {MotionBlur} from '../components/MotionBlur';
import {Count} from '../components/Count';
import {Flash, SourceTag, win} from '../components/common';
import {exitIn, glide, ramp, snap, tween} from '../motion';
import {SALARY} from '../data';
import {C, F, H, W, sec, tabular} from '../theme';
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
  if (f < start - 6 || f > end + 12) return null;
  const inAt = (t: number) => tween(t, start, 28, snap);
  const p = inAt(f);
  const out = ramp(f, end - 12, end, exitIn);
  // 3D rotateY: 80deg at start, 0deg when settled
  const rotateY = 80 * (1 - p);
  return (
    <MotionBlur dx={-180 * (inAt(f) - inAt(f - 1))} shutter={0.6} cap={40} style={{position: 'absolute', left: 240, right: 240, top: 200, height: 620, perspective: 1400}}>
      <div
        style={{
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rotateY}deg) translateX(${(1 - p) * -120}px)`,
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
            padding: '0 80px',
            gap: 28,
          }}
        >
          <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 36, color, letterSpacing: '0.18em', opacity: ramp(f, start + 6, start + 16)}}>
            {label}
          </div>
          <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 84, color: C.text, lineHeight: 1.05, opacity: ramp(f, start + 10, start + 22)}}>
            <MaskWords text={headline} start={start + 10} step={3} dur={20} />
          </div>
          <div style={{fontFamily: F.body, fontWeight: 500, fontSize: 38, color: C.muted, lineHeight: 1.4, maxWidth: 1100, opacity: ramp(f, start + 20, start + 32)}}>
            {body}
          </div>
        </Glass>
      </div>
    </MotionBlur>
  );
};

export const Shot55: React.FC = () => {
  const f = useDesignFrame();
  return (
    <AbsoluteFill>
      <Background glowX={W * 0.5} glowY={H * 0.45} glowColor={f < T.formula ? C.emerald : C.amber}>
        {/* 0-5s: hook slam — "So who actually wins?" */}
        {f < T.profile1 + sec(0.5) && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 380,
              textAlign: 'center',
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 110,
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
        {f >= T.formula - 6 && f < T.tease + sec(0.5) && (
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
            <div
              style={{
                fontFamily: F.display,
                fontWeight: 700,
                fontSize: 80,
                color: C.text,
                display: 'flex',
                alignItems: 'baseline',
                gap: 22,
                ...tabular,
              }}
            >
              <span style={{color: C.mint, opacity: ramp(f, T.formula + 6, T.formula + 14)}}>
                <Count to={SALARY} start={T.formula + 6} duration={40} size={80} color={C.mint} prefix="$" />
              </span>
              <span style={{color: C.muted, opacity: ramp(f, T.formula + 12, T.formula + 18)}}>÷</span>
              <span style={{opacity: ramp(f, T.formula + 16, T.formula + 22)}}>(RPP ÷ 100)</span>
              <span style={{color: C.muted, opacity: ramp(f, T.formula + 22, T.formula + 28)}}>=</span>
              <span style={{color: C.amber, opacity: ramp(f, T.formula + 28, T.formula + 36)}}>
                your real buying power
              </span>
            </div>
            <div style={{fontFamily: F.body, fontWeight: 500, fontSize: 38, color: C.muted, textAlign: 'center', maxWidth: 1200, opacity: ramp(f, T.formula + 36, T.formula + 48)}}>
              Plug in your salary and your state's BEA score. That's what your money actually buys.
            </div>
          </div>
        )}

        {/* 75-80s: tease next video — "Cities next. Where does $50K actually go?" */}
        {f >= T.tease - 6 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 420,
              textAlign: 'center',
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 88,
              color: C.text,
              letterSpacing: '-0.02em',
              opacity: win(f, T.tease, SHOT55_FRAMES, 12),
            }}
          >
            <MaskWords text="Cities next." start={T.tease} step={3} dur={16} />
            <div style={{marginTop: 18, fontFamily: F.body, fontWeight: 500, fontSize: 42, color: C.muted}}>
              <MaskLine start={T.tease + 16} dur={18}>Where does $50K actually go?</MaskLine>
            </div>
          </div>
        )}
      </Background>
      <SourceTag />
      <Flash at={T.hook + 4} duration={8} peak={0.45} />
      <Flash at={T.formula + 6} duration={6} peak={0.35} />
    </AbsoluteFill>
  );
};
