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

const THEMES = {
  guyu: {
    name: '谷雨 Grain Rain',
    bg: { r: 244, g: 242, b: 228 },
    grassCol: '#b7d86a',
    grassMix: 0.70,
    grassSpacing: 11,
    grassHeightMin: 0.12,
    grassHeightMax: 0.26,
    rainCol: '#6c90c3',
    rainDensity: 1.8,
    rainWeight: 4,
    rainAlpha: 34,
    rainWind: 30,
    rainSpeedMin: 260,
    rainSpeedMax: 520,
    rainLenMin: 10,
    rainLenMax: 26,
    splashAlpha: 90,
    splashCount: 2,
    rainOnMin: 6.0,
    rainOnMax: 12.0,
    rainOffMin: 1.0,
    rainOffMax: 3.0,
    rainFadeIn: 1.6,
    rainFadeOut: 1.2,
    rainPatchCount: 3,
    rainPatchRadiusMin: 0.18,
    rainPatchRadiusMax: 0.32,
    startWithRain: true,
    directionBias: 1,
    bendImpulse: 0.030,
    tickStrength: 0.9,
    stiffnessDry: 9.5,
    stiffnessWet: 11.0,
    dampingDry: 2.4,
    dampingWet: 2.8,
    targetDecay: 0.90,
    windDryScale: 1.0,
    windWetScale: 1.25,
    interactionChance: 0.28,
    wetGain: 0.10,
    baseBandA: 16,
    wetDroop: -0.04,
    dryRate: 0.03,
    growthScale: 0.08,
    growthRate: 0.03,
    growthDecay: 0.008
  },
  yushui: {
    name: '雨水 Rain Water',
    bg: { r: 246, g: 241, b: 234 },
    grassCol: '#cfe07a',
    grassMix: 0.62,
    grassSpacing: 12.5,
    grassHeightMin: 0.09,
    grassHeightMax: 0.22,
    rainCol: '#6c90c3',
    rainDensity: 0.85,
    rainWeight: 3,
    rainAlpha: 24,
    rainWind: 18,
    rainSpeedMin: 230,
    rainSpeedMax: 460,
    rainLenMin: 8,
    rainLenMax: 22,
    splashAlpha: 60,
    splashCount: 1,
    rainOnMin: 1.0,
    rainOnMax: 2.0,
    rainOffMin: 6.0,
    rainOffMax: 12.0,
    rainFadeIn: 4.0,
    rainFadeOut: 8.0,
    rainPatchCount: 1,
    rainPatchRadiusMin: 0.08,
    rainPatchRadiusMax: 0.14,
    startWithRain: false,
    directionBias: -1,
    bendImpulse: 0.022,
    tickStrength: 0.5,
    stiffnessDry: 8.2,
    stiffnessWet: 6.0,
    dampingDry: 3.3,
    dampingWet: 5.2,
    targetDecay: 0.95,
    windDryScale: 1.0,
    windWetScale: 0.70,
    interactionChance: 0.18,
    wetGain: 0.16,
    baseBandA: 22,
    wetDroop: 0.08,
    dryRate: 0.012,
    growthScale: 0.0,
    growthRate: 0.0,
    growthDecay: 0.04
  },
  dongzhi: {
    name: '冬至 Winter Solstice',
    bg: { r: 247, g: 244, b: 236 },
    grassCol: '#b8bcb5',
    grassMix: 0.38,
    grassSpacing: 14,
    grassHeightMin: 0.05,
    grassHeightMax: 0.13,
    rainEnabled: false,
    rainCol: '#6c90c3',
    rainDensity: 0.0,
    rainWeight: 2,
    rainAlpha: 0,
    rainWind: 10,
    rainSpeedMin: 120,
    rainSpeedMax: 240,
    rainLenMin: 6,
    rainLenMax: 14,
    splashAlpha: 0,
    splashCount: 0,
    rainOnMin: 6.0,
    rainOnMax: 10.0,
    rainOffMin: 6.0,
    rainOffMax: 10.0,
    rainFadeIn: 1.0,
    rainFadeOut: 1.0,
    rainPatchCount: 1,
    rainPatchRadiusMin: 0.12,
    rainPatchRadiusMax: 0.22,
    startWithRain: false,
    directionBias: 0,
    bendImpulse: 0.012,
    tickStrength: 0.4,
    stiffnessDry: 9.2,
    stiffnessWet: 10.4,
    dampingDry: 3.0,
    dampingWet: 3.2,
    targetDecay: 0.94,
    windDryScale: 0.85,
    windWetScale: 0.85,
    interactionChance: 0.0,
    wetGain: 0.0,
    baseBandA: 10,
    wetDroop: 0.0,
    dryRate: 0.02,
    growthScale: 0.0,
    growthRate: 0.0,
    growthDecay: 0.04,
    snowEnabled: true,
    snowCol: { r: 198, g: 198, b: 198 },
    snowDensity: 0.7,
    snowSizeMin: 1.4,
    snowSizeMax: 3.6,
    snowSpeedMin: 8,
    snowSpeedMax: 26,
    snowDrift: 18,
    snowAlpha: 140,
    frostEnabled: true,
    frostCol: { r: 245, g: 250, b: 255 },
    frostDensity: 0.75,
    frostSizeMin: 6,
    frostSizeMax: 22,
    frostAlphaMin: 8,
    frostAlphaMax: 28,
    frostDrift: 6,
    frostSpeedMin: 0.35,
    frostSpeedMax: 0.9
  }
};

