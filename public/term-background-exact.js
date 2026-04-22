// Exact migration of original term background animation (from 24 solar terms/js/script.js)
// Adapted only for React routing:
// - term key comes from window.__TERM_ID__ first
// - exposes window.__termBgApplyTheme(key)
// - exposes window.__termBgDispose()

let blades = [];
let drops = [];
let splashes = [];
let flakes = [];
let frost = [];
let snowSettled = [];

const INK = { r: 20, g: 18, b: 16 };

const TERM_YEAR_SEQUENCE = [
  'lichun', 'yushui', 'jingzhe', 'chunfen', 'qingming', 'guyu',
  'lixia', 'xiaoman', 'mangzhong', 'xiazhi', 'xiaoshu', 'dashu',
  'liqiu', 'chushu', 'bailu', 'qiufen', 'hanlu', 'shuangjiang',
  'lidong', 'xiaoxue', 'daxue', 'dongzhi', 'xiaohan', 'dahan'
];

const TERM_YEAR_INDEX = TERM_YEAR_SEQUENCE.reduce((acc, id, i) => {
  acc[id] = i;
  return acc;
}, {});

const TERM_LABELS = {
  lichun: '立春 Start of Spring',
  yushui: '雨水 Rain Water',
  jingzhe: '惊蛰 Awakening of Insects',
  chunfen: '春分 Spring Equinox',
  qingming: '清明 Pure Brightness',
  guyu: '谷雨 Grain Rain',
  lixia: '立夏 Start of Summer',
  xiaoman: '小满 Grain Full',
  mangzhong: '芒种 Grain in Ear',
  xiazhi: '夏至 Summer Solstice',
  xiaoshu: '小暑 Minor Heat',
  dashu: '大暑 Major Heat',
  liqiu: '立秋 Start of Autumn',
  chushu: '处暑 End of Heat',
  bailu: '白露 White Dew',
  qiufen: '秋分 Autumn Equinox',
  hanlu: '寒露 Cold Dew',
  shuangjiang: '霜降 Frost Descent',
  lidong: '立冬 Start of Winter',
  xiaoxue: '小雪 Minor Snow',
  daxue: '大雪 Major Snow',
  dongzhi: '冬至 Winter Solstice',
  xiaohan: '小寒 Minor Cold',
  dahan: '大寒 Major Cold'
};

