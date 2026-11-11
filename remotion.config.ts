import {Config} from '@remotion/cli/config';

// PNG frames: no JPEG artifacts or banding in the dark navy gradients.
Config.setVideoImageFormat('png');
// 4K output (3840x2160) straight from the 1920x1080 compositions: Remotion renders every frame at 2x device scale, so
// text, SVG, filters and the WebGL scenes are drawn at full 4K resolution and the layout does not change.
// A plain `npm run render` is 4K; a --scale flag on the command line still overrides this (render:half uses 0.5).
Config.setScale(2);
Config.setOverwriteOutput(true);
// WebGL (three.js) needs a real GL backend in headless Chrome. ANGLE works on Linux, macOS and Windows.
Config.setChromiumOpenGlRenderer('swangle');
// 3D frames with shadows are slower than the old flat SVG, so give each frame more time before Remotion gives up.
// 300 s: the countdown's 3D map reveals (Shot 4) compile 50-state WebGL geometry + shadows on the first frame,
// and on GitHub's 2-core runners with --concurrency=2 two Chromium instances do this at once. 120 s was not enough.
Config.setDelayRenderTimeoutInMilliseconds(300000);
