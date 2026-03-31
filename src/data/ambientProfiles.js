import { TERM_LIST } from './termsData';

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const DEFAULT_SOUND = {
  pace: 0.34,
  richness: 0.4,
  sustain: 0.66,
  motion: 0.34,
  density: 0.34,
  brightness: 0.48,
  warmth: 0.48,
  texture: 0.34,
  reverb: 0.36,
  topRegister: 0.44,
  droneSet: [0, 3],
  droneColor: [1, 4],
  midWeights: [0.86, 0.52, 0.42, 0.58, 0.32],
  topWeights: [0.14, 0.16, 0.14, 0.18, 0.12]
};

const tuneWeights = (weights = [], emphasis = []) => (
  weights.map((weight, index) => Math.max(0.01, (weight ?? 0) * (emphasis[index] ?? 1)))
);

const tuneSoundProfile = (sound) => ({
  ...sound,
  sustain: clamp01((sound.sustain * 0.52) + 0.24),
  motion: clamp01(sound.motion + 0.16 + ((1 - sound.sustain) * 0.05)),
  density: clamp01(sound.density + 0.04),
  richness: clamp01(sound.richness + 0.08 + (sound.motion * 0.04)),
  brightness: clamp01(sound.brightness + 0.1 + (sound.topRegister * 0.06)),
  warmth: clamp01(sound.warmth - 0.04 + (sound.brightness * 0.02)),
  texture: clamp01(sound.texture + 0.04),
  reverb: clamp01(sound.reverb + 0.05),
  topRegister: clamp01(sound.topRegister + 0.18 + (sound.motion * 0.04)),
  midWeights: tuneWeights(sound.midWeights, [0.82, 1, 1.08, 1.14, 1.08]),
  topWeights: tuneWeights(sound.topWeights, [0.72, 0.96, 1.1, 1.16, 1.12])
});

const createProfile = (profile) => ({
  ...profile,
  sound: {
    ...tuneSoundProfile({
      ...DEFAULT_SOUND,
      ...(profile.sound || {})
    })
  }
});

export const AMBIENT_NOTE_WORLD = {
  name: 'D suspended pentatonic',
  center: 'D',
  notes: ['D', 'E', 'G', 'A', 'C'],
  lowMidi: [38, 40, 43, 45, 48],
  midMidi: [50, 52, 55, 57, 60],
  highMidi: [62, 64, 67, 69, 72]
};

const NOTE_INDEX_BY_NAME = Object.fromEntries(
  AMBIENT_NOTE_WORLD.notes.map((note, index) => [note, index])
);

const createTermNoteIdentity = (notes = []) => ({
  notes: [...notes],
  noteIndices: notes
    .map((note) => NOTE_INDEX_BY_NAME[note])
    .filter((index) => Number.isInteger(index))
});

export const TERM_NOTE_IDENTITY_MAP = {
  dongzhi: createTermNoteIdentity(['C', 'D']),
  xiaohan: createTermNoteIdentity(['D']),
  dahan: createTermNoteIdentity(['D', 'E']),
  lichun: createTermNoteIdentity(['E']),
  yushui: createTermNoteIdentity(['E', 'G']),
  jingzhe: createTermNoteIdentity(['G']),
  chunfen: createTermNoteIdentity(['G', 'A']),
  qingming: createTermNoteIdentity(['G', 'A']),
  guyu: createTermNoteIdentity(['A']),
  lixia: createTermNoteIdentity(['A', 'C']),
  xiaoman: createTermNoteIdentity(['A', 'C']),
  mangzhong: createTermNoteIdentity(['C']),
  xiazhi: createTermNoteIdentity(['C', 'A']),
  xiaoshu: createTermNoteIdentity(['C', 'A']),
  dashu: createTermNoteIdentity(['A']),
  liqiu: createTermNoteIdentity(['A', 'G']),
  chushu: createTermNoteIdentity(['G']),
  bailu: createTermNoteIdentity(['G', 'E']),
  qiufen: createTermNoteIdentity(['E']),
  hanlu: createTermNoteIdentity(['E', 'D']),
  shuangjiang: createTermNoteIdentity(['D']),
  lidong: createTermNoteIdentity(['D', 'C']),
  xiaoxue: createTermNoteIdentity(['D', 'C']),
  daxue: createTermNoteIdentity(['C'])
};

