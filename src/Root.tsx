// Load self-hosted Fontshare fonts (Clash Display, Satoshi) + Google Fonts
// (Plus Jakarta Sans, JetBrains Mono) before any composition renders.
// @font-face declarations live in src/fontshare/fonts.css; this import triggers
// them and the @remotion/google-fonts loaders in a single side-effect call.
import './fontshare/load-fonts';

import React from 'react';
import {Composition} from 'remotion';
import {Grade} from './components/Grade';
import {Video2} from './video2/Video2';
import {StyleFrame} from './video2/StyleFrame';
import {FPS, H, W} from './theme';
import {toReal} from './clock';
import {VIDEO2_FRAMES} from './timeline2';

/** Every composition goes through the same filmic grade (bloom, S-curve, split tone, lens dust). */
const GradedVideo2: React.FC = () => (
  <Grade>
    <Video2 />
  </Grade>
);

export const Root: React.FC = () => (
  <>
    <Composition id="Video2" component={GradedVideo2} durationInFrames={toReal(VIDEO2_FRAMES)} width={W} height={H} fps={FPS} />
    <Composition id="StyleFrame" component={StyleFrame} durationInFrames={240} width={W} height={H} fps={FPS} />
  </>
);