function hexToRgb(hex) {
  const h = String(hex).replace('#', '').trim();
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(c) {
  const to2 = (v) => v.toString(16).padStart(2, '0');
  return `#${to2(clamp(Math.round(c.r), 0, 255))}${to2(clamp(Math.round(c.g), 0, 255))}${to2(clamp(Math.round(c.b), 0, 255))}`;
}

function mixRgb(a, b, t) {
  const tt = clamp(t, 0, 1);
  return {
    r: a.r + (b.r - a.r) * tt,
    g: a.g + (b.g - a.g) * tt,
    b: a.b + (b.b - a.b) * tt
  };
}

function mixHex(a, b, t) {
  return rgbToHex(mixRgb(hexToRgb(a), hexToRgb(b), t));
}

function lerpNum(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function createThemeFromYearProgress(id, p) {
  const tt = ((p % 1) + 1) % 1;
  const springEnd = 0.25;
  const summerEnd = 0.5;
  const autumnEnd = 0.75;

  let stage = 'spring';
  if (tt >= springEnd && tt < summerEnd) stage = 'summer';
  else if (tt >= summerEnd && tt < autumnEnd) stage = 'autumn';
  else if (tt >= autumnEnd) stage = 'winter';

  let s = 0;
  if (stage === 'spring') s = tt / springEnd;
  else if (stage === 'summer') s = (tt - springEnd) / (summerEnd - springEnd);
  else if (stage === 'autumn') s = (tt - summerEnd) / (autumnEnd - summerEnd);
  else s = (tt - autumnEnd) / (1 - autumnEnd);

  const springFresh = '#cfea7d';
  const springYoung = '#92c95d';
  const summerMature = '#4f8c46';
  const autumnYellow = '#9faf58';
  const winterMute = '#95a08f';

  const springToSummer = smoothstep(0.12, 0.55, tt);
  const autumnToWinter = smoothstep(0.64, 0.96, tt);

  let grassCol = springFresh;
  if (stage === 'spring') grassCol = mixHex(springFresh, springYoung, s);
  else if (stage === 'summer') grassCol = mixHex(springYoung, summerMature, s);
  else if (stage === 'autumn') grassCol = mixHex('#7ea654', autumnYellow, s);
  else grassCol = mixHex('#9eab73', winterMute, s);

  const grassSpacing =
    stage === 'spring' ? lerpNum(18.5, 11.2, s)
      : stage === 'summer' ? lerpNum(10.5, 8.2, s)
        : stage === 'autumn' ? lerpNum(9.2, 12.9, s)
          : lerpNum(13.4, 16.4, s);

  const grassHeightMin =
    stage === 'spring' ? lerpNum(0.05, 0.17, s)
      : stage === 'summer' ? lerpNum(0.18, 0.28, s)
        : stage === 'autumn' ? lerpNum(0.25, 0.12, s)
          : lerpNum(0.11, 0.05, s);

  const grassHeightMax =
    stage === 'spring' ? lerpNum(0.14, 0.34, s)
      : stage === 'summer' ? lerpNum(0.36, 0.48, s)
        : stage === 'autumn' ? lerpNum(0.42, 0.24, s)
          : lerpNum(0.22, 0.13, s);

  const summerRain = smoothstep(0.24, 0.42, tt) * (1 - smoothstep(0.56, 0.72, tt));
  const heavyRainBias = smoothstep(0.31, 0.46, tt) * (1 - smoothstep(0.47, 0.59, tt));
  const winterCold = smoothstep(0.75, 0.98, tt);

  return {
    name: TERM_LABELS[id] || id,
    bg: {
      r: Math.round(lerpNum(246, 247, autumnToWinter)),
      g: Math.round(lerpNum(241, 244, autumnToWinter)),
      b: Math.round(lerpNum(232, 236, autumnToWinter))
    },
    grassCol,
    grassMix: lerpNum(0.68, 0.42, autumnToWinter),
    grassSpacing,
    grassHeightMin,
    grassHeightMax,
    rainEnabled: summerRain > 0.06,
    rainCol: '#6c90c3',
    rainDensity: lerpNum(0.15, 2.3, summerRain),
    rainWeight: lerpNum(2.2, 4.4, summerRain),
    rainAlpha: lerpNum(0, 38, summerRain),
    rainWind: lerpNum(12, 42, summerRain),
    rainSpeedMin: lerpNum(170, 280, summerRain),
    rainSpeedMax: lerpNum(320, 620, summerRain),
    rainLenMin: lerpNum(6, 11, summerRain),
    rainLenMax: lerpNum(14, 30, summerRain),
    splashAlpha: lerpNum(0, 110, summerRain),
    splashCount: summerRain > 0.74 ? 3 : summerRain > 0.38 ? 2 : summerRain > 0.12 ? 1 : 0,
    rainOnMin: lerpNum(1.0, 7.5, 1 - summerRain),
    rainOnMax: lerpNum(2.2, 12.0, 1 - summerRain),
    rainOffMin: lerpNum(0.9, 8.0, 1 - summerRain),
    rainOffMax: lerpNum(2.4, 14.0, 1 - summerRain),
    rainFadeIn: lerpNum(5.5, 1.5, summerRain),
    rainFadeOut: lerpNum(6.8, 1.2, summerRain),
    rainPatchCount: summerRain > 0.8 ? 4 : summerRain > 0.45 ? 3 : summerRain > 0.2 ? 2 : 1,
    rainPatchRadiusMin: lerpNum(0.08, 0.22, summerRain),
    rainPatchRadiusMax: lerpNum(0.18, 0.38, summerRain),
    startWithRain: summerRain > 0.48,
    directionBias: stage === 'autumn' ? -1 : 1,
    bendImpulse: lerpNum(0.014, 0.035, springToSummer),
    tickStrength: lerpNum(0.35, 1.05, springToSummer),
    stiffnessDry: lerpNum(7.2, 10.8, winterCold),
    stiffnessWet: lerpNum(6.4, 11.5, winterCold),
    dampingDry: lerpNum(2.8, 3.4, winterCold),
    dampingWet: lerpNum(3.5, 4.2, winterCold),
    targetDecay: lerpNum(0.92, 0.95, winterCold),
    windDryScale: lerpNum(0.85, 1.06, springToSummer),
    windWetScale: lerpNum(0.92, 1.25, springToSummer),
    interactionChance: lerpNum(0.08, 0.28, summerRain),
    wetGain: lerpNum(0.05, 0.12, summerRain),
    baseBandA: lerpNum(10, 22, summerRain),
    wetDroop: lerpNum(0.02, -0.05, summerRain),
    dryRate: lerpNum(0.012, 0.028, 1 - summerRain),
    growthScale: lerpNum(0.10, 0.34, springToSummer),
    growthRate: lerpNum(0.007, 0.050, springToSummer),
    growthDecay: lerpNum(0.015, 0.032, autumnToWinter),
    seasonGrowthTarget: stage === 'spring' ? lerpNum(0.12, 0.55, s)
      : stage === 'summer' ? lerpNum(0.62, 1.00, s)
        : stage === 'autumn' ? lerpNum(0.88, 0.32, s)
          : lerpNum(0.30, 0.06, s),
    seasonGrowthPull: stage === 'summer' ? 0.55 : 0.36,
    branchCountMin: stage === 'spring' ? 0 : stage === 'summer' ? 2 : 1,
    branchCountMax: stage === 'spring' ? 2 : stage === 'summer' ? 5 : stage === 'autumn' ? 4 : 2,
    branchDrawRatio: stage === 'spring' ? lerpNum(0.34, 0.92, s)
      : stage === 'summer' ? 1
        : stage === 'autumn' ? lerpNum(0.88, 0.45, s)
          : lerpNum(0.40, 0.20, s),
    branchLengthScale: stage === 'spring' ? lerpNum(0.62, 1.0, s)
      : stage === 'summer' ? 1.06
        : stage === 'autumn' ? lerpNum(0.96, 0.72, s)
          : lerpNum(0.68, 0.52, s),
    windGustChance: lerpNum(0.12, 0.52, heavyRainBias),
    windGustMin: lerpNum(0.003, 0.010, heavyRainBias),
    windGustMax: lerpNum(0.008, 0.020, heavyRainBias),
    windGustIn: lerpNum(0.9, 2.2, heavyRainBias),
    windGustOut: lerpNum(1.5, 2.8, heavyRainBias),
    snowEnabled: winterCold > 0.25,
    snowCol: { r: 198, g: 198, b: 198 },
    snowDensity: lerpNum(0.25, 0.9, winterCold),
    snowSizeMin: 1.2,
    snowSizeMax: 3.4,
    snowSpeedMin: 8,
    snowSpeedMax: 24,
    snowDrift: 18,
    snowAlpha: lerpNum(90, 145, winterCold),
    frostEnabled: winterCold > 0.18,
    frostCol: { r: 245, g: 250, b: 255 },
    frostDensity: lerpNum(0.2, 0.82, winterCold),
    frostSizeMin: 6,
    frostSizeMax: 22,
    frostAlphaMin: 8,
    frostAlphaMax: 30,
    frostDrift: 6,
    frostSpeedMin: 0.35,
    frostSpeedMax: 0.9
  };
}

function createIntroSeasonTheme(progress) {
  const tt = ((progress % 1) + 1) % 1;
  const base = createThemeFromYearProgress('__intro__', tt);
  const seasonDefs = [
    {
      at: 0.0,
      name: 'spring',
      bg: { r: 245, g: 241, b: 229 },
      grassCol: '#9dff00',
      grassMix: 0.56,
      grassHeightMin: 0.045,
      grassHeightMax: 0.18,
      seasonGrowthTarget: 0.22,
      seasonGrowthPull: 0.5,
      growthRate: 0.03,
      growthDecay: 0,
      growthScale: 0.16,
      seasonDensityTarget: 0.6,
      seasonDensityPull: 0.54,
      densityGrowthRate: 0.045,
      densityDecay: 0,
      windDryScale: 1.18,
      windWetScale: 1.32,
      windGustChance: 0.34,
      windGustMin: 0.006,
      windGustMax: 0.017,
      windGustIn: 1.7,
      windGustOut: 2.3,
      bendImpulse: 0.029,
      tickStrength: 0.62,
      dryRate: 0.012,
      rainDensity: 0.08,
      rainWeight: 2.2,
      rainAlpha: 5,
      rainPresenceTarget: 0.03,
      rainWind: 20,
      rainSpeedMin: 200,
      rainSpeedMax: 320,
      rainLenMin: 6,
      rainLenMax: 14,
      splashAlpha: 18,
      splashCount: 0,
      branchDrawRatio: 0.55,
      branchLengthScale: 0.74,
      snowDensity: 0,
      snowAlpha: 0,
      frostDensity: 0.05,
      frostAlphaMin: 0,
      frostAlphaMax: 4
    },
    // {
    //   at: 0.14,
    //   name: 'spring',
    //   bg: { r: 244, g: 240, b: 227 },
    //   grassCol: '#68ef13',
    //   grassMix: 0.64,
    //   grassHeightMin: 0.06,
    //   grassHeightMax: 0.28,
    //   seasonGrowthTarget: 0.5,
    //   seasonGrowthPull: 0.78,
    //   growthRate: 0.07,
    //   growthDecay: 0,
    //   growthScale: 0.26,
    //   seasonDensityTarget: 0.72,
    //   seasonDensityPull: 0.84,
    //   densityGrowthRate: 0.1,
    //   densityDecay: 0,
    //   windDryScale: 1.92,
    //   windWetScale: 2.06,
    //   windGustChance: 0.62,
    //   windGustMin: 0.012,
    //   windGustMax: 0.027,
    //   windGustIn: 2.35,
    //   windGustOut: 3.0,
    //   bendImpulse: 0.046,
    //   tickStrength: 1.14,
    //   dryRate: 0.012,
    //   rainDensity: 0.18,
    //   rainWeight: 2.8,
    //   rainAlpha: 12,
    //   rainPresenceTarget: 0.14,
    //   rainWind: 24,
    //   rainSpeedMin: 225,
    //   rainSpeedMax: 400,
    //   rainLenMin: 9,
    //   rainLenMax: 22,
    //   splashAlpha: 28,
    //   splashCount: 1,
    //   branchDrawRatio: 0.72,
    //   branchLengthScale: 0.86,
    //   snowDensity: 0,
    //   snowAlpha: 0,
    //   frostDensity: 0.03,
    //   frostAlphaMin: 0,
    //   frostAlphaMax: 2
    // },
    // {
    //   at: 0.28,
    //   name: 'spring',
    //   bg: { r: 243, g: 239, b: 224 },
    //   grassCol: '#7bc65d',
    //   grassMix: 0.7,
    //   grassHeightMin: 0.08,
    //   grassHeightMax: 0.36,
    //   seasonGrowthTarget: 0.64,
    //   seasonGrowthPull: 0.66,
    //   growthRate: 0.045,
    //   growthDecay: 0,
    //   growthScale: 0.34,
    //   seasonDensityTarget: 0.84,
    //   seasonDensityPull: 0.72,
    //   densityGrowthRate: 0.06,
    //   densityDecay: 0,
    //   windDryScale: 1.72,
    //   windWetScale: 1.84,
    //   windGustChance: 0.48,
    //   windGustMin: 0.009,
    //   windGustMax: 0.02,
    //   windGustIn: 1.9,
    //   windGustOut: 2.6,
    //   bendImpulse: 0.038,
    //   tickStrength: 0.92,
    //   dryRate: 0.012,
    //   rainDensity: 0.3,
    //   rainWeight: 3.6,
    //   rainAlpha: 20,
    //   rainPresenceTarget: 0.24,
    //   rainWind: 22,
    //   rainSpeedMin: 240,
    //   rainSpeedMax: 430,
    //   rainLenMin: 12,
    //   rainLenMax: 28,
    //   splashAlpha: 44,
    //   splashCount: 2,
    //   branchDrawRatio: 0.84,
    //   branchLengthScale: 0.96,
    //   snowDensity: 0,
    //   snowAlpha: 0,
    //   frostDensity: 0,
    //   frostAlphaMin: 0,
    //   frostAlphaMax: 0
    // },
    {
      at: 0.2,
      name: 'summer',
      bg: { r: 241, g: 238, b: 224 },
      grassCol: '#2f7f35',
      grassMix: 0.84,
      grassHeightMin: 0.2,
      grassHeightMax: 0.35,
      seasonGrowthTarget: 1.0,
      seasonGrowthPull: 0.76,
      growthRate: 0.045,
      growthDecay: 0.012,
      growthScale: 0.25,
      seasonDensityTarget: 1.0,
      seasonDensityPull: 0.7,
      densityGrowthRate: 0.035,
      densityDecay: 0.004,
      windDryScale: 2.05,
      windWetScale: 2.35,
      windGustChance: 0.44,
      windGustMin: 0.012,
      windGustMax: 0.030,
      windGustIn: 2.2,
      windGustOut: 2.8,
      bendImpulse: 0.045,
      tickStrength: 1.0,
      dryRate: 0,
      rainDensity: 0.52,
      rainWeight: 5.6,
      rainAlpha: 40,
      rainPresenceTarget: 1,
      rainWind: 16,
      rainSpeedMin: 260,
      rainSpeedMax: 560,
      rainLenMin: 16,
      rainLenMax: 44,
      splashAlpha: 86,
      splashCount: 4,
      branchDrawRatio: 5,
      branchLengthScale: 1.12,
      snowDensity: 0,
      snowAlpha: 0,
      frostDensity: 0,
      frostAlphaMin: 0,
      frostAlphaMax: 0
    },
    {
      at: 0.7,
      name: 'autumn',
      bg: { r: 238, g: 228, b: 210 },
      grassCol: '#8e640f',
      grassMix: 0.92,
      grassHeightMin: 0.12,
      grassHeightMax: 0.26,
      seasonGrowthTarget: 0.3,
      seasonGrowthPull: 0.42,
      growthRate: 0,
      growthDecay: 0.058,
      growthScale: 0.16,
      seasonDensityTarget: 0.80,
      seasonDensityPull: 0.82,
      densityGrowthRate: 0,
      densityDecay: 0.05,
      windDryScale: 1.18,
      windWetScale: 1.1,
      windGustChance: 0.22,
      windGustMin: 0.005,
      windGustMax: 0.015,
      windGustIn: 1.6,
      windGustOut: 2.2,
      bendImpulse: 0.026,
      tickStrength: 0.64,
      dryRate: 0.04,
      rainDensity: 0,
      rainWeight: 0,
      rainAlpha: 0,
      rainPresenceTarget: 0,
      rainWind: 14,
      rainSpeedMin: 180,
      rainSpeedMax: 280,
      rainLenMin: 6,
      rainLenMax: 12,
      splashAlpha: 0,
      splashCount: 0,
      branchDrawRatio: 0.52,
      branchLengthScale: 0.66,
      snowDensity: 0.04,
      snowAlpha: 4,
      frostDensity: 0.14,
      frostAlphaMin: 2,
      frostAlphaMax: 8
    },
    {
      at: 0.90,
      name: 'winter',
      bg: { r: 247, g: 246, b: 243 },
      grassCol: '#c5c8bd',
      grassMix: 0.18,
      grassHeightMin: 0.04,
      grassHeightMax: 0.10,
      seasonGrowthTarget: 0.06,
      seasonGrowthPull: 0.32,
      growthRate: 0,
      growthDecay: 0.02,
      growthScale: 0.08,
      seasonDensityTarget: 0.6,
      seasonDensityPull: 0.62,
      densityGrowthRate: 0,
      densityDecay: 0.015,
      windDryScale: 0.54,
      windWetScale: 0.6,
      windGustChance: 0.08,
      windGustMin: 0.002,
      windGustMax: 0.006,
      windGustIn: 1.2,
      windGustOut: 1.8,
      bendImpulse: 0.012,
      tickStrength: 0.18,
      dryRate: 0.018,
      rainDensity: 0,
      rainWeight: 2,
      rainAlpha: 0,
      rainPresenceTarget: 0,
      rainWind: 8,
      rainSpeedMin: 160,
      rainSpeedMax: 240,
      rainLenMin: 5,
      rainLenMax: 10,
      splashAlpha: 0,
      splashCount: 0,
      branchDrawRatio: 0.2,
      branchLengthScale: 0.48,
      snowDensity: 1.55,
      snowAlpha: 200,
      frostDensity: 1.0,
      frostAlphaMin: 10,
      frostAlphaMax: 38
    },
    {
      at: 1.0,
      name: 'spring',
      bg: { r: 245, g: 241, b: 229 },
      grassCol: '#9dff00',
      grassMix: 0.56,
      grassHeightMin: 0.045,
      grassHeightMax: 0.18,
      seasonGrowthTarget: 0.22,
      seasonGrowthPull: 0.5,
      growthRate: 0.03,
      growthDecay: 0,
      growthScale: 0.16,
      seasonDensityTarget: 0.6,
      seasonDensityPull: 0.54,
      densityGrowthRate: 0.045,
      densityDecay: 0,
      windDryScale: 1.18,
      windWetScale: 1.32,
      windGustChance: 0.34,
      windGustMin: 0.006,
      windGustMax: 0.017,
      windGustIn: 1.7,
      windGustOut: 2.3,
      bendImpulse: 0.029,
      tickStrength: 0.62,
      dryRate: 0.012,
      rainDensity: 0.08,
      rainWeight: 2.2,
      rainAlpha: 5,
      rainPresenceTarget: 0.03,
      rainWind: 20,
      rainSpeedMin: 200,
      rainSpeedMax: 320,
      rainLenMin: 6,
      rainLenMax: 14,
      splashAlpha: 18,
      splashCount: 0,
      branchDrawRatio: 0.55,
      branchLengthScale: 0.74,
      snowDensity: 0,
      snowAlpha: 0,
      frostDensity: 0.05,
      frostAlphaMin: 0,
      frostAlphaMax: 4
    }
  ];

  let current = seasonDefs[0];
  let next = seasonDefs[seasonDefs.length - 1];
  for (let i = 0; i < seasonDefs.length - 1; i++) {
    const a = seasonDefs[i];
    const b = seasonDefs[i + 1];
    if (tt >= a.at && tt <= b.at) {
      current = a;
      next = b;
      break;
    }
  }
  const span = Math.max(0.0001, next.at - current.at);
  const localT = (tt - current.at) / span;
  const isWinterToSpring = current.name === 'winter' && next.name === 'spring';
  const mixT = isWinterToSpring
    ? smoothstep(0, 1, smoothstep(0, 1, localT))
    : smoothstep(0, 1, localT);

  const blendNum = (key) => lerpNum(current[key], next[key], mixT);
  const blendHex = (key) => mixHex(current[key], next[key], mixT);
  const blendBg = () => ({
    r: Math.round(lerpNum(current.bg.r, next.bg.r, mixT)),
    g: Math.round(lerpNum(current.bg.g, next.bg.g, mixT)),
    b: Math.round(lerpNum(current.bg.b, next.bg.b, mixT))
  });

  base.name = `Season Loop ${current.name}`;
  base.dynamicDensity = true;
  base.fieldDensityBoost = 1.55;
  base.fieldSpacingMin = 4.5;
  base.fieldSpacingMax = 18;
  base.fieldJitterMax = 10;
  base.bg = blendBg();
  base.grassCol = blendHex('grassCol');
  base.grassMix = blendNum('grassMix');
  base.grassHeightMin = blendNum('grassHeightMin');
  base.grassHeightMax = blendNum('grassHeightMax');
  base.seasonGrowthTarget = blendNum('seasonGrowthTarget');
  base.seasonGrowthPull = blendNum('seasonGrowthPull');
  base.growthRate = blendNum('growthRate');
  base.growthDecay = blendNum('growthDecay');
  base.growthScale = blendNum('growthScale');
  base.seasonDensityTarget = blendNum('seasonDensityTarget');
  base.seasonDensityPull = blendNum('seasonDensityPull');
  base.densityGrowthRate = blendNum('densityGrowthRate');
  base.densityDecay = blendNum('densityDecay');
  base.windDryScale = blendNum('windDryScale');
  base.windWetScale = blendNum('windWetScale');
  base.windGustChance = blendNum('windGustChance');
  base.windGustMin = blendNum('windGustMin');
  base.windGustMax = blendNum('windGustMax');
  base.windGustIn = blendNum('windGustIn');
  base.windGustOut = blendNum('windGustOut');
  base.bendImpulse = blendNum('bendImpulse');
  base.tickStrength = blendNum('tickStrength');
  base.dryRate = blendNum('dryRate');
  base.rainDensity = blendNum('rainDensity');
  base.rainWeight = blendNum('rainWeight');
  base.rainAlpha = blendNum('rainAlpha');
  base.rainPresenceTarget = blendNum('rainPresenceTarget');
  base.rainWind = blendNum('rainWind');
  base.rainSpeedMin = blendNum('rainSpeedMin');
  base.rainSpeedMax = blendNum('rainSpeedMax');
  base.rainLenMin = blendNum('rainLenMin');
  base.rainLenMax = blendNum('rainLenMax');
  base.splashAlpha = blendNum('splashAlpha');
  base.splashCount = Math.round(blendNum('splashCount'));
  base.branchDrawRatio = blendNum('branchDrawRatio');
  base.branchLengthScale = blendNum('branchLengthScale');
  base.snowDensity = blendNum('snowDensity');
  base.snowAlpha = blendNum('snowAlpha');
  base.frostDensity = blendNum('frostDensity');
  base.frostAlphaMin = blendNum('frostAlphaMin');
  base.frostAlphaMax = blendNum('frostAlphaMax');
  base.snowEnabled = base.snowDensity > 0.02;
  base.frostEnabled = base.frostDensity > 0.02;
  base.rainEnabled = base.rainDensity > 0.03;
  base.snowSizeMin = 1.4;
  base.snowSizeMax = 4.2;
  base.snowSpeedMin = 12;
  base.snowSpeedMax = 36;

  return base;
}

function createIntroSeasonLoopRenderTheme(progress) {
  const tt = ((progress % 1) + 1) % 1;
  const theme = createIntroSeasonTheme(tt);
  const summerPeakTheme = createIntroSeasonTheme(0.2);
  const autumnGrassTheme = createIntroSeasonTheme(0.72);
  const winterGrassTheme = createIntroSeasonTheme(0.94);
  const next = {
    ...theme,
    bg: theme?.bg ? { ...theme.bg } : theme?.bg
  };
  const summerBlend = smoothstep(0.16, 0.4, tt) * (1 - smoothstep(0.58, 0.82, tt));
  const autumnDormancyBlend = smoothstep(0.48, 0.62, tt) * (1 - smoothstep(0.78, 0.88, tt));
  const winterLeadBlend = smoothstep(0.76, 0.88, tt);
  const springCarryBlend = 1 - smoothstep(0.0, 0.08, tt);
  const winterStateBlend = Math.max(winterLeadBlend, springCarryBlend);
  const summerHeightCapMin = (summerPeakTheme.grassHeightMin ?? 0) * 0.5;
  const summerHeightCapMax = (summerPeakTheme.grassHeightMax ?? 0) * 0.5;
  const autumnDormantHeightMin = Math.min(autumnGrassTheme.grassHeightMin ?? 0, summerHeightCapMin);
  const autumnDormantHeightMax = Math.min(autumnGrassTheme.grassHeightMax ?? 0, summerHeightCapMax);
  const winterVisibleHeightMin = Math.max(winterGrassTheme.grassHeightMin ?? 0, 0.058);
  const winterVisibleHeightMax = Math.max(winterGrassTheme.grassHeightMax ?? 0, 0.145);

  if (summerBlend > 0.0001) {
    next.grassHeightMin = lerpNum(theme.grassHeightMin ?? 0, (theme.grassHeightMin ?? 0) * 0.5, summerBlend);
    next.grassHeightMax = lerpNum(theme.grassHeightMax ?? 0, (theme.grassHeightMax ?? 0) * 0.42, summerBlend);
  }

  if (autumnDormancyBlend > 0.0001) {
    next.grassHeightMin = lerpNum(next.grassHeightMin ?? 0, autumnDormantHeightMin, autumnDormancyBlend);
    next.grassHeightMax = lerpNum(next.grassHeightMax ?? 0, autumnDormantHeightMax, autumnDormancyBlend);
    next.seasonGrowthTarget = lerpNum(next.seasonGrowthTarget ?? 0, 0, autumnDormancyBlend);
    next.seasonGrowthPull = lerpNum(next.seasonGrowthPull ?? 0, 0, autumnDormancyBlend);
    next.growthRate = lerpNum(next.growthRate ?? 0, 0, autumnDormancyBlend);
    next.growthDecay = lerpNum(next.growthDecay ?? 0, Math.max(next.growthDecay ?? 0, 0.028), autumnDormancyBlend);
    next.growthScale = lerpNum(next.growthScale ?? 0, 0, autumnDormancyBlend);
    next.seasonDensityPull = lerpNum(next.seasonDensityPull ?? 0, 0, autumnDormancyBlend);
    next.densityGrowthRate = lerpNum(next.densityGrowthRate ?? 0, 0, autumnDormancyBlend);
    next.densityDecay = lerpNum(next.densityDecay ?? 0, 0.012, autumnDormancyBlend);
  }

  if (winterStateBlend > 0.0001) {
    next.grassHeightMin = lerpNum(next.grassHeightMin ?? 0, winterVisibleHeightMin, winterStateBlend);
    next.grassHeightMax = lerpNum(next.grassHeightMax ?? 0, winterVisibleHeightMax, winterStateBlend);
    next.seasonGrowthTarget = lerpNum(next.seasonGrowthTarget ?? 0, 0, winterStateBlend);
    next.seasonGrowthPull = lerpNum(next.seasonGrowthPull ?? 0, 0, winterStateBlend);
    next.growthRate = lerpNum(next.growthRate ?? 0, 0, winterStateBlend);
    next.growthDecay = lerpNum(next.growthDecay ?? 0, 0.012, winterStateBlend);
    next.growthScale = lerpNum(next.growthScale ?? 0, 0, winterStateBlend);
    next.seasonDensityPull = lerpNum(next.seasonDensityPull ?? 0, 0, winterStateBlend);
    next.densityGrowthRate = lerpNum(next.densityGrowthRate ?? 0, 0, winterStateBlend);
    next.densityDecay = lerpNum(next.densityDecay ?? 0, 0.006, winterStateBlend);
  }

  return next;
}

let INTRO_THEME_BOUNDS = null;

function computeIntroThemeBounds() {
  if (INTRO_THEME_BOUNDS) return INTRO_THEME_BOUNDS;

  const bounds = {};
  const samples = 256;
  const upsertBound = (key, value) => {
    if (!Number.isFinite(value)) return;
    if (!bounds[key]) {
      bounds[key] = { min: value, max: value };
      return;
    }
    bounds[key].min = Math.min(bounds[key].min, value);
    bounds[key].max = Math.max(bounds[key].max, value);
  };

  for (let i = 0; i <= samples; i++) {
    const theme = createIntroSeasonTheme(i / samples);
    for (const [key, value] of Object.entries(theme)) {
      if (typeof value === 'number') {
        upsertBound(key, value);
      }
    }
    if (theme.bg) {
      upsertBound('bg.r', theme.bg.r);
      upsertBound('bg.g', theme.bg.g);
      upsertBound('bg.b', theme.bg.b);
    }
  }

  INTRO_THEME_BOUNDS = bounds;
  return bounds;
}

function clampThemeToIntroBounds(theme) {
  const bounds = computeIntroThemeBounds();
  const next = {
    ...theme,
    bg: theme?.bg ? { ...theme.bg } : theme?.bg
  };

  for (const [key, value] of Object.entries(next)) {
    if (key === 'bg') continue;
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    const bound = bounds[key];
    if (!bound) continue;
    next[key] = clamp(value, bound.min, bound.max);
  }

  if (next.bg && typeof next.bg === 'object') {
    const rBound = bounds['bg.r'];
    const gBound = bounds['bg.g'];
    const bBound = bounds['bg.b'];
    if (rBound && Number.isFinite(next.bg.r)) next.bg.r = Math.round(clamp(next.bg.r, rBound.min, rBound.max));
    if (gBound && Number.isFinite(next.bg.g)) next.bg.g = Math.round(clamp(next.bg.g, gBound.min, gBound.max));
    if (bBound && Number.isFinite(next.bg.b)) next.bg.b = Math.round(clamp(next.bg.b, bBound.min, bBound.max));
  }

  return next;
}

const THEMES = TERM_YEAR_SEQUENCE.reduce((acc, id, i) => {
  const p = i / TERM_YEAR_SEQUENCE.length;
  acc[id] = createThemeFromYearProgress(id, p);
  return acc;
}, {});

function getInitialTheme() {
  const injected = window.__TERM_ID__;
  if (injected && THEMES[injected]) return injected;
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name');
  if (name && THEMES[name]) return name;
  const path = window.location.pathname || '';
  const m = path.match(/\/term\/([^/?#]+)/);
  if (m && m[1] && THEMES[m[1]]) return m[1];
  return 'lichun';
}

let ACTIVE_THEME = getInitialTheme();
let THEME = THEMES[ACTIVE_THEME];
let BG = THEMES[ACTIVE_THEME].bg;
let GRASS_COL = THEMES[ACTIVE_THEME].grassCol;
let GRASS_MIX = THEMES[ACTIVE_THEME].grassMix;
let RAIN_COL = THEMES[ACTIVE_THEME].rainCol;
let grassSpacing = THEMES[ACTIVE_THEME].grassSpacing;
let grassHeightMin = THEMES[ACTIVE_THEME].grassHeightMin;
let grassHeightMax = THEMES[ACTIVE_THEME].grassHeightMax;
let BACKGROUND_MODE = 'term';
let seasonLoopDurationMs = 160000;
let seasonLoopStartMs = 0;
let seasonLoopProgress = 0;
let pendingMode = null;
let densityLevel = 0;

const RAIN = {
  enabled: true,
  density: THEMES[ACTIVE_THEME].rainDensity,
  minLen: THEMES[ACTIVE_THEME].rainLenMin,
  maxLen: THEMES[ACTIVE_THEME].rainLenMax,
  minSpeed: THEMES[ACTIVE_THEME].rainSpeedMin,
  maxSpeed: THEMES[ACTIVE_THEME].rainSpeedMax,
  wind: THEMES[ACTIVE_THEME].rainWind,
  alpha: THEMES[ACTIVE_THEME].rainAlpha,
  weight: THEMES[ACTIVE_THEME].rainWeight,
  splashCount: THEMES[ACTIVE_THEME].splashCount,
  splashAlpha: THEMES[ACTIVE_THEME].splashAlpha
};

const SNOW = {
  enabled: false,
  density: 0.7,
  sizeMin: 0.6,
  sizeMax: 2.4,
  speedMin: 8,
  speedMax: 26,
  drift: 18,
  alpha: 90,
  col: { r: 198, g: 198, b: 198 }
};

const FROST = {
  enabled: false,
  density: 0.75,
  sizeMin: 6,
  sizeMax: 22,
  alphaMin: 8,
  alphaMax: 28,
  drift: 6,
  speedMin: 0.35,
  speedMax: 0.9,
  col: { r: 245, g: 250, b: 255 }
};

let rainPatches = [];
let rainOn = true;
let rainIntensity = 0;
let rainTimer = 0;
let rainPhaseDuration = 0;
let windGust = 0;
let windGustTarget = 0;
let windGustOn = false;
let windGustTimer = 0;
let windGustPhaseDuration = 0;
let growthLevel = 0;
let snowCover = 0;
let p5Ready = false;
let pendingThemeKey = null;
let pointerListenersBound = false;

const POINTER = {
  x: 0,
  y: 0,
  dirX: 1,
  speed: 0,
  energy: 0,
  active: false,
  hasPoint: false,
  lastMoveAt: 0,
  lastSampleAt: 0
};

function getNowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function getViewportSize() {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  const visualViewport = window.visualViewport;
  const viewportWidth = Math.round(visualViewport?.width || window.innerWidth || 0);
  const viewportHeight = Math.round(visualViewport?.height || window.innerHeight || 0);

  return {
    width: Math.max(1, viewportWidth),
    height: Math.max(1, viewportHeight)
  };
}

function getTermBgMount() {
  if (typeof document === 'undefined') return null;
  return document.getElementById('termP5Mount') || document.body;
}

function getTermBgCanvasElement() {
  if (typeof window === 'undefined') return null;
  return window.__termBgCanvas || null;
}

function applyTermBgCanvasViewportStyle(canvas) {
  if (!canvas || !canvas.style) return;
  const viewport = getViewportSize();
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = viewport.width > 0 ? `${viewport.width}px` : '100vw';
  canvas.style.height = viewport.height > 0 ? `${viewport.height}px` : '100vh';
  canvas.style.display = 'block';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '0';
}

function syncTermBgCanvasMount() {
  const mount = getTermBgMount();
  const canvas = getTermBgCanvasElement();
  if (!mount || !canvas) return false;

  if (canvas.parentNode !== mount) {
    mount.appendChild(canvas);
  }
  applyTermBgCanvasViewportStyle(canvas);

  return canvas.isConnected;
}

function teardownTermBgInstance() {
  if (window.__termBgP5Instance && typeof window.__termBgP5Instance.remove === 'function') {
    try {
      window.__termBgP5Instance.remove();
    } catch (_) {}
  }
  p5Ready = false;
  pendingMode = null;
  pendingThemeKey = null;
  unbindPointerInteractions();
  resetRuntimeState();
  resetPointerInteraction();
  window.__termBgCanvas = null;
  window.__termBgP5Instance = null;
}

function ensureTermBgP5Instance() {
  if (window.__termBgP5Instance && typeof window.__termBgP5Instance.remove === 'function') {
    if (!p5Ready) {
      return true;
    }
    if (syncTermBgCanvasMount()) {
      return true;
    }
    try {
      window.__termBgP5Instance.remove();
    } catch (_) {}
    window.__termBgP5Instance = null;
    window.__termBgCanvas = null;
  }
  if (!window.p5) return false;
  p5Ready = false;
  tPrev = 0;
  window.__termBgP5Instance = new window.p5();
  return true;
}

function resetRuntimeState() {
  blades = [];
  drops = [];
  splashes = [];
  flakes = [];
  frost = [];
  snowSettled = [];
  rainPatches = [];
  rainOn = true;
  rainIntensity = 0;
  rainTimer = 0;
  rainPhaseDuration = 0;
  windGust = 0;
  windGustTarget = 0;
  windGustOn = false;
  windGustTimer = 0;
  windGustPhaseDuration = 0;
  growthLevel = 0;
  densityLevel = 0;
  snowCover = 0;
  seasonLoopProgress = 0;
  seasonLoopStartMs = 0;
  tPrev = 0;
}

function resetPointerInteraction() {
  const canvas = typeof window !== 'undefined' ? window.__termBgCanvas : null;
  const viewport = getViewportSize();
  const viewportWidth =
    (canvas && (canvas.clientWidth || canvas.width)) ||
    viewport.width;
  const viewportHeight =
    (canvas && (canvas.clientHeight || canvas.height)) ||
    viewport.height;

  POINTER.x = viewportWidth * 0.5;
  POINTER.y = viewportHeight * 0.72;
  POINTER.dirX = 1;
  POINTER.speed = 0;
  POINTER.energy = 0;
  POINTER.active = false;
  POINTER.hasPoint = false;
  POINTER.lastMoveAt = 0;
  POINTER.lastSampleAt = 0;
}

function getPointerClientPosition(input) {
  if (!input || typeof input !== 'object') return null;

  const x = Number.isFinite(input.clientX) ? input.clientX : input.x;
  const y = Number.isFinite(input.clientY) ? input.clientY : input.y;

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return { x, y };
}

function projectPointerToField(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  const canvas = typeof window !== 'undefined' ? window.__termBgCanvas : null;
  const viewport = getViewportSize();
  const fallbackWidth =
    (canvas && (canvas.clientWidth || canvas.width)) ||
    viewport.width;
  const fallbackHeight =
    (canvas && (canvas.clientHeight || canvas.height)) ||
    viewport.height;

  const fieldWidth = p5Ready && Number.isFinite(width) ? width : fallbackWidth;
  const fieldHeight = p5Ready && Number.isFinite(height) ? height : fallbackHeight;

  if (!Number.isFinite(fieldWidth) || !Number.isFinite(fieldHeight) || fieldWidth <= 0 || fieldHeight <= 0) {
    return { x, y };
  }

  return {
    x: clamp(x, fieldWidth * 0.04, fieldWidth * 0.96),
    y: clamp(Math.max(y, fieldHeight * 0.6), fieldHeight * 0.6, fieldHeight * 0.94)
  };
}

function handlePointerMove(event) {
  if (BACKGROUND_MODE !== 'season-loop') return;
  const point = getPointerClientPosition(event);
  if (!point) return;
  const fieldPoint = projectPointerToField(point.x, point.y);
  if (!fieldPoint) return;
  const { x, y } = fieldPoint;

  const now = performance.now() * 0.001;
  if (!POINTER.hasPoint) {
    POINTER.x = x;
    POINTER.y = y;
    POINTER.hasPoint = true;
    POINTER.lastSampleAt = now;
    POINTER.lastMoveAt = now;
    pressGrassAt(x, y, 0.58);
    return;
  }

  const dt = Math.max(0.008, now - POINTER.lastSampleAt);
  const dx = x - POINTER.x;
  const dy = y - POINTER.y;
  const dist = Math.hypot(dx, dy);

  POINTER.x = x;
  POINTER.y = y;
  POINTER.lastSampleAt = now;

  if (dist < 0.5) return;

  const speed = Math.min(1900, dist / dt);
  if (Math.abs(dx) > 0.75) {
    POINTER.dirX = Math.sign(dx);
  }
  POINTER.speed = lerpNum(POINTER.speed, speed, 0.32);
  POINTER.energy = Math.min(1.0, POINTER.energy + 0.06 + speed / 8200);
  POINTER.active = true;
  POINTER.lastMoveAt = now;
  pressGrassAt(x, y, 0.76);
}

function pressGrassAt(x, y, interactionStrength = 1) {
  if (BACKGROUND_MODE !== 'season-loop' || !blades.length) return false;

  const radiusX = Math.max(120, width * 0.12);
  const radiusY = Math.max(120, height * 0.22);
  let hitCount = 0;

  for (const blade of blades) {
    const densityEase = blade.getDensityEase();
    if (densityEase <= 0.04) continue;

    const stemHeight = blade.getRenderHeight(THEME, densityEase);
    const tipY = blade.baseY - stemHeight;
    if (y < tipY - 26 || y > blade.baseY + 10) continue;

    const dx = Math.abs(blade.x - x);
    if (dx > radiusX) continue;

    const stemMidY = lerp(blade.baseY, tipY, 0.42);
    const dy = Math.abs(stemMidY - y);
    if (dy > radiusY) continue;

    const xFalloff = 1 - smoothstep(radiusX * 0.18, radiusX, dx);
    const yFalloff = 1 - smoothstep(radiusY * 0.18, radiusY, dy);
    const falloff = xFalloff * yFalloff;
    if (falloff <= 0.01) continue;

    const softStrength = clamp(interactionStrength, 0.35, 1.1);
    blade.press((0.22 + falloff * 0.24) * softStrength);
    blade.addTarget((x <= blade.x ? 1 : -1) * (0.012 + THEME.bendImpulse * 0.9) * falloff * softStrength);
    blade.triggerTick((0.38 + falloff * 0.46) * softStrength);
    hitCount++;
  }

  return hitCount > 0;
}

function handlePointerDown(event) {
  const point = getPointerClientPosition(event);
  if (!point) return;
  const projected = projectPointerToField(point.x, point.y);
  if (!projected) return;
  const { x, y } = projected;
  pressGrassAt(x, y, 0.9);
}

function handlePointerReset() {
  POINTER.hasPoint = false;
  POINTER.speed = 0;
  POINTER.energy = 0;
  POINTER.active = false;
  POINTER.lastMoveAt = 0;
  POINTER.lastSampleAt = 0;
}

function bindPointerInteractions() {
  if (pointerListenersBound || typeof document === 'undefined') return;
  document.addEventListener('pointermove', handlePointerMove, { passive: true });
  document.addEventListener('pointerdown', handlePointerDown, { passive: true });
  window.addEventListener('blur', handlePointerReset);
  pointerListenersBound = true;
}

function unbindPointerInteractions() {
  if (!pointerListenersBound || typeof document === 'undefined') return;
  document.removeEventListener('pointermove', handlePointerMove);
  document.removeEventListener('pointerdown', handlePointerDown);
  window.removeEventListener('blur', handlePointerReset);
  pointerListenersBound = false;
}

function updatePointerInteraction(dt) {
  if (!POINTER.active) return;
  const now = millis() * 0.001;
  const idle = now - POINTER.lastMoveAt;
  const decayRate = idle < 0.12 ? 0.34 : idle < 0.32 ? 0.9 : 1.75;
  POINTER.energy = Math.max(0, POINTER.energy - dt * decayRate);
  POINTER.speed = lerpNum(POINTER.speed, 0, Math.min(1, dt * 3.2));
  if (idle > 1.15 && POINTER.energy < 0.01) {
    handlePointerReset();
  }
}

function getPointerWindForBlade(blade, theme) {
  if (BACKGROUND_MODE !== 'season-loop' || !POINTER.active || POINTER.energy <= 0.01) {
    return 0;
  }

  const age = millis() * 0.001 - POINTER.lastMoveAt;
  if (age > 0.9) return 0;

  const freshness = 1 - smoothstep(0.04, 0.95, age);
  const speedNorm = clamp(POINTER.speed / 2100, 0, 1.1);
  const spread = lerpNum(120, 280, speedNorm);
  const xDistance = Math.abs(blade.x - POINTER.x);
  const proximity = 1 - smoothstep(spread * 0.12, spread, xDistance);
  if (proximity <= 0) return 0;

  const verticalBias = lerpNum(0.94, 1.08, clamp(POINTER.y / Math.max(height, 1), 0, 1));
  const seasonFloor = 0.82;
  const amplitude =
    0.034 *
    freshness *
    proximity *
    POINTER.energy *
    (0.35 + speedNorm) *
    Math.max(seasonFloor, theme.windDryScale * 0.85) *
    verticalBias;

  return POINTER.dirX * amplitude;
}

function setup() {
  const mount = getTermBgMount();
  const viewport = getViewportSize();
  const canvas = createCanvas(viewport.width, viewport.height);
  window.__termBgCanvas = canvas.elt;
  applyTermBgCanvasViewportStyle(canvas.elt);
  canvas.parent(mount);
  bindPointerInteractions();
  resetPointerInteraction();
  pixelDensity(displayDensity());
  applyTheme(ACTIVE_THEME, false);
  initField(false);
  initRain();
  initRainSystem();
  initWindSystem();
  initSnow();
  initFrost();
  p5Ready = true;
  if (pendingMode === 'season-loop') {
    const duration = seasonLoopDurationMs;
    pendingMode = null;
    startSeasonLoop(duration);
    return;
  }
  if (pendingThemeKey) {
    const nextKey = pendingThemeKey;
    pendingThemeKey = null;
    applyTheme(nextKey, true);
  }
}

function syncCanvasToViewport(preserveFieldState = true) {
  const viewport = getViewportSize();
  if (viewport.width <= 0 || viewport.height <= 0) return;

  resizeCanvas(viewport.width, viewport.height);
  applyTermBgCanvasViewportStyle(window.__termBgCanvas);
  resetPointerInteraction();
  initField(preserveFieldState);
  initRain();
  initRainSystem();
  initWindSystem();
  initSnow();
  initFrost();
}

function windowResized() {
  // Fullscreen enter/exit can emit a short burst of intermediate resize values.
  // Rebuilding against the settled visual viewport keeps the field from jumping.
  window.requestAnimationFrame(() => {
    syncCanvasToViewport(true);
  });
}

function assignTheme(theme) {
  THEME = theme;
  BG = theme.bg;
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.style.setProperty('--term-bg-color', `rgb(${BG.r}, ${BG.g}, ${BG.b})`);
  }
  GRASS_COL = theme.grassCol;
  GRASS_MIX = theme.grassMix;
  RAIN_COL = theme.rainCol;
  grassSpacing = theme.grassSpacing;
  grassHeightMin = theme.grassHeightMin;
  grassHeightMax = theme.grassHeightMax;

  RAIN.density = theme.rainDensity;
  RAIN.weight = theme.rainWeight;
  RAIN.alpha = theme.rainAlpha;
  RAIN.wind = theme.rainWind;
  RAIN.minSpeed = theme.rainSpeedMin;
  RAIN.maxSpeed = theme.rainSpeedMax;
  RAIN.minLen = theme.rainLenMin;
  RAIN.maxLen = theme.rainLenMax;
  RAIN.splashAlpha = theme.splashAlpha;
  RAIN.splashCount = theme.splashCount;
  RAIN.enabled = theme.rainEnabled !== false;

  SNOW.enabled = Boolean(theme.snowEnabled);
  SNOW.density = theme.snowDensity ?? SNOW.density;
  SNOW.sizeMin = theme.snowSizeMin ?? SNOW.sizeMin;
  SNOW.sizeMax = theme.snowSizeMax ?? SNOW.sizeMax;
  SNOW.speedMin = theme.snowSpeedMin ?? SNOW.speedMin;
  SNOW.speedMax = theme.snowSpeedMax ?? SNOW.speedMax;
  SNOW.drift = theme.snowDrift ?? SNOW.drift;
  SNOW.alpha = theme.snowAlpha ?? SNOW.alpha;
  SNOW.col = theme.snowCol ?? SNOW.col;

  FROST.enabled = Boolean(theme.frostEnabled);
  FROST.density = theme.frostDensity ?? FROST.density;
  FROST.sizeMin = theme.frostSizeMin ?? FROST.sizeMin;
  FROST.sizeMax = theme.frostSizeMax ?? FROST.sizeMax;
  FROST.alphaMin = theme.frostAlphaMin ?? FROST.alphaMin;
  FROST.alphaMax = theme.frostAlphaMax ?? FROST.alphaMax;
  FROST.drift = theme.frostDrift ?? FROST.drift;
  FROST.speedMin = theme.frostSpeedMin ?? FROST.speedMin;
  FROST.speedMax = theme.frostSpeedMax ?? FROST.speedMax;
  FROST.col = theme.frostCol ?? FROST.col;
}

function applyTheme(key, reinit = true) {
  const normalizedKey = String(key || '').toLowerCase();
  const introTermIndex = TERM_YEAR_INDEX[normalizedKey];
  const theme =
    Number.isInteger(introTermIndex)
      ? (() => {
          // Sample intro-season interpolation from each term's exact start position.
          // This keeps Lichun aligned with the spring-start values at progress 0.
          const progress = introTermIndex / TERM_YEAR_SEQUENCE.length;
          const introTheme = createIntroSeasonTheme(progress);
          introTheme.name = TERM_LABELS[normalizedKey] || introTheme.name;
          const clampedIntroTheme = clampThemeToIntroBounds(introTheme);
          // Use a stable intro-derived snapshot envelope for term pages so
          // grass stays within intro-like range without hard clipping.
          let termSnapshotGrowth = clamp(
            (clampedIntroTheme.seasonGrowthTarget ?? 0.25) * 0.56,
            0.08,
            0.62
          );
          let termSnapshotDensity = clamp(
            (clampedIntroTheme.seasonDensityTarget ?? clampedIntroTheme.seasonGrowthTarget ?? 0.25) * 0.62,
            0.2,
            0.74
          );
          const isSpringTerm = introTermIndex >= 0 && introTermIndex < 6;
          const isSummerTerm = introTermIndex >= 6 && introTermIndex < 12;
          const isAutumnTerm = introTermIndex >= 12 && introTermIndex < 18;
          const withinSeason = (introTermIndex % 6) / 5;
          const waveA = (Math.sin((introTermIndex + 1) * 1.87) + 1) * 0.5;
          const waveB = (Math.cos((introTermIndex + 1) * 2.41) + 1) * 0.5;
          const waveMix = waveA * 0.58 + waveB * 0.42;

          if (isSpringTerm) {
            // Spring terms should remain low-profile on detail pages too.
            termSnapshotGrowth = clamp(termSnapshotGrowth * 0.55, 0.06, 0.24);
            termSnapshotDensity = clamp(termSnapshotDensity * 0.88, 0.2, 0.58);
            clampedIntroTheme.growthScale = Math.min(clampedIntroTheme.growthScale ?? 0.28, 0.28);
          } else if (isSummerTerm) {
            // Summer terms were consistently too tall on detail pages; compress
            // their growth envelope to match the intro page visual scale.
            termSnapshotGrowth = clamp(termSnapshotGrowth * 0.45, 0.06, 0.28);
            termSnapshotDensity = clamp(termSnapshotDensity * 0.82, 0.2, 0.56);
            clampedIntroTheme.growthScale = Math.min(clampedIntroTheme.growthScale ?? 0.34, 0.34);
          } else if (isAutumnTerm) {
            // Autumn terms also need to sit in a lower visual band on detail pages.
            termSnapshotGrowth = clamp(termSnapshotGrowth * 0.5, 0.06, 0.24);
            termSnapshotDensity = clamp(termSnapshotDensity * 0.86, 0.2, 0.54);
            clampedIntroTheme.growthScale = Math.min(clampedIntroTheme.growthScale ?? 0.3, 0.3);
          }

          // Add deterministic per-term variation so every term detail page has
          // its own motion/texture while staying inside intro-derived ranges.
          const growthCap = isSpringTerm ? 0.26 : isSummerTerm ? 0.30 : isAutumnTerm ? 0.26 : 0.22;
          const densityCap = isSpringTerm ? 0.60 : isSummerTerm ? 0.60 : isAutumnTerm ? 0.56 : 0.50;
          termSnapshotGrowth = clamp(termSnapshotGrowth * lerpNum(0.92, 1.06, waveA), 0.06, growthCap);
          termSnapshotDensity = clamp(termSnapshotDensity * lerpNum(0.9, 1.08, waveB), 0.2, densityCap);

          clampedIntroTheme.grassSpacing = clamp(
            (clampedIntroTheme.grassSpacing ?? 12) * lerpNum(0.9, 1.15, waveB),
            5.5,
            24
          );
          const spacingCenter = clampedIntroTheme.grassSpacing ?? 12;
          const spacingSpread = lerpNum(2.8, 8.2, waveMix);
          const spacingMin = clamp(
            spacingCenter - spacingSpread * lerpNum(0.92, 1.18, waveB),
            4.5,
            20
          );
          const spacingMax = clamp(
            spacingCenter + spacingSpread * lerpNum(1.0, 1.28, waveA),
            spacingMin + 1.8,
            30
          );
          clampedIntroTheme.fieldSpacingMin = spacingMin;
          clampedIntroTheme.fieldSpacingMax = spacingMax;
          clampedIntroTheme.fieldJitterMax = clamp(
            (clampedIntroTheme.fieldJitterMax ?? 10) * lerpNum(0.74, 1.34, waveMix),
            5,
            18
          );
          clampedIntroTheme.windDryScale = clamp(
            (clampedIntroTheme.windDryScale ?? 1.0) * lerpNum(0.88, 1.2, waveA),
            0.45,
            2.6
          );
          clampedIntroTheme.windWetScale = clamp(
            (clampedIntroTheme.windWetScale ?? 1.05) * lerpNum(0.88, 1.22, waveB),
            0.5,
            2.9
          );
          clampedIntroTheme.windGustChance = clamp(
            (clampedIntroTheme.windGustChance ?? 0.15) * lerpNum(0.78, 1.28, waveMix),
            0.04,
            0.72
          );
          clampedIntroTheme.bendImpulse = clamp(
            (clampedIntroTheme.bendImpulse ?? 0.02) * lerpNum(0.86, 1.18, waveA),
            0.01,
            0.06
          );
          clampedIntroTheme.tickStrength = clamp(
            (clampedIntroTheme.tickStrength ?? 0.4) * lerpNum(0.86, 1.22, waveB),
            0.14,
            1.3
          );
          clampedIntroTheme.branchDrawRatio = clamp(
            (clampedIntroTheme.branchDrawRatio ?? 0.6) * lerpNum(0.82, 1.18, waveMix),
            0.18,
            5
          );
          clampedIntroTheme.branchLengthScale = clamp(
            (clampedIntroTheme.branchLengthScale ?? 0.72) * lerpNum(0.82, 1.22, waveA),
            0.4,
            1.3
          );
          const twigBaseMin = isSummerTerm ? 1 : isAutumnTerm ? 1 : isSpringTerm ? 0 : 0;
          const twigBaseMax = isSummerTerm ? 5 : isAutumnTerm ? 4 : isSpringTerm ? 3 : 2;
          const twigSwing = Math.round(lerpNum(-1, 2, waveMix));
          const twigMin = clamp(twigBaseMin + Math.round(lerpNum(0, 1, waveA)), 0, 4);
          const twigMax = clamp(twigBaseMax + twigSwing, twigMin + 1, 7);
          clampedIntroTheme.branchCountMin = twigMin;
          clampedIntroTheme.branchCountMax = twigMax;
          clampedIntroTheme.interactionChance = clamp(
            (clampedIntroTheme.interactionChance ?? 0.12) * lerpNum(0.72, 1.34, waveB),
            0.04,
            0.46
          );
          clampedIntroTheme.wetGain = clamp(
            (clampedIntroTheme.wetGain ?? 0.06) * lerpNum(0.8, 1.26, waveA),
            0.03,
            0.16
          );
          clampedIntroTheme.dryRate = clamp(
            (clampedIntroTheme.dryRate ?? 0.015) * lerpNum(0.74, 1.32, waveMix),
            0.002,
            0.06
          );
          clampedIntroTheme.targetDecay = clamp(
            (clampedIntroTheme.targetDecay ?? 0.93) * lerpNum(0.985, 1.012, waveB),
            0.9,
            0.97
          );

          const gustMin = clamp(
            (clampedIntroTheme.windGustMin ?? 0.004) * lerpNum(0.8, 1.32, waveA),
            0.002,
            0.03
          );
          const gustMax = clamp(
            (clampedIntroTheme.windGustMax ?? 0.012) * lerpNum(0.82, 1.38, waveB),
            gustMin + 0.002,
            0.04
          );
          clampedIntroTheme.windGustMin = gustMin;
          clampedIntroTheme.windGustMax = gustMax;
          clampedIntroTheme.windGustIn = clamp(
            (clampedIntroTheme.windGustIn ?? 1.5) * lerpNum(0.86, 1.24, waveA),
            0.9,
            3.2
          );
          clampedIntroTheme.windGustOut = clamp(
            (clampedIntroTheme.windGustOut ?? 2.0) * lerpNum(0.86, 1.24, waveB),
            1.2,
            3.4
          );
          if ((clampedIntroTheme.rainDensity ?? 0) > 0.02 || (clampedIntroTheme.rainPresenceTarget ?? 0) > 0.02) {
            clampedIntroTheme.rainDensity = clamp(
              (clampedIntroTheme.rainDensity ?? 0) * lerpNum(0.85, 1.2, waveA),
              0,
              2.3
            );
            clampedIntroTheme.rainAlpha = clamp(
              (clampedIntroTheme.rainAlpha ?? 0) * lerpNum(0.86, 1.16, waveB),
              0,
              50
            );
            clampedIntroTheme.rainWind = clamp(
              (clampedIntroTheme.rainWind ?? 16) * lerpNum(0.88, 1.14, waveMix),
              8,
              32
            );
            clampedIntroTheme.rainOnMin = clamp(
              (clampedIntroTheme.rainOnMin ?? 1.5) * lerpNum(0.78, 1.24, waveA),
              0.7,
              10
            );
            clampedIntroTheme.rainOnMax = clamp(
              (clampedIntroTheme.rainOnMax ?? 5.0) * lerpNum(0.78, 1.24, waveB),
              clampedIntroTheme.rainOnMin + 0.4,
              16
            );
            clampedIntroTheme.rainOffMin = clamp(
              (clampedIntroTheme.rainOffMin ?? 2.0) * lerpNum(0.78, 1.3, waveB),
              0.8,
              12
            );
            clampedIntroTheme.rainOffMax = clamp(
              (clampedIntroTheme.rainOffMax ?? 6.0) * lerpNum(0.78, 1.3, waveA),
              clampedIntroTheme.rainOffMin + 0.6,
              18
            );
          }

          clampedIntroTheme.termSnapshotGrowth = termSnapshotGrowth;
          clampedIntroTheme.termSnapshotDensity = termSnapshotDensity;

          // Normalize seasonal term pages into the same on-screen window as intro
          // by soft-scaling source blade heights instead of clipping render output.
          const seasonalHardCap = isSpringTerm
            ? lerpNum(0.15, 0.19, waveMix * 0.6 + withinSeason * 0.4)
            : isSummerTerm
              ? lerpNum(0.18, 0.24, waveMix * 0.6 + withinSeason * 0.4)
              : isAutumnTerm
                ? lerpNum(0.14, 0.20, waveMix * 0.6 + withinSeason * 0.4)
                : lerpNum(0.10, 0.16, waveMix * 0.6 + withinSeason * 0.4);
          const viewportHeightCeil = isSpringTerm
            ? lerpNum(0.27, 0.32, waveMix)
            : isSummerTerm
              ? lerpNum(0.32, 0.37, waveMix)
              : isAutumnTerm
                ? lerpNum(0.26, 0.31, waveMix)
                : lerpNum(0.20, 0.28, waveMix);
          const projectedGrowthStretch =
            (1 + termSnapshotGrowth * Math.max(0, clampedIntroTheme.growthScale ?? 0)) * 1.18;
          let introWindowGrassMax = clamp(
            viewportHeightCeil / Math.max(0.001, projectedGrowthStretch),
            0.05,
            clampedIntroTheme.grassHeightMax
          );
          introWindowGrassMax = Math.min(introWindowGrassMax, seasonalHardCap);
          if (clampedIntroTheme.grassHeightMax > introWindowGrassMax) {
            const heightScale = introWindowGrassMax / Math.max(clampedIntroTheme.grassHeightMax, 0.0001);
            clampedIntroTheme.grassHeightMax *= heightScale;
            clampedIntroTheme.grassHeightMin = Math.min(
              clampedIntroTheme.grassHeightMin * heightScale,
              clampedIntroTheme.grassHeightMax * 0.95
            );
          }
          const variedTermTheme = clampThemeToIntroBounds(clampedIntroTheme);
          variedTermTheme.termSnapshotGrowth = termSnapshotGrowth;
          variedTermTheme.termSnapshotDensity = termSnapshotDensity;
          variedTermTheme.branchCountMin = Math.max(0, Math.round(variedTermTheme.branchCountMin ?? twigMin));
          variedTermTheme.branchCountMax = Math.max(
            variedTermTheme.branchCountMin + 1,
            Math.round(variedTermTheme.branchCountMax ?? twigMax)
          );
          return variedTermTheme;
        })()
      : (THEMES[normalizedKey] || THEMES.guyu);
  BACKGROUND_MODE = 'term';
  ACTIVE_THEME = normalizedKey || 'guyu';
  assignTheme(theme);

  if (reinit) {
    initField(false);
    initRain();
    initRainSystem();
    initWindSystem();
    initSnow();
    initFrost();
  }
}

function initField(keepState = false) {
  const densityBoost = THEME.fieldDensityBoost ?? 1;
  const baseCount = Math.floor((width / grassSpacing) * densityBoost);
  const baseY = height * 1;

  const old = blades;
  blades = [];

  const noiseScale = 0.015;
  const jitterMax = THEME.fieldJitterMax ?? 14;
  const spacingMin = THEME.fieldSpacingMin ?? 6;
  const spacingMax = THEME.fieldSpacingMax ?? 26;
  const edgeOverscan = Math.max(24, spacingMax + jitterMax);
  let xCursor = -edgeOverscan;
  const maxBladeCount = Math.ceil(baseCount * 1.8) + 16;

  let i = 0;
  while (xCursor < width + edgeOverscan && i < maxBladeCount) {
    const n = noise(xCursor * noiseScale);
    const spacing = map(n, 0, 1, spacingMin, spacingMax);
    const jitter = random(-jitterMax, jitterMax);
    const x = xCursor + jitter;
    const previousBlade = keepState && old[i] ? old[i] : null;

    blades.push(new Blade({
      x,
      baseY,
      heightSample: previousBlade?.heightSample ?? n,
      heightVariance: previousBlade?.heightVariance ?? random(0.85, 1.15),
      seed: previousBlade?.seed ?? random(1000),
      memWet: previousBlade?.memWet ?? 0,
      state: previousBlade
    }));

    xCursor += spacing;
    i++;
  }
}

function initRainSystem() {
  const theme = THEME;
  rainIntensity = 0;
  const target =
    BACKGROUND_MODE === 'season-loop'
      ? (theme.seasonGrowthTarget ?? 0.2)
      : (theme.termSnapshotGrowth ?? clamp((theme.seasonGrowthTarget ?? 0.2) * 0.56, 0.08, 0.62));
  const densityTarget =
    BACKGROUND_MODE === 'season-loop'
      ? (theme.seasonDensityTarget ?? target)
      : (theme.termSnapshotDensity ?? clamp((theme.seasonDensityTarget ?? target) * 0.62, 0.2, 0.74));
  if (BACKGROUND_MODE !== 'season-loop') {
    growthLevel = target;
    densityLevel = densityTarget;
  } else {
    if (!isFinite(growthLevel) || growthLevel <= 0) {
      growthLevel = target;
    } else {
      growthLevel = growthLevel + (target - growthLevel) * 0.35;
    }
    if (!isFinite(densityLevel) || densityLevel <= 0) {
      densityLevel = densityTarget;
    } else {
      densityLevel = densityLevel + (densityTarget - densityLevel) * 0.35;
    }
  }
  scheduleRainPhase(theme.startWithRain);
}

function scheduleWindGustPhase(on) {
  const theme = THEME;
  windGustOn = on;
  windGustTimer = 0;

  if (on) {
    const gMin = theme.windGustMin ?? 0.004;
    const gMax = theme.windGustMax ?? 0.012;
    windGustTarget = random(gMin, gMax);
    windGustPhaseDuration = random(0.6, 2.2);
  } else {
    windGustTarget = 0;
    windGustPhaseDuration = random(2.4, 7.0);
  }
}

function initWindSystem() {
  windGust = 0;
  windGustTarget = 0;
  scheduleWindGustPhase(false);
}

function startSeasonLoop(durationMs = 160000, forceRecreate = false, restart = false) {
  const previousMode = BACKGROUND_MODE;
  const wasIntroLoopActive =
    previousMode === 'season-loop' &&
    p5Ready &&
    ACTIVE_THEME === 'intro-season-loop' &&
    Number.isFinite(seasonLoopStartMs) &&
    seasonLoopStartMs > 0;

  BACKGROUND_MODE = 'season-loop';
  seasonLoopDurationMs = durationMs;

  if (forceRecreate) {
    teardownTermBgInstance();
  }

  if (!ensureTermBgP5Instance()) {
    pendingMode = 'season-loop';
    pendingThemeKey = null;
    return;
  }

  if (!p5Ready || typeof width === 'undefined' || typeof height === 'undefined') {
    pendingMode = 'season-loop';
    pendingThemeKey = null;
    return;
  }

  if (wasIntroLoopActive && !forceRecreate && !restart) {
    // Keep the current intro loop state when redundant start calls arrive
    // (e.g. StrictMode/dev mount replay), so we avoid visible startup jumps.
    syncTermBgCanvasMount();
    bindPointerInteractions();
    return;
  }

  resetRuntimeState();
  seasonLoopStartMs = getNowMs();
  seasonLoopProgress = 0;
  ACTIVE_THEME = 'intro-season-loop';
  syncTermBgCanvasMount();
  bindPointerInteractions();
  resetPointerInteraction();
  assignTheme(createIntroSeasonLoopRenderTheme(0));
  initField(false);
  initRain();
  initRainSystem();
  initWindSystem();
  initSnow();
  initFrost();
}

function updateSeasonLoopTheme() {
  if (BACKGROUND_MODE !== 'season-loop') return;
  const elapsedMs = getNowMs() - seasonLoopStartMs;
  const loopMs = ((elapsedMs % seasonLoopDurationMs) + seasonLoopDurationMs) % seasonLoopDurationMs;
  seasonLoopProgress = loopMs / seasonLoopDurationMs;
  assignTheme(createIntroSeasonLoopRenderTheme(seasonLoopProgress));
}

function syncParticleCounts() {
  const rainTarget = RAIN.enabled
    ? Math.floor(constrain((width * height) / 9000, 80, 220) * RAIN.density)
    : 0;
  while (drops.length < rainTarget) {
    drops.push(new RainDrop(true));
  }
  if (drops.length > rainTarget) {
    drops.length = rainTarget;
  }

  const snowTarget = SNOW.enabled
    ? Math.floor(constrain((width * height) / 18000, 80, 220) * SNOW.density)
    : 0;
  while (flakes.length < snowTarget) {
    flakes.push(new SnowFlake(true));
  }
  if (flakes.length > snowTarget) {
    flakes.length = snowTarget;
  }

  const frostTarget = FROST.enabled
    ? Math.floor(constrain((width * height) / 22000, 90, 260) * FROST.density)
    : 0;
  while (frost.length < frostTarget) {
    frost.push(new FrostSpeck(true));
  }
  if (frost.length > frostTarget) {
    frost.length = frostTarget;
  }
}

function scheduleRainPhase(on) {
  const theme = THEME;
  rainOn = on;
  rainTimer = 0;
  rainPhaseDuration = random(
    on ? theme.rainOnMin : theme.rainOffMin,
    on ? theme.rainOnMax : theme.rainOffMax
  );
  if (on) {
    generateRainPatches();
  } else {
    rainPatches = [];
  }
}

function generateRainPatches() {
  const theme = THEME;
  rainPatches = [];
  for (let i = 0; i < theme.rainPatchCount; i++) {
    const r = random(width * theme.rainPatchRadiusMin, width * theme.rainPatchRadiusMax);
    const x = random(r, width - r);
    rainPatches.push({ x, r });
  }
}

function updateRainSystem(dt) {
  const theme = THEME;
  rainTimer += dt;
  if (rainTimer >= rainPhaseDuration) {
    scheduleRainPhase(!rainOn);
  }

  let target = rainOn ? 1 : 0;
  if (BACKGROUND_MODE === 'season-loop') {
    target = max(target, theme.rainPresenceTarget ?? 0);
  }
  const speed = rainOn ? theme.rainFadeIn : theme.rainFadeOut;
  const step = min(1, dt * speed);
  rainIntensity += (target - rainIntensity) * step;
}

function updateWindSystem(dt) {
  const theme = THEME;
  windGustTimer += dt;

  if (windGustTimer >= windGustPhaseDuration) {
    const chance = constrain(theme.windGustChance ?? 0.15, 0, 0.95);
    const shouldGust = random() < chance;
    scheduleWindGustPhase(shouldGust);
  }

  const inRate = theme.windGustIn ?? 1.4;
  const outRate = theme.windGustOut ?? 2.0;
  const ease = min(1, dt * (windGustOn ? inRate : outRate));
  windGust += (windGustTarget - windGust) * ease;
}

function updateGrowth(dt) {
  const theme = THEME;
  const seasonalTarget = theme.seasonGrowthTarget ?? 0.25;
  const seasonalPull = theme.seasonGrowthPull ?? 0.32;
  growthLevel += (seasonalTarget - growthLevel) * min(1, dt * seasonalPull);

  const densityTarget = theme.seasonDensityTarget ?? seasonalTarget;
  const densityPull = theme.seasonDensityPull ?? seasonalPull;
  densityLevel += (densityTarget - densityLevel) * min(1, dt * densityPull);

  if (BACKGROUND_MODE !== 'season-loop') {
    const fixedGrowth = theme.termSnapshotGrowth ?? clamp(seasonalTarget * 0.56, 0.08, 0.62);
    const fixedDensity = theme.termSnapshotDensity ?? clamp(densityTarget * 0.62, 0.2, 0.74);
    growthLevel += (fixedGrowth - growthLevel) * min(1, dt * 1.4);
    densityLevel += (fixedDensity - densityLevel) * min(1, dt * 1.25);
    growthLevel = clamp(growthLevel, Math.max(0, fixedGrowth - 0.02), Math.min(1, fixedGrowth + 0.02));
    densityLevel = clamp(densityLevel, Math.max(0, fixedDensity - 0.03), Math.min(1, fixedDensity + 0.03));
    return;
  }

  if (theme.growthRate > 0) {
    const grow = theme.growthRate * dt * max(0, rainIntensity);
    growthLevel = constrain(growthLevel + grow, 0, 1);
    growthLevel = max(0, growthLevel - theme.growthDecay * dt);
  } else {
    growthLevel = max(0, growthLevel - theme.growthDecay * dt);
  }

  if ((theme.densityGrowthRate ?? 0) > 0) {
    const densityGrow = (theme.densityGrowthRate ?? 0) * dt * max(0.18, rainIntensity);
    densityLevel = constrain(densityLevel + densityGrow, 0, 1);
  }
  densityLevel = max(0, densityLevel - (theme.densityDecay ?? 0.01) * dt * (1 - rainIntensity * 0.5));
}

function getRainSpawnX() {
  // In intro season-loop summers, keep rainfall distributed across the full viewport
  // instead of concentrating in narrow vertical patch bands.
  if (BACKGROUND_MODE === 'season-loop' && (THEME.rainPresenceTarget ?? 0) >= 0.55) {
    return random(-20, width + 20);
  }
  if (!rainPatches.length) return random(-20, width + 20);
  const p = random(rainPatches);
  return p.x + random(-p.r, p.r);
}

function initRain() {
  drops = [];
  splashes = [];
  const baseCount = Math.floor(constrain((width * height) / 9000, 80, 220) * RAIN.density);
  for (let i = 0; i < baseCount; i++) {
    drops.push(new RainDrop(true));
  }
}

function initSnow() {
  flakes = [];
  if (!SNOW.enabled) return;
  const baseCount = Math.floor(constrain((width * height) / 18000, 80, 220) * SNOW.density);
  for (let i = 0; i < baseCount; i++) {
    flakes.push(new SnowFlake(true));
  }
}

function addSnowSettled(x, y, r) {
  const limit = 520;
  snowSettled.push({ x, y, r });
  if (snowSettled.length > limit) {
    snowSettled.shift();
  }
}

function drawSnowSettled() {
  if (!snowSettled.length) return;
  const col = color(SNOW.col.r, SNOW.col.g, SNOW.col.b);
  col.setAlpha(min(200, SNOW.alpha + 40));
  noStroke();
  fill(col);
  for (const dot of snowSettled) {
    circle(dot.x, dot.y, dot.r * 1.4);
  }
}

function initFrost() {
  frost = [];
  if (!FROST.enabled) return;
  const baseCount = Math.floor(constrain((width * height) / 22000, 90, 260) * FROST.density);
  for (let i = 0; i < baseCount; i++) {
    frost.push(new FrostSpeck(true));
  }
}

class SnowFlake {
  constructor(randomizeY = false) {
    this.reset(randomizeY);
  }

  reset(randomizeY = false) {
    this.x = random(-40, width + 40);
    this.y = randomizeY ? random(-height, height) : random(-height, -20);
    this.r = random(SNOW.sizeMin, SNOW.sizeMax);
    this.speed = random(SNOW.speedMin, SNOW.speedMax);
    this.drift = random(-SNOW.drift, SNOW.drift);
    this.phase = random(TWO_PI);
  }

  update(dt) {
    this.phase += dt * 0.8;
    const sway = sin(this.phase) * SNOW.drift * 0.12;
    this.x += (this.drift + sway) * dt;
    this.y += this.speed * dt;

    if (SNOW.enabled && blades.length && this.y > height * 0.76) {
      let nearest = null;
      let bestDx = 9999;
      for (const b of blades) {
        const dx = abs(this.x - b.x);
        if (dx < bestDx) {
          bestDx = dx;
          nearest = b;
        }
      }
      if (nearest && bestDx < 10) {
        const tipY = nearest.baseY - nearest.getRenderHeight(THEME);
        const settleY = constrain(this.y, tipY - 2, nearest.baseY);
        addSnowSettled(nearest.x + random(-2, 2), settleY + random(-1, 1), this.r);
        this.reset(false);
        return;
      }
    }

    if (this.y > height + 24 || this.x < -60 || this.x > width + 60) {
      this.reset(false);
    }
  }

  draw() {
    const snowCol = color(SNOW.col.r, SNOW.col.g, SNOW.col.b);
    snowCol.setAlpha(SNOW.alpha);
    noStroke();
    fill(snowCol);
    circle(this.x, this.y, this.r * 2);
  }
}

class FrostSpeck {
  constructor(randomizeY = false) {
    this.reset(randomizeY);
  }

  reset(randomizeY = false) {
    this.x = random(-60, width + 60);
    this.y = randomizeY ? random(0, height * 0.85) : random(-20, height * 0.85);
    this.r = random(FROST.sizeMin, FROST.sizeMax);
    this.baseAlpha = random(FROST.alphaMin, FROST.alphaMax);
    this.speed = random(FROST.speedMin, FROST.speedMax);
    this.drift = random(-FROST.drift, FROST.drift);
    this.phase = random(TWO_PI);
  }

  update(dt) {
    this.phase += dt * this.speed;
    const shimmer = sin(this.phase) * FROST.drift * 0.06;
    this.x += (this.drift + shimmer) * dt;

    if (this.x < -80 || this.x > width + 80) {
      this.reset(false);
    }
  }

  draw() {
    const alpha = this.baseAlpha;
    const frostCol = color(FROST.col.r, FROST.col.g, FROST.col.b);
    frostCol.setAlpha(alpha);
    stroke(frostCol);
    strokeWeight(1);
    point(this.x, this.y);
  }
}

class RainDrop {
  constructor(randomizeY = false) {
    this.reset(randomizeY);
  }

  reset(randomizeY = false) {
    this.x = getRainSpawnX();
    this.y = randomizeY ? random(-height, height) : random(-height, -20);
    this.len = random(RAIN.minLen, RAIN.maxLen);
    this.speed = random(RAIN.minSpeed, RAIN.maxSpeed);
    this.vx = random(-RAIN.wind, RAIN.wind);
  }

  update(dt) {
    this.x += (this.vx + windGust * 950) * dt;
    this.y += this.speed * dt;

    if (this.y > height + this.len || this.x < -40 || this.x > width + 40) {
      this.reset(false);
    }
  }

  draw() {
    line(this.x, this.y, this.x + this.vx * 0.035, this.y + this.len);
  }
}

class RainSplash {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const ang = -HALF_PI + random(-0.9, 0.9);
    const spd = random(140, 240);
    this.vx = cos(ang) * spd;
    this.vy = sin(ang) * spd;
    this.len = random(6, 12);
    this.age = 0;
    this.life = random(0.16, 0.28);
  }

  update(dt) {
    this.age += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 520 * dt;
  }

  draw() {
    const fade = 1 - this.age / this.life;
    if (fade <= 0) return;
    const splashCol = color(RAIN_COL);
    splashCol.setAlpha(RAIN.splashAlpha * fade);
    stroke(splashCol);
    line(this.x, this.y, this.x + this.vx * 0.03, this.y + this.vy * 0.03 + this.len);
  }
}

function interactWithGrass(drop) {
  if (!blades.length) return;
  const theme = THEME;
  if (random() > theme.interactionChance) return;

  const bandTop = height * 0.75;
  if (drop.y < bandTop || drop.y > height) return;

  let nearest = null;
  let bestDx = 9999;
  for (const b of blades) {
    const dx = abs(drop.x - b.x);
    if (dx < bestDx) {
      bestDx = dx;
      nearest = b;
    }
  }

  if (!nearest || bestDx > 30) return;

  const sideToCenter = drop.x < width * 0.5 ? 1 : -1;
  const dir = sideToCenter * (-theme.directionBias);
  nearest.addTarget(theme.bendImpulse * dir);
  nearest.triggerTick(theme.tickStrength);
  nearest.memWet = min(1, nearest.memWet + theme.wetGain);

  for (let i = 0; i < RAIN.splashCount; i++) {
    splashes.push(new RainSplash(drop.x, drop.y));
  }
  drop.reset(false);
  return true;
}

function drawRain(dt) {
  if (!RAIN.enabled) return;
  if (rainIntensity < 0.02) {
    for (const d of drops) {
      d.update(dt);
    }
  }
  const rainCol = color(RAIN_COL);
  rainCol.setAlpha(RAIN.alpha * rainIntensity);
  stroke(rainCol);
  strokeWeight(RAIN.weight);
  if (rainIntensity >= 0.02) {
    for (const d of drops) {
      d.update(dt);
      const hit = rainIntensity > 0.12 ? interactWithGrass(d) : false;
      if (hit) continue;
      d.draw();
    }
  }

  for (let i = splashes.length - 1; i >= 0; i--) {
    const s = splashes[i];
    s.update(dt);
    if (s.age > s.life) {
      splashes.splice(i, 1);
      continue;
    }
    s.draw();
  }
}

function getGrassHeightReference() {
  const viewportHeight = Number.isFinite(height) && height > 0 ? height : getViewportSize().height;
  if (BACKGROUND_MODE === 'season-loop' || ACTIVE_THEME === 'intro-season-loop') {
    return Math.min(viewportHeight, 920);
  }
  return viewportHeight;
}

class Blade {
  constructor({ x, baseY, heightSample, heightVariance = 1, seed, memWet = 0, state = null }) {
    this.x = x;
    this.baseY = baseY;
    this.heightSample = clamp(heightSample ?? 0.5, 0, 1);
    this.heightVariance = clamp(heightVariance, 0.7, 1.3);
    this.seed = seed;

    this.baseTilt = state?.baseTilt ?? random(-0.25, 0.25);
    this.bend = state?.bend ?? random(-0.03, 0.03);
    this.targetBend = 0;
    this.v = 0;
    this.memWet = memWet;
    this.tick = 0;
    this.tickVel = 0;
    this.lastTickAt = -9999;
    this.emergeAt = state?.emergeAt ?? random();
    this.pressAmount = 0;

    this.densityBias = state?.densityBias ?? random(0.88, 1.18);

    if (state?.branches?.length) {
      this.branches = state.branches.map((branch) => ({
        t: branch.t,
        side: branch.side,
        lenRatio: branch.lenRatio ?? branch.len ?? 0.11,
        bias: branch.bias,
        vitality: branch.vitality
      }));
      return;
    }

    this.branches = [];
    const theme = THEME;
    const minBranches = Math.max(0, floor(theme.branchCountMin ?? 1));
    const maxBranches = Math.max(minBranches + 1, floor(theme.branchCountMax ?? 4));
    const nBranches = floor(random(minBranches, maxBranches + 1));
    for (let i = 0; i < nBranches; i++) {
      const t = random(0.35, 0.85);
      const side = random() < 0.5 ? -1 : 1;
      const lenRatio = random(0.07, 0.16);
      const bias = random(0.10, 0.28);
      const vitality = random();
      this.branches.push({ t, side, lenRatio, bias, vitality });
    }
  }

  addTarget(delta) {
    this.targetBend += delta;
  }

  triggerTick(strength = 1) {
    if (millis() - this.lastTickAt < 420) return;
    this.lastTickAt = millis();
    this.tickVel += 0.22 * strength;
  }

  press(amount = 0.35) {
    this.pressAmount = Math.max(this.pressAmount, clamp(amount, 0, 0.92));
  }

  getDensityEase() {
    const densityPhase = constrain((densityLevel * this.densityBias - this.emergeAt) / 0.16, 0, 1);
    return densityPhase * densityPhase * (3 - 2 * densityPhase);
  }

  getStemBaseHeight(theme) {
    const referenceHeight = getGrassHeightReference();
    return map(
      this.heightSample,
      0,
      1,
      referenceHeight * theme.grassHeightMin,
      referenceHeight * theme.grassHeightMax
    ) * this.heightVariance;
  }

  getRenderHeight(theme, densityEase = this.getDensityEase()) {
    const wet = constrain(this.memWet, 0, 1);
    const growthFactor = (1 + growthLevel * theme.growthScale) * lerp(0.22, 1, densityEase);
    const wetFactor = 1 - wet * theme.wetDroop;
    const pressFactor = 1 - smoothstep(0, 0.92, this.pressAmount) * 0.44;
    return max(6, this.getStemBaseHeight(theme) * growthFactor * wetFactor * pressFactor);
  }

  update(dt, wind, theme) {
    this.targetBend += wind;

    const wet = constrain(this.memWet, 0, 1);
    const stiffness = lerp(theme.stiffnessDry, theme.stiffnessWet, wet);
    const damping = lerp(theme.dampingDry, theme.dampingWet, wet);

    const a = stiffness * (this.targetBend - this.bend) - damping * this.v;
    this.v += a * dt;
    this.bend += this.v * dt;

    this.targetBend *= theme.targetDecay;

    const tickStiff = 22.0;
    const tickDamp = 9.5;
    const tickA = tickStiff * (0 - this.tick) - tickDamp * this.tickVel;
    this.tickVel += tickA * dt;
    this.tick += this.tickVel * dt;

    this.memWet = max(0, this.memWet - dt * theme.dryRate);
    this.pressAmount = max(0, this.pressAmount - dt * 0.62);
  }

  draw() {
    const theme = THEME;
    const wet = constrain(this.memWet, 0, 1);
    const densityEase = this.getDensityEase();
    if (densityEase <= 0.01) return;
    const alpha = lerp(92, 130, wet) * densityEase;
    const growthFactor = (1 + growthLevel * theme.growthScale) * lerp(0.22, 1, densityEase);
    const wetFactor = 1 - wet * theme.wetDroop;
    const h = this.getRenderHeight(theme, densityEase);

    const inkCol = color(INK.r, INK.g, INK.b);
    const greenCol = color(GRASS_COL);
    const mixCol = lerpColor(inkCol, greenCol, GRASS_MIX);
    const darkCol = lerpColor(mixCol, color('#2E8B57'), wet * 0.85);
    darkCol.setAlpha(alpha);
    stroke(darkCol);
    strokeWeight(1.2 + densityEase * 0.9);

    const bendAmt = this.bend + this.baseTilt;
    const tickAmt = this.tick * 0.06;

    const base = { x: this.x, y: this.baseY };

    const tip = {
      x: this.x + sin(bendAmt + tickAmt * 0.3) * (h * 0.38),
      y: this.baseY - h
    };

    const midT = 0.55;
    const mid = {
      x: lerp(base.x, tip.x, midT),
      y: lerp(base.y, tip.y, midT)
    };

    line(base.x, base.y, mid.x, mid.y);
    line(mid.x, mid.y, tip.x, tip.y);

    if (wet > 0.08) {
      const baseBandA = theme.baseBandA * wet;
      const bandCol = lerpColor(color(INK.r, INK.g, INK.b), color(GRASS_COL), GRASS_MIX);
      bandCol.setAlpha(baseBandA);
      stroke(bandCol);
      line(base.x, base.y, base.x, base.y - h * 0.12);
      const mixColRestore = lerpColor(color(INK.r, INK.g, INK.b), color(GRASS_COL), GRASS_MIX);
      const darkRestore = lerpColor(mixColRestore, color('#2E8B57'), wet * 0.85);
      darkRestore.setAlpha(alpha);
      stroke(darkRestore);
    }

    const pointOnStem = (t) => {
      if (t <= midT) {
        const u = t / midT;
        return {
          x: lerp(base.x, mid.x, u),
          y: lerp(base.y, mid.y, u),
          k: lerp(0.25, 0.65, u)
        };
      }
      const u = (t - midT) / (1 - midT);
      return {
        x: lerp(mid.x, tip.x, u),
        y: lerp(mid.y, tip.y, u),
        k: lerp(0.65, 1.0, u)
      };
    };

    const branchDrawRatio = constrain(theme.branchDrawRatio ?? 1, 0, 1);
    const branchLengthScale = max(0.35, theme.branchLengthScale ?? 1);

    for (const br of this.branches) {
      if (densityEase < 0.24 || br.vitality > branchDrawRatio) continue;
      const p = pointOnStem(br.t);
      const ang = (bendAmt * p.k) + br.side * br.bias;
      const droop = wet * 0.10;
      const vitalityScale = lerp(0.85, 1.0, 1 - br.vitality * 0.45);
      const brLen = br.lenRatio * h * branchLengthScale * vitalityScale;
      const bx = p.x + sin(ang) * brLen;
      const by = p.y - cos(ang) * brLen + droop * brLen;
      line(p.x, p.y, bx, by);
    }

    if (SNOW.enabled && snowCover > 0.02) {
      const capCol = color(240, 242, 244);
      capCol.setAlpha(120 * snowCover);
      stroke(capCol);
      strokeWeight(2);
      const capP = pointOnStem(0.78);
      const capLen = 2.5 + snowCover * 2.2;
      line(capP.x - capLen, capP.y + 1, capP.x + capLen, capP.y + 1);
      strokeWeight(2.6);
      point(tip.x, tip.y + 1);
    }
  }
}

let tPrev = 0;

function draw() {
  updateSeasonLoopTheme();
  background(BG.r, BG.g, BG.b);

  const t = millis() * 0.001;
  const dt = min(0.033, max(0.001, t - tPrev));
  tPrev = t;
  const theme = THEME;
  syncParticleCounts();

  updateRainSystem(dt);
  updateWindSystem(dt);
  updateGrowth(dt);
  updatePointerInteraction(dt);
  if (SNOW.enabled) {
    snowCover = min(1, snowCover + dt * 0.015);
  } else {
    snowCover = max(0, snowCover - dt * 0.02);
  }

  const baseWind = (noise(t * 0.12) - 0.5) * 0.010 + windGust;

  for (const b of blades) {
    const n1 = noise(b.seed * 0.01, t * 0.45) - 0.5;
    const n2 = noise(b.x * 0.004, t * 1.8) - 0.5;
    const pointerWind = getPointerWindForBlade(b, theme);
    const localWind = baseWind + n1 * 0.020 + n2 * 0.006 + pointerWind;
    const windScale = lerp(theme.windDryScale, theme.windWetScale, b.memWet);

    b.update(dt, localWind * windScale, theme);
    b.draw();
  }

  drawSnowSettled();
  drawRain(dt);

  if (SNOW.enabled) {
    for (const flake of flakes) {
      flake.update(dt);
      flake.draw();
    }
  }

  if (FROST.enabled) {
    push();
    blendMode(ADD);
    for (const speck of frost) {
      speck.update(dt);
      speck.draw();
    }
    blendMode(BLEND);
    pop();
  }
}

function smoothstep(edge0, edge1, x) {
  const tt = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return tt * tt * (3 - 2 * tt);
}

window.__termBgApplyTheme = (key) => {
  if (!key) return;
  const normalizedKey = String(key).toLowerCase();
  window.__TERM_ID__ = normalizedKey;
  pendingMode = null;
  if (!ensureTermBgP5Instance()) {
    BACKGROUND_MODE = 'term';
    ACTIVE_THEME = normalizedKey;
    applyTheme(normalizedKey, false);
    pendingThemeKey = normalizedKey;
    return;
  }
  if (!p5Ready || typeof width === 'undefined' || typeof height === 'undefined') {
    BACKGROUND_MODE = 'term';
    pendingThemeKey = normalizedKey;
    return;
  }
  syncTermBgCanvasMount();
  applyTheme(normalizedKey, true);
};

window.__termBgStartSeasonLoop = (options = {}) => {
  const durationMs = options.durationMs ?? 160000;
  const forceRecreate = options.forceRecreate === true;
  const restart = options.restart === true;
  pendingThemeKey = null;
  startSeasonLoop(durationMs, forceRecreate, restart);
};

window.__termBgPointerMove = (point) => {
  if (!p5Ready) return;
  handlePointerMove(point);
};

window.__termBgPointerDown = (point) => {
  if (!p5Ready) return;
  handlePointerDown(point);
};

window.__termBgPointerLeave = () => {
  handlePointerReset();
};

window.__termBgDispose = () => {
  BACKGROUND_MODE = 'term';
  teardownTermBgInstance();
};