function getInitialTheme() {
  const injected = window.__TERM_ID__;
  if (injected && THEMES[injected]) return injected;
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name');
  if (name && THEMES[name]) return name;
  const path = window.location.pathname || '';
  const m = path.match(/\/term\/([^/?#]+)/);
  if (m && m[1] && THEMES[m[1]]) return m[1];
  return 'guyu';
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
let growthLevel = 0;
let snowCover = 0;
let p5Ready = false;
let pendingThemeKey = null;

function setup() {
  const mount = document.getElementById('termP5Mount') || document.body;
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(mount);
  pixelDensity(displayDensity());
  applyTheme(ACTIVE_THEME, false);
  initField(false);
  initRain();
  initRainSystem();
  initSnow();
  initFrost();
  p5Ready = true;
  if (pendingThemeKey) {
    const nextKey = pendingThemeKey;
    pendingThemeKey = null;
    applyTheme(nextKey, true);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initField(true);
  initRain();
  initRainSystem();
  initSnow();
  initFrost();
}

function applyTheme(key, reinit = true) {
  const theme = THEMES[key] || THEMES.guyu;
  ACTIVE_THEME = key;
  THEME = theme;
  BG = theme.bg;
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

  if (reinit) {
    initField(true);
    initRain();
    initRainSystem();
    initSnow();
    initFrost();
  }
}

function initField(keepState = false) {
  const baseCount = Math.floor(width / grassSpacing);
  const baseY = height * 1;

  const old = blades;
  blades = [];

  const noiseScale = 0.015;
  const jitterMax = 14;
  let xCursor = width * 0.08;

  let i = 0;
  while (xCursor < width * 0.92 && i < baseCount * 1.2) {
    const n = noise(xCursor * noiseScale);
    const spacing = map(n, 0, 1, 6, 26);
    const jitter = random(-jitterMax, jitterMax);
    const x = xCursor + jitter;
    const h = map(n, 0, 1, height * grassHeightMin, height * grassHeightMax) * random(0.85, 1.15);
    const mem = keepState && old[i] ? old[i].memWet : 0;

    blades.push(new Blade(x, baseY, h, random(1000), mem));

    xCursor += spacing;
    i++;
  }
}

function initRainSystem() {
  const theme = THEME;
  rainIntensity = 0;
  growthLevel = 0;
  scheduleRainPhase(theme.startWithRain);
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

  const target = rainOn ? 1 : 0;
  const speed = rainOn ? theme.rainFadeIn : theme.rainFadeOut;
  const step = min(1, dt * speed);
  rainIntensity += (target - rainIntensity) * step;
}

function updateGrowth(dt) {
  const theme = THEME;
  if (theme.growthRate > 0) {
    const grow = theme.growthRate * dt * max(0, rainIntensity);
    growthLevel = constrain(growthLevel + grow, 0, 1);
    growthLevel = max(0, growthLevel - theme.growthDecay * dt);
  } else {
    growthLevel = max(0, growthLevel - theme.growthDecay * dt);
  }
}

function getRainSpawnX() {
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
        const tipY = nearest.baseY - nearest.h;
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
    this.x += this.vx * dt;
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

class Blade {
  constructor(x, baseY, h, seed, memWet = 0) {
    this.x = x;
    this.baseY = baseY;
    this.h = h;
    this.seed = seed;

    this.baseTilt = random(-0.25, 0.25);
    this.bend = random(-0.03, 0.03);
    this.targetBend = 0;
    this.v = 0;
    this.memWet = memWet;
    this.tick = 0;
    this.tickVel = 0;
    this.lastTickAt = -9999;

    this.branches = [];
    const nBranches = floor(random(1, 4));
    for (let i = 0; i < nBranches; i++) {
      const t = random(0.35, 0.85);
      const side = random() < 0.5 ? -1 : 1;
      const len = random(this.h * 0.07, this.h * 0.16);
      const bias = random(0.10, 0.28);
      this.branches.push({ t, side, len, bias });
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
  }

  draw() {
    const theme = THEME;
    const wet = constrain(this.memWet, 0, 1);
    const alpha = lerp(92, 130, wet);
    const growthFactor = 1 + growthLevel * theme.growthScale;
    const wetFactor = 1 - wet * theme.wetDroop;
    const h = max(6, this.h * growthFactor * wetFactor);

    const inkCol = color(INK.r, INK.g, INK.b);
    const greenCol = color(GRASS_COL);
    const mixCol = lerpColor(inkCol, greenCol, GRASS_MIX);
    const darkCol = lerpColor(mixCol, color('#2E8B57'), wet * 0.85);
    darkCol.setAlpha(alpha);
    stroke(darkCol);
    strokeWeight(2);

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

    for (const br of this.branches) {
      const p = pointOnStem(br.t);
      const ang = (bendAmt * p.k) + br.side * br.bias;
      const droop = wet * 0.10;
      const brLen = br.len * growthFactor * wetFactor;
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
  background(BG.r, BG.g, BG.b);

  const t = millis() * 0.001;
  const dt = min(0.033, max(0.001, t - tPrev));
  tPrev = t;
  const theme = THEME;

  updateRainSystem(dt);
  updateGrowth(dt);
  if (SNOW.enabled) {
    snowCover = min(1, snowCover + dt * 0.015);
  } else {
    snowCover = max(0, snowCover - dt * 0.02);
  }

  const baseWind = (noise(t * 0.12) - 0.5) * 0.010;

  for (const b of blades) {
    const n1 = noise(b.seed * 0.01, t * 0.45) - 0.5;
    const n2 = noise(b.x * 0.004, t * 1.8) - 0.5;
    const localWind = baseWind + n1 * 0.020 + n2 * 0.006;
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
  const tt = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return tt * tt * (3 - 2 * tt);
}

window.__termBgApplyTheme = (key) => {
  if (!key || !THEMES[key]) return;
  window.__TERM_ID__ = key;
  if (!window.__termBgP5Instance && window.p5) {
    ACTIVE_THEME = key;
    THEME = THEMES[key];
    BG = THEME.bg;
    pendingThemeKey = key;
    p5Ready = false;
    window.__termBgP5Instance = new window.p5();
    return;
  }
  if (!p5Ready || typeof width === 'undefined' || typeof height === 'undefined') {
    pendingThemeKey = key;
    return;
  }
  applyTheme(key, true);
};

window.__termBgDispose = () => {
  try {
    noLoop();
  } catch (_) {}
  try {
    remove();
  } catch (_) {}
  p5Ready = false;
  window.__termBgP5Instance = null;
};

if (window.p5) {
  if (window.__termBgP5Instance && typeof window.__termBgP5Instance.remove === 'function') {
    window.__termBgP5Instance.remove();
  }
  window.__termBgP5Instance = new window.p5();
}
