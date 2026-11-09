import {Config} from '@remotion/cli/config';

// PNG frames: no JPEG artifacts or banding in the dark navy gradients.
Config.setVideoImageFormat('png');
// 4K output (3840x2160) straight from the 1920x1080 compositions: Remotion renders every frame at 2x device scale, so
// text, SVG, filters and the WebGL scenes are drawn at full 4K resolution and the layout does not change.
// A plain `npm run render` is 4K; a --scale flag on the command line still overrides this (render:half uses 0.5).
Config.setScale(2);
Config.setOverwriteOutput(true);
// WebGL (three.js) needs a real GL backend in headless Chrome. ANGLE works on Linux, macOS and Windows.
Config.setChromiumOpenGlRenderer('angle');
// 3D frames with shadows are slower than the old flat SVG, so give each frame more time before Remotion gives up.
Config.setDelayRenderTimeoutInMilliseconds(120000);
