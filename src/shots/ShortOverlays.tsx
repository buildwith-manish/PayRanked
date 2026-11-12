import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, sec} from '../theme';
import {useDesignFrame} from '../clock';
import {MaskWords} from '../components/MaskText';
import {ramp, glide} from '../motion';
import {SHORTS_SAFE} from '../layout';
import {Short1EndCard, SHORT1_CTA_SECONDS} from './Short1';

/**
 * Shorts 2-7: a one-line hook in the first second, and the same end card as Short 1.
 *
 * Every hook is a claim the data in src/data/states.json backs up (checked, see CHANGES-SHORTS-HOOK-CTA.md). It does not name the
 * state or give the answer away: that stays for the slam. Short 6 has no hook on purpose: it already opens on "So who actually wins?".
 */
export const SHORT_HOOKS: Partial<Record<number, string>> = {
  2: 'Two states tie. Both beat California by $20K.', // Kansas $111,027 / Nebraska $110,984 vs California $90,318 (about $20.7K)
  3: "Texas isn't even top 25.", // Texas is #26 of 50
  4: 'Highest sales tax in the US, and still #5.', // Louisiana, 10.11%, rank 5
  5: "Cheap doesn't mean you'd earn $100K there.", // moved up from the end of the Short
  7: 'Try this with your own salary.', // the "your turn" formula comes later in the Short
};

/** Same end card as Short 1 (same line, same style), so every Short ends the same way. */
export const SHORT_END_SECONDS = SHORT1_CTA_SECONDS;
export const ShortEndCard = Short1EndCard;

const HOOK_IN = sec(0.1);
const HOOK_OUT = sec(2.6);

export const ShortHook: React.FC<{text: string}> = ({text}) => {
  const f = useDesignFrame();
  // soft dark band behind the line so it stays readable over the 3D map and the cards
  const band = ramp(f, HOOK_IN, HOOK_IN + 10, glide) * (1 - ramp(f, HOOK_OUT, HOOK_OUT + 12, glide));
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: SHORTS_SAFE.top,
          height: 220,
          background: 'linear-gradient(180deg, rgba(5,14,29,0.78) 0%, rgba(5,14,29,0.55) 65%, rgba(5,14,29,0) 100%)',
          opacity: band,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: SHORTS_SAFE.top + 30,
          textAlign: 'center',
          fontFamily: F.display,
          fontWeight: 700,
          fontSize: 68,
          lineHeight: 1.18,
          color: C.text,
          textShadow: '0 4px 24px rgba(2,8,18,0.7)',
        }}
      >
        <MaskWords text={text} start={HOOK_IN} step={3} dur={16} leaveAt={HOOK_OUT} />
      </div>
    </AbsoluteFill>
  );
};
