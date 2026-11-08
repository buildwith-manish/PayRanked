import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// WebGL (three.js) needs a real GL backend in headless Chrome. ANGLE works on Linux, macOS and Windows.
Config.setChromiumOpenGlRenderer('angle');
// 3D frames with shadows are slower than the old flat SVG, so give each frame more time before Remotion gives up.
Config.setDelayRenderTimeoutInMilliseconds(120000);