export const getTermNoteIdentity = (termId) => (
  TERM_NOTE_IDENTITY_MAP[termId] || TERM_NOTE_IDENTITY_MAP.dongzhi
);

export const TERM_AMBIENT_PROFILES = {
  dongzhi: createProfile({
    mood: 'deep stillness with a hidden upward pull',
    pacing: 'very slow, almost tide-like',
    harmonicRichness: 'spare core with a faint upper bloom',
    sustainedVsShort: 'nearly all sustain, with very rare plucked traces',
    motionCharacter: 'inward and glacial',
    density: 'thin center with a soft halo',
    brightness: 'dim silver',
    warmth: 'cool surface with a warm root',
    textureAmount: 'fine frost grain',
    sound: {
      pace: 0.12,
      richness: 0.18,
      sustain: 0.95,
      motion: 0.1,
      density: 0.16,
      brightness: 0.18,
      warmth: 0.7,
      texture: 0.22,
      reverb: 0.24,
      topRegister: 0.18,
      droneSet: [0, 3],
      droneColor: [4, 1],
      midWeights: [1, 0.22, 0.16, 0.64, 0.28],
      topWeights: [0.18, 0.06, 0.04, 0.1, 0.14]
    }
  }),
  xiaohan: createProfile({
    mood: 'cold clarity with faint crystalline lift',
    pacing: 'very slow, but a touch more alert',
    harmonicRichness: 'lean with tiny glints around the edges',
    sustainedVsShort: 'mostly drone and field, with occasional light taps',
    motionCharacter: 'measured and glassy',
    density: 'narrow and lightly spread',
    brightness: 'pale blue-grey',
    warmth: 'low warmth held under the ice',
    textureAmount: 'slightly more granular than Dongzhi',
    sound: {
      pace: 0.14,
      richness: 0.2,
      sustain: 0.94,
      motion: 0.12,
      density: 0.18,
      brightness: 0.24,
      warmth: 0.58,
      texture: 0.28,
      reverb: 0.28,
      topRegister: 0.22,
      droneSet: [0, 1],
      droneColor: [3, 4],
      midWeights: [1, 0.34, 0.18, 0.5, 0.32],
      topWeights: [0.22, 0.1, 0.04, 0.08, 0.18]
    }
  }),
  dahan: createProfile({
    mood: 'winter at maximum depth',
    pacing: 'the slowest point of the cycle',
    harmonicRichness: 'very spare, almost monastic',
    sustainedVsShort: 'sustain-dominant with almost no upper punctuation',
    motionCharacter: 'nearly motionless',
    density: 'minimal and compressed',
    brightness: 'shadowed blue',
    warmth: 'dark low warmth, little surface glow',
    textureAmount: 'smooth and nearly textureless',
    sound: {
      pace: 0.1,
      richness: 0.15,
      sustain: 0.97,
      motion: 0.08,
      density: 0.12,
      brightness: 0.15,
      warmth: 0.64,
      texture: 0.18,
      reverb: 0.2,
      topRegister: 0.16,
      droneSet: [0, 4],
      droneColor: [3, 1],
      midWeights: [1, 0.14, 0.08, 0.42, 0.22],
      topWeights: [0.12, 0.04, 0.02, 0.06, 0.1]
    }
  }),
  lichun: createProfile({
    mood: 'first release in the ground',
    pacing: 'slow, but no longer fixed in place',
    harmonicRichness: 'lean and opening',
    sustainedVsShort: 'long tones with a few awakening touches',
    motionCharacter: 'gentle stirring',
    density: 'light overlap with more air than mass',
    brightness: 'muted dawn light',
    warmth: 'soft warmth returning from below',
    textureAmount: 'delicate thaw grain',
    sound: {
      pace: 0.22,
      richness: 0.26,
      sustain: 0.9,
      motion: 0.18,
      density: 0.22,
      brightness: 0.32,
      warmth: 0.62,
      texture: 0.28,
      reverb: 0.3,
      topRegister: 0.26,
      droneSet: [0, 1],
      droneColor: [3, 2],
      midWeights: [1, 0.48, 0.22, 0.44, 0.16],
      topWeights: [0.2, 0.16, 0.06, 0.08, 0.04]
    }
  }),
  yushui: createProfile({
    mood: 'moist air and softened ground',
    pacing: 'slow with more fluid breathing',
    harmonicRichness: 'slightly fuller, blurred at the edges',
    sustainedVsShort: 'sustain-led with dew-like upper drops',
    motionCharacter: 'drifting and rain-fed',
    density: 'light but more connected',
    brightness: 'wet overcast light',
    warmth: 'neutral-cool with soft inner warmth',
    textureAmount: 'mist and rainfall residue',
    sound: {
      pace: 0.26,
      richness: 0.3,
      sustain: 0.88,
      motion: 0.22,
      density: 0.28,
      brightness: 0.38,
      warmth: 0.6,
      texture: 0.36,
      reverb: 0.34,
      topRegister: 0.28,
      droneSet: [0, 1],
      droneColor: [2, 4],
      midWeights: [1, 0.6, 0.34, 0.36, 0.24],
      topWeights: [0.18, 0.24, 0.1, 0.08, 0.12]
    }
  }),
  jingzhe: createProfile({
    mood: 'latent movement under the soil',
    pacing: 'still measured, but clearly more active',
    harmonicRichness: 'more branching inner tones',
    sustainedVsShort: 'drone-first, with clearer plucked awakenings',
    motionCharacter: 'stirring and lightly percussive',
    density: 'moderate overlap',
    brightness: 'fresh green light',
    warmth: 'balanced, neither cold nor lush',
    textureAmount: 'living grain and soft friction',
    sound: {
      pace: 0.32,
      richness: 0.36,
      sustain: 0.84,
      motion: 0.3,
      density: 0.34,
      brightness: 0.45,
      warmth: 0.56,
      texture: 0.4,
      reverb: 0.36,
      topRegister: 0.34,
      droneSet: [0, 2],
      droneColor: [1, 3],
      midWeights: [1, 0.54, 0.46, 0.34, 0.16],
      topWeights: [0.2, 0.24, 0.16, 0.1, 0.08]
    }
  }),
  chunfen: createProfile({
    mood: 'poised balance and open breath',
    pacing: 'steady, even, and unhurried',
    harmonicRichness: 'clear open intervals with balanced color tones',
    sustainedVsShort: 'mostly sustained, with subtle upper punctuation',
    motionCharacter: 'equipoised and circular',
    density: 'moderate and centered',
    brightness: 'clear daylight',
    warmth: 'neutral balance',
    textureAmount: 'softly luminous',
    sound: {
      pace: 0.36,
      richness: 0.42,
      sustain: 0.8,
      motion: 0.34,
      density: 0.42,
      brightness: 0.5,
      warmth: 0.54,
      texture: 0.42,
      reverb: 0.38,
      topRegister: 0.38,
      droneSet: [0, 3],
      droneColor: [2, 4],
      midWeights: [1, 0.46, 0.54, 0.52, 0.28],
      topWeights: [0.18, 0.2, 0.16, 0.18, 0.12]
    }
  }),
  qingming: createProfile({
    mood: 'lucid air after rain',
    pacing: 'moderate, with long clear fades',
    harmonicRichness: 'open and airy with more upper bloom',
    sustainedVsShort: 'sustains remain primary, plucks become more visible',
    motionCharacter: 'lightly gliding and transparent',
    density: 'moderate, lifted upward',
    brightness: 'bright but not sharp',
    warmth: 'cool-leaning with soft body',
    textureAmount: 'clean atmosphere with fine shimmer',
    sound: {
      pace: 0.38,
      richness: 0.46,
      sustain: 0.78,
      motion: 0.36,
      density: 0.44,
      brightness: 0.6,
      warmth: 0.48,
      texture: 0.46,
      reverb: 0.42,
      topRegister: 0.44,
      droneSet: [0, 2],
      droneColor: [1, 4],
      midWeights: [1, 0.52, 0.44, 0.42, 0.38],
      topWeights: [0.2, 0.18, 0.22, 0.16, 0.14]
    }
  }),
  guyu: createProfile({
    mood: 'growth fully supported by rain',
    pacing: 'moderate with rounded movement',
    harmonicRichness: 'fuller and more nourishing',
    sustainedVsShort: 'steady field with gentle, rain-fed plucks',
    motionCharacter: 'slowly replenishing',
    density: 'more connected and rooted',
    brightness: 'softly bright',
    warmth: 'warmer and more fertile',
    textureAmount: 'moist and enveloping',
    sound: {
      pace: 0.4,
      richness: 0.52,
      sustain: 0.76,
      motion: 0.38,
      density: 0.5,
      brightness: 0.52,
      warmth: 0.58,
      texture: 0.5,
      reverb: 0.42,
      topRegister: 0.4,
      droneSet: [0, 1],
      droneColor: [2, 3],
      midWeights: [1, 0.62, 0.46, 0.4, 0.36],
      topWeights: [0.18, 0.2, 0.16, 0.14, 0.18]
    }
  }),
  lixia: createProfile({
    mood: 'the year opening outward',
    pacing: 'moderately paced with a broader breath',
    harmonicRichness: 'clearer fullness in the middle layer',
    sustainedVsShort: 'sustained bed with more frequent upper motion',
    motionCharacter: 'open and lightly radiant',
    density: 'full but not crowded',
    brightness: 'warm early-summer light',
    warmth: 'noticeably warmer',
    textureAmount: 'soft heat in the air',
    sound: {
      pace: 0.46,
      richness: 0.58,
      sustain: 0.72,
      motion: 0.44,
      density: 0.56,
      brightness: 0.6,
      warmth: 0.62,
      texture: 0.54,
      reverb: 0.44,
      topRegister: 0.46,
      droneSet: [0, 3],
      droneColor: [1, 2],
      midWeights: [1, 0.48, 0.42, 0.62, 0.32],
      topWeights: [0.18, 0.18, 0.12, 0.22, 0.12]
    }
  }),
  xiaoman: createProfile({
    mood: 'swelling abundance without excess',
    pacing: 'slightly faster, still relaxed',
    harmonicRichness: 'lushest so far, but stable',
    sustainedVsShort: 'dense sustains with restrained ornament',
    motionCharacter: 'rounded and swelling',
    density: 'thickened overlap with soft edges',
    brightness: 'golden daylight',
    warmth: 'warm and grounded',
    textureAmount: 'grain-rich and soft',
    sound: {
      pace: 0.5,
      richness: 0.64,
      sustain: 0.7,
      motion: 0.46,
      density: 0.62,
      brightness: 0.62,
      warmth: 0.66,
      texture: 0.58,
      reverb: 0.46,
      topRegister: 0.48,
      droneSet: [0, 3],
      droneColor: [2, 4],
      midWeights: [1, 0.4, 0.46, 0.68, 0.38],
      topWeights: [0.16, 0.14, 0.16, 0.24, 0.14]
    }
  }),
  mangzhong: createProfile({
    mood: 'busy season energy held inside restraint',
    pacing: 'the quickest spring-to-summer pulse',
    harmonicRichness: 'full but more directional',
    sustainedVsShort: 'still ambient, but with more plucked definition',
    motionCharacter: 'active, tactile, and nimble',
    density: 'high overlap with clear articulation',
    brightness: 'sunlit and alert',
    warmth: 'warm, with drier edges',
    textureAmount: 'textured, fibrous, and lively',
    sound: {
      pace: 0.58,
      richness: 0.66,
      sustain: 0.64,
      motion: 0.58,
      density: 0.68,
      brightness: 0.68,
      warmth: 0.6,
      texture: 0.62,
      reverb: 0.44,
      topRegister: 0.54,
      droneSet: [0, 1],
      droneColor: [3, 2],
      midWeights: [1, 0.56, 0.34, 0.72, 0.22],
      topWeights: [0.18, 0.22, 0.1, 0.28, 0.08]
    }
  }),
  xiazhi: createProfile({
    mood: 'zenith stillness inside fullness',
    pacing: 'moderate again, with long suspended arcs',
    harmonicRichness: 'broadest harmonic field of the year',
    sustainedVsShort: 'rich sustains, with upper motion kept airy',
    motionCharacter: 'hovering and radiant',
    density: 'the fullest field, but evenly distributed',
    brightness: 'luminous and high',
    warmth: 'warm, but not heavy',
    textureAmount: 'softly glowing',
    sound: {
      pace: 0.48,
      richness: 0.72,
      sustain: 0.74,
      motion: 0.42,
      density: 0.72,
      brightness: 0.76,
      warmth: 0.56,
      texture: 0.68,
      reverb: 0.48,
      topRegister: 0.56,
      droneSet: [0, 3],
      droneColor: [4, 2],
      midWeights: [1, 0.46, 0.48, 0.64, 0.46],
      topWeights: [0.16, 0.18, 0.18, 0.2, 0.18]
    }
  }),
  xiaoshu: createProfile({
    mood: 'heat haze and suspended air',
    pacing: 'moderate, with softened edges',
    harmonicRichness: 'full, but blurrier than Xiazhi',
    sustainedVsShort: 'sustains lead, plucks drift like mirages',
    motionCharacter: 'wavering and evaporative',
    density: 'broad and slightly smeared',
    brightness: 'bright through haze',
    warmth: 'warm and humid',
    textureAmount: 'shimmering air grain',
    sound: {
      pace: 0.44,
      richness: 0.68,
      sustain: 0.72,
      motion: 0.48,
      density: 0.66,
      brightness: 0.72,
      warmth: 0.62,
      texture: 0.7,
      reverb: 0.5,
      topRegister: 0.56,
      droneSet: [0, 4],
      droneColor: [3, 1],
      midWeights: [1, 0.34, 0.42, 0.58, 0.54],
      topWeights: [0.14, 0.16, 0.14, 0.22, 0.24]
    }
  }),
  dashu: createProfile({
    mood: 'saturated warmth and heavy air',
    pacing: 'steady, not rushed, but richly alive',
    harmonicRichness: 'very full with softened definition',
    sustainedVsShort: 'thick sustained field with humid upper flecks',
    motionCharacter: 'slowly churning',
    density: 'high and enveloping',
    brightness: 'muted by heat',
    warmth: 'the warmest point of the cycle',
    textureAmount: 'dense atmospheric texture',
    sound: {
      pace: 0.42,
      richness: 0.74,
      sustain: 0.7,
      motion: 0.5,
      density: 0.74,
      brightness: 0.58,
      warmth: 0.68,
      texture: 0.76,
      reverb: 0.52,
      topRegister: 0.52,
      droneSet: [0, 3],
      droneColor: [1, 4, 2],
      midWeights: [1, 0.42, 0.38, 0.6, 0.56],
      topWeights: [0.12, 0.18, 0.12, 0.22, 0.26]
    }
  }),
  liqiu: createProfile({
    mood: 'release after saturation',
    pacing: 'moderate, easing downward',
    harmonicRichness: 'still full, but beginning to clear',
    sustainedVsShort: 'broad sustains with more breathing room',
    motionCharacter: 'loosening and settling',
    density: 'less overlap than late summer',
    brightness: 'warm light with cooler edges',
    warmth: 'warm fading toward neutral',
    textureAmount: 'textured but less humid',
    sound: {
      pace: 0.4,
      richness: 0.62,
      sustain: 0.72,
      motion: 0.42,
      density: 0.58,
      brightness: 0.56,
      warmth: 0.6,
      texture: 0.58,
      reverb: 0.44,
      topRegister: 0.48,
      droneSet: [0, 3],
      droneColor: [2, 4],
      midWeights: [1, 0.36, 0.46, 0.56, 0.32],
      topWeights: [0.16, 0.14, 0.18, 0.18, 0.12]
    }
  }),
  chushu: createProfile({
    mood: 'heat loosening into open air',
    pacing: 'moderate-slow, with more space',
    harmonicRichness: 'leaner than Liqiu, still connected',
    sustainedVsShort: 'sustains remain primary, plucks recede slightly',
    motionCharacter: 'exhaling and unclenching',
    density: 'moderate with widening gaps',
    brightness: 'gentle late-summer light',
    warmth: 'tempered warmth',
    textureAmount: 'lighter atmosphere',
    sound: {
      pace: 0.36,
      richness: 0.54,
      sustain: 0.76,
      motion: 0.38,
      density: 0.5,
      brightness: 0.52,
      warmth: 0.56,
      texture: 0.52,
      reverb: 0.42,
      topRegister: 0.44,
      droneSet: [0, 2],
      droneColor: [1, 4],
      midWeights: [1, 0.42, 0.52, 0.38, 0.28],
      topWeights: [0.16, 0.12, 0.2, 0.14, 0.12]
    }
  }),
  bailu: createProfile({
    mood: 'dew clarity and cool early morning air',
    pacing: 'slower, more distilled',
    harmonicRichness: 'clearer and more selective',
    sustainedVsShort: 'airy sustain with crisp, sparse upper drops',
    motionCharacter: 'fine and dew-like',
    density: 'light-moderate, with defined separations',
    brightness: 'cool brightness',
    warmth: 'noticeably cooler',
    textureAmount: 'small bright grains',
    sound: {
      pace: 0.32,
      richness: 0.46,
      sustain: 0.78,
      motion: 0.34,
      density: 0.42,
      brightness: 0.62,
      warmth: 0.42,
      texture: 0.48,
      reverb: 0.44,
      topRegister: 0.5,
      droneSet: [0, 1],
      droneColor: [4, 2],
      midWeights: [1, 0.48, 0.34, 0.3, 0.42],
      topWeights: [0.18, 0.16, 0.12, 0.1, 0.22]
    }
  }),
  qiufen: createProfile({
    mood: 'restored equilibrium with quieter color',
    pacing: 'slow and even',
    harmonicRichness: 'moderate, centered, and open',
    sustainedVsShort: 'steady sustained center with restrained motion',
    motionCharacter: 'balanced and calm',
    density: 'moderate, less enveloping than spring balance',
    brightness: 'neutral daylight',
    warmth: 'lightly cool-neutral',
    textureAmount: 'softly clear',
    sound: {
      pace: 0.3,
      richness: 0.42,
      sustain: 0.8,
      motion: 0.3,
      density: 0.4,
      brightness: 0.48,
      warmth: 0.46,
      texture: 0.42,
      reverb: 0.38,
      topRegister: 0.4,
      droneSet: [0, 3],
      droneColor: [2, 1],
      midWeights: [1, 0.34, 0.46, 0.46, 0.26],
      topWeights: [0.14, 0.1, 0.16, 0.14, 0.1]
    }
  }),
  hanlu: createProfile({
    mood: 'chill gathering under a thinner sun',
    pacing: 'slow, with longer empty spans',
    harmonicRichness: 'lean and descending',
    sustainedVsShort: 'low sustained body with rare cold upper notes',
    motionCharacter: 'withdrawing and stilling',
    density: 'light and increasingly spare',
    brightness: 'cool and subdued',
    warmth: 'reduced warmth, mostly low residual heat',
    textureAmount: 'dry and lightly etched',
    sound: {
      pace: 0.24,
      richness: 0.34,
      sustain: 0.84,
      motion: 0.22,
      density: 0.3,
      brightness: 0.36,
      warmth: 0.42,
      texture: 0.38,
      reverb: 0.34,
      topRegister: 0.34,
      droneSet: [0, 4],
      droneColor: [1, 3],
      midWeights: [1, 0.28, 0.24, 0.34, 0.42],
      topWeights: [0.12, 0.08, 0.08, 0.08, 0.18]
    }
  }),
  shuangjiang: createProfile({
    mood: 'brittle descent and exposed structure',
    pacing: 'slow and restrained',
    harmonicRichness: 'spare, with a little exposed contrast',
    sustainedVsShort: 'mainly sustain with occasional sharper flecks',
    motionCharacter: 'crisp, descending, and sparse',
    density: 'thin and broken up',
    brightness: 'faded light',
    warmth: 'cool-dry, with little remaining warmth',
    textureAmount: 'fine dry grain',
    sound: {
      pace: 0.2,
      richness: 0.28,
      sustain: 0.88,
      motion: 0.18,
      density: 0.24,
      brightness: 0.3,
      warmth: 0.38,
      texture: 0.34,
      reverb: 0.3,
      topRegister: 0.3,
      droneSet: [0, 2],
      droneColor: [4, 1],
      midWeights: [1, 0.22, 0.32, 0.28, 0.36],
      topWeights: [0.1, 0.06, 0.12, 0.08, 0.16]
    }
  }),
  lidong: createProfile({
    mood: 'winter settling in around a low hearth',
    pacing: 'very slow again',
    harmonicRichness: 'spare, but more grounded than Shuangjiang',
    sustainedVsShort: 'long low tones with rare distant plucks',
    motionCharacter: 'inward and settling',
    density: 'small, low-lying overlap',
    brightness: 'muted grey-blue',
    warmth: 'a warmer low center returns',
    textureAmount: 'soft felt-like grain',
    sound: {
      pace: 0.18,
      richness: 0.24,
      sustain: 0.92,
      motion: 0.14,
      density: 0.2,
      brightness: 0.24,
      warmth: 0.62,
      texture: 0.3,
      reverb: 0.28,
      topRegister: 0.24,
      droneSet: [0, 3],
      droneColor: [4, 1],
      midWeights: [1, 0.18, 0.18, 0.46, 0.32],
      topWeights: [0.1, 0.04, 0.06, 0.08, 0.14]
    }
  }),
  xiaoxue: createProfile({
    mood: 'quiet suspension before full snow depth',
    pacing: 'very slow with airy pauses',
    harmonicRichness: 'light and crystalline',
    sustainedVsShort: 'thin sustained field with tiny snow-flurry taps',
    motionCharacter: 'hovering and powdery',
    density: 'narrow and airy',
    brightness: 'cold pale light',
    warmth: 'cooler than Lidong, but not severe',
    textureAmount: 'powdered grain',
    sound: {
      pace: 0.16,
      richness: 0.22,
      sustain: 0.93,
      motion: 0.12,
      density: 0.18,
      brightness: 0.28,
      warmth: 0.5,
      texture: 0.32,
      reverb: 0.3,
      topRegister: 0.26,
      droneSet: [0, 1],
      droneColor: [4, 2],
      midWeights: [1, 0.26, 0.14, 0.32, 0.38],
      topWeights: [0.12, 0.08, 0.04, 0.06, 0.18]
    }
  }),
  daxue: createProfile({
    mood: 'snow weight and deepened hush',
    pacing: 'slow and heavy',
    harmonicRichness: 'minimal, with a dense low body',
    sustainedVsShort: 'almost entirely sustained, top notes nearly absent',
    motionCharacter: 'barely moving',
    density: 'low count, but weighty',
    brightness: 'dim winter white',
    warmth: 'subdued inner warmth under snow cover',
    textureAmount: 'soft snow-damped texture',
    sound: {
      pace: 0.12,
      richness: 0.2,
      sustain: 0.96,
      motion: 0.09,
      density: 0.16,
      brightness: 0.18,
      warmth: 0.58,
      texture: 0.26,
      reverb: 0.22,
      topRegister: 0.18,
      droneSet: [0, 4],
      droneColor: [3, 1],
      midWeights: [1, 0.16, 0.1, 0.4, 0.28],
      topWeights: [0.08, 0.04, 0.02, 0.06, 0.12]
    }
  })
};

const TERMS_BY_DOY = [...TERM_LIST].sort((a, b) => a.doy - b.doy);

const getDayOfYear = (date) => {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date - start) / 86400000) + 1;
};

export const getAmbientProfile = (termId) => TERM_AMBIENT_PROFILES[termId] || TERM_AMBIENT_PROFILES.dongzhi;

export const getCurrentTerm = (date = new Date()) => {
  const doy = getDayOfYear(date);
  let active = TERMS_BY_DOY[TERMS_BY_DOY.length - 1];

  for (const term of TERMS_BY_DOY) {
    if (doy >= term.doy) active = term;
    else break;
  }

  return active;
};

export const getCurrentTermId = (date = new Date()) => getCurrentTerm(date).id;
