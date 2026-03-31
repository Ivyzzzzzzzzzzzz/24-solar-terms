import {
  AMBIENT_NOTE_WORLD,
  getAmbientProfile,
  getCurrentTermId,
  getTermNoteIdentity
} from '../data';

const MIN_GAIN = 0.0001;
const TRANSITION_SEC = 14;
const MASTER_LEVEL = 0.34;

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + ((b - a) * t);
const rand = (min, max) => min + (Math.random() * (max - min));
const randomInt = (min, max) => min + Math.floor(Math.random() * ((max - min) + 1));
const midiToFrequency = (midi) => 440 * (2 ** ((midi - 69) / 12));

const mixArray = (from = [], to = [], t) => {
  const length = Math.max(from.length, to.length);
  return Array.from({ length }, (_, index) => lerp(from[index] ?? 0, to[index] ?? 0, t));
};

const withRecent = (recent = [], value, limit = 6) => (
  [value, ...recent.filter((entry) => entry !== value)].slice(0, limit)
);

const cloneSoundProfile = (sound) => ({
  ...sound,
  droneSet: [...(sound.droneSet || [])],
  droneColor: [...(sound.droneColor || [])],
  midWeights: [...(sound.midWeights || [])],
  topWeights: [...(sound.topWeights || [])]
});

const chooseWeightedIndex = (weights, lastIndex = -1, repeatPenalty = 0.55) => {
  if (!weights?.length) return 0;

  const adjusted = weights.map((weight, index) => (
    index === lastIndex ? weight * (1 - repeatPenalty) : weight
  ));
  const source = adjusted.some((weight) => weight > 0) ? adjusted : weights;
  const total = source.reduce((sum, weight) => sum + Math.max(0, weight || 0), 0);

  if (total <= 0) return 0;

  let cursor = Math.random() * total;
  for (let index = 0; index < source.length; index += 1) {
    cursor -= Math.max(0, source[index] || 0);
    if (cursor <= 0) return index;
  }

  return Math.max(0, source.length - 1);
};

const createImpulseResponse = (context, durationSec = 4.5, decay = 2.8) => {
  const length = Math.floor(context.sampleRate * durationSec);
  const buffer = context.createBuffer(2, length, context.sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const fade = (1 - (i / length)) ** decay;
      data[i] = (Math.random() * 2 - 1) * fade;
    }
  }

  return buffer;
};

const createNoiseBuffer = (context, durationSec = 0.18) => {
  const length = Math.floor(context.sampleRate * durationSec);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - (i / length));
  }

  return buffer;
};

const rampParam = (param, target, startTime, durationSec) => {
  param.cancelScheduledValues(startTime);
  param.setValueAtTime(Math.max(MIN_GAIN, param.value || MIN_GAIN), startTime);
  param.linearRampToValueAtTime(target, startTime + durationSec);
};

export const isAmbientAudioSupported = () => (
  typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext)
);

export class AmbientAudioEngine {
  constructor(initialTermId = getCurrentTermId()) {
    const initialSound = cloneSoundProfile(getAmbientProfile(initialTermId).sound);

    this.termId = initialTermId;
    this.transition = {
      from: initialSound,
      to: initialSound,
      start: 0,
      duration: 0
    };

    this.context = null;
    this.enabled = false;
    this.schedulerStarted = false;
    this.lastTopIndex = -1;
    this.topRecent = [];
    this.topContour = 1;
    this.topAnchorIndex = -1;
    this.lastAccentIndex = -1;
    this.accentRecent = [];
    this.accentContour = 1;
    this.accentAnchorIndex = -1;
    this.termIdentityCursor = new Map();
    this.liveVoices = new Set();
    this.cleanupTimers = new Set();
    this.suspendTimer = null;

    this.layerBuses = {};
    this.layerSends = {};
    this.droneLanes = [];
    this.midLanes = [];
    this.accentTimer = null;
    this.topTimer = null;
  }

  resolveProfile(termId) {
    return cloneSoundProfile(getAmbientProfile(termId).sound);
  }

  getProfile(atTime = 0) {
    const { from, to, start, duration } = this.transition;
    if (!duration) return cloneSoundProfile(to);

    const t = clamp01((atTime - start) / duration);
    if (t >= 1) return cloneSoundProfile(to);

    return {
      ...cloneSoundProfile(to),
      pace: lerp(from.pace, to.pace, t),
      richness: lerp(from.richness, to.richness, t),
      sustain: lerp(from.sustain, to.sustain, t),
      motion: lerp(from.motion, to.motion, t),
      density: lerp(from.density, to.density, t),
      brightness: lerp(from.brightness, to.brightness, t),
      warmth: lerp(from.warmth, to.warmth, t),
      texture: lerp(from.texture, to.texture, t),
      reverb: lerp(from.reverb, to.reverb, t),
      topRegister: lerp(from.topRegister, to.topRegister, t),
      midWeights: mixArray(from.midWeights, to.midWeights, t),
      topWeights: mixArray(from.topWeights, to.topWeights, t),
      droneSet: t < 0.5 ? [...(from.droneSet || [])] : [...(to.droneSet || [])],
      droneColor: t < 0.5 ? [...(from.droneColor || [])] : [...(to.droneColor || [])]
    };
  }

  setManagedTimeout(callback, delayMs) {
    const id = window.setTimeout(() => {
      this.cleanupTimers.delete(id);
      callback();
    }, delayMs);
    this.cleanupTimers.add(id);
    return id;
  }

  clearManagedTimeout(id) {
    if (!id) return;
    window.clearTimeout(id);
    this.cleanupTimers.delete(id);
  }

  createContext() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContextCtor();

    const ctx = this.context;
    this.noiseBuffer = createNoiseBuffer(ctx, 0.18);

    this.masterHighpass = ctx.createBiquadFilter();
    this.masterHighpass.type = 'highpass';
    this.masterHighpass.frequency.value = 56;
    this.masterHighpass.Q.value = 0.36;

    this.masterFilter = ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = 2800;
    this.masterFilter.Q.value = 0.24;

    this.masterCompressor = ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.value = -22;
    this.masterCompressor.knee.value = 18;
    this.masterCompressor.ratio.value = 2.2;
    this.masterCompressor.attack.value = 0.03;
    this.masterCompressor.release.value = 0.28;

    this.masterOutput = ctx.createGain();
    this.masterOutput.gain.value = MIN_GAIN;

    this.dryBus = ctx.createGain();
    this.reverbInput = ctx.createGain();
    this.reverbWet = ctx.createGain();
    this.reverbWet.gain.value = 0.16;
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = createImpulseResponse(ctx, 4.4, 2.6);

    this.dryBus.connect(this.masterHighpass);
    this.reverbInput.connect(this.reverb);
    this.reverb.connect(this.reverbWet);
    this.reverbWet.connect(this.masterHighpass);
    this.masterHighpass.connect(this.masterFilter);
    this.masterFilter.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterOutput);
    this.masterOutput.connect(ctx.destination);

    ['drone', 'mid', 'accent', 'top'].forEach((layer) => {
      const bus = ctx.createGain();
      const send = ctx.createGain();
      bus.gain.value = 0.18;
      send.gain.value = 0.08;
      bus.connect(this.dryBus);
      bus.connect(send);
      send.connect(this.reverbInput);
      this.layerBuses[layer] = bus;
      this.layerSends[layer] = send;
    });

    this.applyGlobalMix(this.getProfile(ctx.currentTime), ctx.currentTime, true);
  }

  applyGlobalMix(profile, now, immediate = false) {
    if (!this.context) return;

    const duration = immediate ? 0.01 : 8;
    const droneGain = Math.max(MIN_GAIN, 0.1 + (profile.sustain * 0.08) + (profile.warmth * 0.02) - (profile.motion * 0.03));
    const midGain = 0.28 + (profile.richness * 0.18) + (profile.density * 0.07) + (profile.motion * 0.03);
    const accentGain = 0.09 + (profile.texture * 0.06) + (profile.motion * 0.05) + (profile.brightness * 0.03) - (profile.sustain * 0.03);
    const topGain = 0.14 + (profile.motion * 0.1) + (profile.brightness * 0.08) + (profile.topRegister * 0.06);
    const wetGain = 0.12 + (profile.reverb * 0.14) + (profile.texture * 0.05);
    const cutoff = 1500 + (profile.brightness * 3000) + (profile.topRegister * 900) + (profile.texture * 260);
    const highpass = 46 + (profile.brightness * 16) + (profile.topRegister * 22);

    rampParam(this.layerBuses.drone.gain, droneGain, now, duration);
    rampParam(this.layerBuses.mid.gain, midGain, now, duration);
    rampParam(this.layerBuses.accent.gain, accentGain, now, duration);
    rampParam(this.layerBuses.top.gain, topGain, now, duration);

    rampParam(this.layerSends.drone.gain, wetGain * 0.24, now, duration);
    rampParam(this.layerSends.mid.gain, wetGain * (0.48 + (profile.texture * 0.08)), now, duration);
    rampParam(this.layerSends.accent.gain, wetGain * (0.42 + (profile.texture * 0.08)), now, duration);
    rampParam(this.layerSends.top.gain, wetGain * (0.72 + (profile.brightness * 0.12)), now, duration);

    rampParam(this.reverbWet.gain, wetGain, now, duration);
    rampParam(this.masterHighpass.frequency, highpass, now, duration);
    rampParam(this.masterFilter.frequency, cutoff, now, duration);
  }

  fadeOutputTo(target, durationSec = 2.6) {
    if (!this.context || !this.masterOutput) return;
    const now = this.context.currentTime;
    rampParam(this.masterOutput.gain, target, now, durationSec);
  }

  setTerm(termId, options = {}) {
    if (!termId) return;

    const now = this.context?.currentTime ?? 0;
    const next = this.resolveProfile(termId);
    const from = this.context ? this.getProfile(now) : cloneSoundProfile(this.transition.to);

    this.termId = termId;
    this.transition = {
      from,
      to: next,
      start: now,
      duration: options.immediate ? 0 : TRANSITION_SEC
    };

    if (!this.context) return;

    this.applyGlobalMix(next, now, options.immediate);
    if (!options.skipRetune) this.retuneDrones(options.immediate ? 0.08 : 1.8);
  }

  async start(termId = this.termId) {
    if (!isAmbientAudioSupported()) {
      throw new Error('Ambient audio is not supported in this browser.');
    }

    if (this.suspendTimer) {
      window.clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }

    if (!this.context) this.createContext();

    this.enabled = true;
    this.setTerm(termId, { immediate: !this.schedulerStarted, skipRetune: !this.schedulerStarted });

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    if (!this.schedulerStarted) this.startSchedulers();

    this.fadeOutputTo(MASTER_LEVEL, 2.8);
  }

  async suspend() {
    if (!this.context) return;

    this.enabled = false;
    this.stopSchedulers();
    this.releaseAllVoices(1.4);
    this.fadeOutputTo(MIN_GAIN, 1.6);

    await new Promise((resolve) => {
      this.suspendTimer = window.setTimeout(async () => {
        this.suspendTimer = null;
        if (this.context?.state === 'running') {
          try {
            await this.context.suspend();
          } catch (_) {
            // Keep the UI resilient if the audio context rejects suspension.
          }
        }
        resolve();
      }, 1700);
    });
  }

  async dispose() {
    this.stopSchedulers();
    this.releaseAllVoices(0.5);

    for (const timerId of [...this.cleanupTimers]) {
      window.clearTimeout(timerId);
      this.cleanupTimers.delete(timerId);
    }

    if (this.suspendTimer) {
      window.clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }

    if (this.context) {
      try {
        await this.context.close();
      } catch (_) {
        // Closing can fail in some runtimes; leave teardown best-effort.
      }
    }

    this.context = null;
    this.enabled = false;
    this.schedulerStarted = false;
    this.liveVoices.clear();
  }

  startSchedulers() {
    this.stopSchedulers();
    this.schedulerStarted = true;
    this.droneLanes = Array.from({ length: 2 }, (_, index) => ({
      timer: null,
      lastIndex: -1,
      controller: this.createContinuousDroneLane(index)
    }));
    this.midLanes = Array.from({ length: 3 }, (_, index) => ({
      timer: null,
      lastIndex: -1,
      recent: [],
      contour: index % 2 === 0 ? 1 : -1,
      anchorIndex: -1
    }));
    this.lastTopIndex = -1;
    this.topRecent = [];
    this.topContour = 1;
    this.topAnchorIndex = -1;
    this.lastAccentIndex = -1;
    this.accentRecent = [];
    this.accentContour = 1;
    this.accentAnchorIndex = -1;

    this.droneLanes.forEach((_, index) => {
      this.scheduleDroneLane(index, { force: true, startDelaySec: 0.12 + (index * 0.7) });
    });

    this.midLanes.forEach((_, index) => {
      const delayMs = 220 + (index * 720);
      this.midLanes[index].timer = window.setTimeout(() => this.scheduleMidLane(index), delayMs);
    });

    this.accentTimer = window.setTimeout(() => this.scheduleAccentEvent(), 900);
    this.topTimer = window.setTimeout(() => this.scheduleTopEvent(), 540);
  }

  stopSchedulers() {
    this.schedulerStarted = false;

    this.droneLanes.forEach((lane) => {
      if (lane.timer) window.clearTimeout(lane.timer);
      lane.timer = null;
    });

    this.midLanes.forEach((lane) => {
      if (lane.timer) window.clearTimeout(lane.timer);
      lane.timer = null;
    });

    if (this.accentTimer) {
      window.clearTimeout(this.accentTimer);
      this.accentTimer = null;
    }

    if (this.topTimer) {
      window.clearTimeout(this.topTimer);
      this.topTimer = null;
    }
  }

  releaseAllVoices(releaseSec = 1.2) {
    this.liveVoices.forEach((voice) => {
      voice.stop(this.context?.currentTime ?? 0, releaseSec);
    });

    this.droneLanes.forEach((lane) => {
      lane.controller?.stop(this.context?.currentTime ?? 0, releaseSec);
      lane.controller = null;
    });
  }

  retuneDrones(startDelaySec = 0.8) {
    if (!this.schedulerStarted || !this.context) return;

    this.droneLanes.forEach((lane, index) => {
      if (lane.timer) window.clearTimeout(lane.timer);
      lane.timer = null;
      this.scheduleDroneLane(index, {
        force: true,
        startDelaySec: startDelaySec + (index * 0.42)
      });
    });
  }

  makeVoiceController({ gainNode, sources, nodes, naturalEndTime }) {
    let controller = null;
    let isReleased = false;
    let cleanupTimerId = null;

    const cleanup = () => {
      if (!controller) return;
      this.liveVoices.delete(controller);
      nodes.forEach((node) => {
        try {
          node.disconnect();
        } catch (_) {
          // Nodes may already be disconnected during repeated cleanup attempts.
        }
      });
      controller = null;
    };

    controller = {
      stop: (when = this.context?.currentTime ?? 0, releaseSec = 1.2) => {
        if (isReleased || !this.context) return;
        isReleased = true;

        const at = Math.max(this.context.currentTime, when);
        gainNode.gain.cancelScheduledValues(at);
        gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value || MIN_GAIN, MIN_GAIN), at);
        gainNode.gain.linearRampToValueAtTime(MIN_GAIN, at + releaseSec);

        sources.forEach((source) => {
          try {
            source.stop(at + releaseSec + 0.08);
          } catch (_) {
            // Oscillators can only be stopped once.
          }
        });

        this.clearManagedTimeout(cleanupTimerId);
        cleanupTimerId = this.setManagedTimeout(cleanup, (releaseSec + 0.22) * 1000);
      }
    };

    this.liveVoices.add(controller);

    cleanupTimerId = this.setManagedTimeout(
      cleanup,
      Math.max(120, ((naturalEndTime - (this.context?.currentTime ?? 0)) + 0.3) * 1000)
    );

    return controller;
  }

  pickDroneIndex(profile, laneIndex, lastIndex) {
    const primary = laneIndex === 0
      ? profile.droneSet?.[0] ?? 0
      : profile.droneSet?.[1] ?? profile.droneColor?.[0] ?? profile.droneSet?.[0] ?? 0;

    const palette = [
      primary,
      ...(profile.droneColor || []),
      ...(profile.droneSet || [])
    ].filter((value, index, list) => value !== undefined && list.indexOf(value) === index);

    const weights = palette.map((value, index) => {
      if (value === primary) return laneIndex === 0 ? 1.18 : 0.38;
      if (laneIndex === 0) return 0.28 + (profile.motion * 0.2);
      return (index === 1 ? 1 : 0.66) + (profile.richness * 0.16);
    });

    const adjusted = weights.map((weight, index) => (
      palette[index] === lastIndex ? weight * 0.48 : weight
    ));

    return palette[chooseWeightedIndex(adjusted, -1, 0)] ?? primary;
  }

  connectVoiceToLayer(outputNode, layer) {
    outputNode.connect(this.layerBuses[layer]);
  }

  updateRecentIndices(recent, index, limit = 6) {
    return withRecent(recent, index, limit);
  }

  pickTermIdentityNoteIndex(termId) {
    const identity = getTermNoteIdentity(termId);
    const noteIndices = identity.noteIndices?.length ? identity.noteIndices : [0];

    if (noteIndices.length === 1) return noteIndices[0];

    const cursor = this.termIdentityCursor.get(termId) || 0;
    const nextIndex = noteIndices[cursor % noteIndices.length];
    this.termIdentityCursor.set(termId, cursor + 1);
    return nextIndex;
  }

  getTermIdentityMidi(noteIndex, profile) {
    const baseMidi = AMBIENT_NOTE_WORLD.highMidi[noteIndex] || AMBIENT_NOTE_WORLD.highMidi[0];

    if (profile.brightness < 0.34 && profile.topRegister < 0.42) return baseMidi - 12;
    if (profile.brightness > 0.76 && profile.topRegister > 0.72 && Math.random() < 0.24) return baseMidi + 12;
    return baseMidi;
  }

  createTermIdentityVoice({ midi, profile, startTime, pan, accent = 1 }) {
    const ctx = this.context;
    const attack = rand(0.006, 0.016);
    const decay = rand(0.22, 0.42);
    const release = rand(0.14, 0.28);
    const peak = (0.0086 + (profile.brightness * 0.0026) + (profile.motion * 0.0016)) * accent;

    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(MIN_GAIN, startTime);
    voiceGain.gain.linearRampToValueAtTime(peak, startTime + attack);
    voiceGain.gain.exponentialRampToValueAtTime(Math.max(MIN_GAIN, peak * 0.46), startTime + attack + decay);
    voiceGain.gain.exponentialRampToValueAtTime(MIN_GAIN, startTime + attack + decay + release);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 250 + (profile.brightness * 140) + (profile.topRegister * 80);
    highpass.Q.value = 0.48;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3000 + (profile.brightness * 2600) + (profile.topRegister * 520);
    lowpass.Q.value = 0.9;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(midiToFrequency(midi) * 1.012, startTime);
    osc.frequency.exponentialRampToValueAtTime(midiToFrequency(midi), startTime + 0.052);

    const harmonicOsc = ctx.createOscillator();
    harmonicOsc.type = 'sine';
    harmonicOsc.frequency.setValueAtTime(midiToFrequency(midi + 12), startTime);

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.value = 0.18 + (profile.brightness * 0.06);

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1700 + (profile.brightness * 1300);
    noiseFilter.Q.value = 1.05;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(MIN_GAIN, startTime);
    noiseGain.gain.linearRampToValueAtTime(0.00075 + (profile.texture * 0.0009), startTime + 0.008);
    noiseGain.gain.exponentialRampToValueAtTime(MIN_GAIN, startTime + 0.055);

    osc.connect(voiceGain);
    harmonicOsc.connect(harmonicGain);
    harmonicGain.connect(voiceGain);
    voiceGain.connect(highpass);
    highpass.connect(lowpass);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(lowpass);

    let outputNode = lowpass;
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      lowpass.connect(panner);
      outputNode = panner;
    }

    this.connectVoiceToLayer(outputNode, 'accent');

    osc.start(startTime);
    harmonicOsc.start(startTime);
    noiseSource.start(startTime);
    osc.stop(startTime + attack + decay + release + 0.06);
    harmonicOsc.stop(startTime + attack + decay + release + 0.06);
    noiseSource.stop(startTime + 0.07);

    return this.makeVoiceController({
      gainNode: voiceGain,
      sources: [osc, harmonicOsc, noiseSource],
      nodes: [
        osc,
        harmonicOsc,
        harmonicGain,
        noiseSource,
        noiseFilter,
        noiseGain,
        voiceGain,
        highpass,
        lowpass,
        outputNode
      ],
      naturalEndTime: startTime + attack + decay + release + 0.12
    });
  }

  playTermIdentity(termId = this.termId) {
    if (!this.context || this.context.state !== 'running') return false;

    const profile = this.resolveProfile(termId);
    const noteIndex = this.pickTermIdentityNoteIndex(termId);
    const midi = this.getTermIdentityMidi(noteIndex, profile);

    this.createTermIdentityVoice({
      midi,
      profile,
      startTime: this.context.currentTime + rand(0.002, 0.014),
      pan: rand(-0.16, 0.16),
      accent: 1.24 + rand(0, 0.16)
    });

    return true;
  }

  pickMelodicIndex({
    weights,
    lastIndex,
    recent = [],
    direction = 0,
    anchorIndex = -1,
    settle = false
  }) {
    if (!weights?.length) return 0;

    const scored = weights.map((weight, index) => {
      let score = Math.max(0.001, weight || 0.001);

      const recentPosition = recent.indexOf(index);
      if (recentPosition !== -1) {
        score *= 0.72 - (recentPosition * 0.06);
      }

      if (lastIndex >= 0) {
        const distance = Math.abs(index - lastIndex);

        if (distance === 0) score *= 0.14;
        else if (distance === 1) score *= 1.42;
        else if (distance === 2) score *= 0.94;
        else score *= 0.32;

        if (direction && distance > 0) {
          const actualDirection = Math.sign(index - lastIndex);
          score *= actualDirection === direction ? 1.16 : 0.84;
        }
      }

      if (anchorIndex >= 0) {
        const anchorDistance = Math.abs(index - anchorIndex);
        if (settle) {
          if (anchorDistance === 0) score *= 1.36;
          else if (anchorDistance === 1) score *= 1.12;
          else if (anchorDistance === 2) score *= 0.82;
          else score *= 0.46;
        } else if (anchorDistance >= 3) {
          score *= 0.66;
        }
      }

      return score;
    });

    return chooseWeightedIndex(scored, -1, 0);
  }

  createContinuousDroneSlot(laneIndex) {
    const ctx = this.context;
    const baseMidi = AMBIENT_NOTE_WORLD.lowMidi[0] || 38;
    const baseFrequency = midiToFrequency(baseMidi);

    const voiceGain = ctx.createGain();
    voiceGain.gain.value = MIN_GAIN;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 50 + (laneIndex * 6);
    highpass.Q.value = 0.3;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 300 + (laneIndex * 80);
    lowpass.Q.value = 0.18;

    const oscA = ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.setValueAtTime(baseFrequency, ctx.currentTime);
    oscA.detune.value = rand(-2.4, 2.4);

    const oscB = ctx.createOscillator();
    oscB.type = laneIndex === 0 ? 'triangle' : 'sine';
    oscB.frequency.setValueAtTime(baseFrequency * 2, ctx.currentTime);
    oscB.detune.value = rand(-3.6, 3.6);

    const oscBGain = ctx.createGain();
    oscBGain.gain.value = laneIndex === 0 ? 0.06 : 0.08;

    oscA.connect(voiceGain);
    oscB.connect(oscBGain);
    oscBGain.connect(voiceGain);
    voiceGain.connect(highpass);
    highpass.connect(lowpass);

    oscA.start();
    oscB.start();

    return {
      oscA,
      oscB,
      oscBGain,
      gainNode: voiceGain,
      highpass,
      lowpass
    };
  }

  fadeOutContinuousDroneSlot(slot, startTime, fadeSec) {
    slot.gainNode.gain.cancelScheduledValues(startTime);
    slot.gainNode.gain.setValueAtTime(Math.max(slot.gainNode.gain.value || MIN_GAIN, MIN_GAIN), startTime);
    slot.gainNode.gain.linearRampToValueAtTime(MIN_GAIN, startTime + fadeSec);
  }

  applyContinuousDroneSlotState(slot, state, startTime, fadeSec) {
    slot.oscA.frequency.cancelScheduledValues(startTime);
    slot.oscA.frequency.setValueAtTime(state.frequency, startTime);

    slot.oscB.frequency.cancelScheduledValues(startTime);
    slot.oscB.frequency.setValueAtTime(state.frequency * 2, startTime);

    slot.highpass.frequency.cancelScheduledValues(startTime);
    slot.highpass.frequency.setValueAtTime(state.highpassFrequency, startTime);

    slot.lowpass.frequency.cancelScheduledValues(startTime);
    slot.lowpass.frequency.setValueAtTime(state.lowpassFrequency, startTime);

    slot.oscBGain.gain.cancelScheduledValues(startTime);
    slot.oscBGain.gain.setValueAtTime(Math.max(MIN_GAIN, slot.oscBGain.gain.value || state.harmonicGain), startTime);
    slot.oscBGain.gain.linearRampToValueAtTime(state.harmonicGain, startTime + fadeSec);

    slot.gainNode.gain.cancelScheduledValues(startTime);
    slot.gainNode.gain.setValueAtTime(Math.max(slot.gainNode.gain.value || MIN_GAIN, MIN_GAIN), startTime);
    slot.gainNode.gain.linearRampToValueAtTime(state.gain, startTime + fadeSec);
  }

  createContinuousDroneLane(laneIndex) {
    const ctx = this.context;
    const laneOutput = ctx.createGain();
    laneOutput.gain.value = 1;

    let outputNode = laneOutput;
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = laneIndex === 0 ? -0.14 : 0.16;
      laneOutput.connect(panner);
      outputNode = panner;
    }

    this.connectVoiceToLayer(outputNode, 'drone');

    const slots = [
      this.createContinuousDroneSlot(laneIndex),
      this.createContinuousDroneSlot(laneIndex)
    ];

    slots.forEach((slot) => {
      slot.lowpass.connect(laneOutput);
    });

    let activeSlot = 0;
    let cleanedUp = false;
    let cleanupTimerId = null;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;

      slots.forEach((slot) => {
        [slot.oscA, slot.oscB].forEach((source) => {
          try {
            source.disconnect();
          } catch (_) {
            // Oscillators may already be disconnected during teardown.
          }
        });

        [slot.oscBGain, slot.gainNode, slot.highpass, slot.lowpass].forEach((node) => {
          try {
            node.disconnect();
          } catch (_) {
            // Nodes may already be disconnected during teardown.
          }
        });
      });

      try {
        laneOutput.disconnect();
      } catch (_) {
        // The lane output may already be disconnected.
      }

      if (outputNode !== laneOutput) {
        try {
          outputNode.disconnect();
        } catch (_) {
          // The panner may already be disconnected.
        }
      }
    };

    return {
      morphTo: (state, when = this.context?.currentTime ?? 0, fadeSec = 12) => {
        if (cleanedUp) return;

        const at = Math.max(this.context?.currentTime ?? 0, when);
        const incomingIndex = 1 - activeSlot;
        const incoming = slots[incomingIndex];
        const outgoing = slots[activeSlot];

        this.clearManagedTimeout(cleanupTimerId);
        this.applyContinuousDroneSlotState(incoming, state, at, fadeSec);
        this.fadeOutContinuousDroneSlot(outgoing, at, fadeSec);
        activeSlot = incomingIndex;
      },
      stop: (when = this.context?.currentTime ?? 0, releaseSec = 1.2) => {
        if (cleanedUp) return;

        const at = Math.max(this.context?.currentTime ?? 0, when);
        slots.forEach((slot) => {
          this.fadeOutContinuousDroneSlot(slot, at, releaseSec);
          [slot.oscA, slot.oscB].forEach((source) => {
            try {
              source.stop(at + releaseSec + 0.16);
            } catch (_) {
              // Oscillators can only be stopped once.
            }
          });
        });

        this.clearManagedTimeout(cleanupTimerId);
        cleanupTimerId = this.setManagedTimeout(cleanup, (releaseSec + 0.35) * 1000);
      }
    };
  }

  getContinuousDroneState(profile, laneIndex, noteIndex) {
    const midi = AMBIENT_NOTE_WORLD.lowMidi[noteIndex] || AMBIENT_NOTE_WORLD.lowMidi[0];
    const frequency = midiToFrequency(midi);
    const baseGain = laneIndex === 0
      ? 0.0048 + (profile.sustain * 0.0026) + (profile.warmth * 0.0012)
      : 0.0028 + (profile.richness * 0.0018) + (profile.brightness * 0.001) + (profile.motion * 0.0008);

    return {
      frequency,
      gain: baseGain,
      highpassFrequency: 48 + (profile.brightness * 18) + (laneIndex * 7),
      lowpassFrequency: (laneIndex === 0 ? 250 : 320) + (profile.brightness * 320) + (profile.texture * 90),
      harmonicGain: (laneIndex === 0 ? 0.04 : 0.06) + (profile.brightness * 0.04) + (profile.topRegister * 0.03)
    };
  }

  scheduleDroneLane(index, options = {}) {
    if (!this.context || !this.enabled || !this.schedulerStarted) return;

    const lane = this.droneLanes[index];
    if (!lane) return;

    const startTime = this.context.currentTime + (options.startDelaySec || 0);
    const profile = this.getProfile(startTime);
    const noteIndex = this.pickDroneIndex(profile, index, lane.lastIndex);
    const state = this.getContinuousDroneState(profile, index, noteIndex);
    const fadeSec = (options.force ? rand(9, 14) : rand(12, 20))
      * (1.06 + (profile.sustain * 0.08) - (profile.motion * 0.04));

    lane.controller?.morphTo(state, startTime, fadeSec);
    lane.lastIndex = noteIndex;

    const nextInSec = rand(28, 44) * (1.06 + (profile.sustain * 0.12) - (profile.pace * 0.04));
    lane.timer = window.setTimeout(() => this.scheduleDroneLane(index), nextInSec * 1000);
  }

  createMidVoice({ midi, profile, startTime, pan, accent = 1 }) {
    const ctx = this.context;
    const attack = rand(0.18, 0.78) * (1.08 - (profile.pace * 0.08));
    const hold = rand(0.6, 1.8) * (1.04 + (profile.sustain * 0.16));
    const release = rand(1.6, 3.8) * (1.04 - (profile.motion * 0.06));
    const peak = (0.0075 + (profile.richness * 0.01) + (profile.density * 0.003) + (profile.brightness * 0.002)) * accent;

    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(MIN_GAIN, startTime);
    voiceGain.gain.linearRampToValueAtTime(peak, startTime + attack);
    voiceGain.gain.linearRampToValueAtTime(peak * rand(0.7, 0.88), startTime + attack + hold);
    voiceGain.gain.linearRampToValueAtTime(MIN_GAIN, startTime + attack + hold + release);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 150 + (profile.brightness * 110) + (profile.topRegister * 90);
    highpass.Q.value = 0.34;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1500 + (profile.brightness * 2400) + (profile.topRegister * 600);
    lowpass.Q.value = 0.26;

    const oscA = ctx.createOscillator();
    oscA.type = profile.warmth > 0.58 ? 'triangle' : 'sine';
    oscA.frequency.setValueAtTime(midiToFrequency(midi), startTime);
    oscA.detune.value = rand(-4.2, 4.2);

    const oscB = ctx.createOscillator();
    oscB.type = 'sine';
    oscB.frequency.setValueAtTime(midiToFrequency(midi + 12), startTime);
    oscB.detune.value = rand(-5.2, 5.2);

    const oscBGain = ctx.createGain();
    oscBGain.gain.value = 0.08 + (profile.brightness * 0.06) + (profile.topRegister * 0.04);

    oscA.connect(voiceGain);
    oscB.connect(oscBGain);
    oscBGain.connect(voiceGain);
    voiceGain.connect(highpass);
    highpass.connect(lowpass);

    let outputNode = lowpass;
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      lowpass.connect(panner);
      outputNode = panner;
    }

    this.connectVoiceToLayer(outputNode, 'mid');

    oscA.start(startTime);
    oscB.start(startTime);
    oscA.stop(startTime + attack + hold + release + 0.12);
    oscB.stop(startTime + attack + hold + release + 0.12);

    return this.makeVoiceController({
      gainNode: voiceGain,
      sources: [oscA, oscB],
      nodes: [oscA, oscB, oscBGain, voiceGain, highpass, lowpass, outputNode],
      naturalEndTime: startTime + attack + hold + release + 0.2
    });
  }

  composeMidFragment(index, lane, profile) {
    const maxNotes = Math.max(2, 3 + Math.round((profile.motion * 2) + (profile.density * 1.5)));
    const noteCount = randomInt(2, maxNotes);
    const baseSpacing = rand(0.92, 1.82) * (1.08 - (profile.pace * 0.14)) * (1.06 - (profile.motion * 0.08));
    const jitter = 0.22 + (profile.texture * 0.12);
    const registerBias = [0.02, 0.16, 0.28][index] ?? 0.1;
    const anchorIndex = lane.anchorIndex >= 0 && Math.random() > 0.42
      ? lane.anchorIndex
      : chooseWeightedIndex(profile.midWeights, lane.lastIndex, 0.14);

    lane.anchorIndex = anchorIndex;

    let direction = lane.contour || (Math.random() < 0.5 ? -1 : 1);
    let current = lane.lastIndex >= 0 ? lane.lastIndex : anchorIndex;

    if (current <= 1) direction = 1;
    if (current >= profile.midWeights.length - 2) direction = -1;

    const notes = [];
    let offset = rand(0.06, 0.24);

    for (let step = 0; step < noteCount; step += 1) {
      const settle = step === noteCount - 1 && Math.random() < 0.7;
      const nextIndex = step === 0 && lane.lastIndex < 0
        ? anchorIndex
        : this.pickMelodicIndex({
          weights: profile.midWeights,
          lastIndex: current,
          recent: lane.recent,
          direction,
          anchorIndex,
          settle
        });

      current = nextIndex;
      lane.recent = this.updateRecentIndices(lane.recent, current, 7);

      const liftChance = clamp01(0.22 + registerBias + (profile.brightness * 0.18) + (profile.topRegister * 0.16));
      const octaveLift = Math.random() < liftChance ? 12 : 0;
      const accent = step === 0 || settle ? 1.02 + rand(0, 0.12) : 0.84 + rand(0, 0.14);

      notes.push({
        index: current,
        offset,
        octaveLift,
        accent
      });

      if (current <= 0) direction = 1;
      else if (current >= profile.midWeights.length - 1) direction = -1;
      else if (Math.random() < 0.16 + (profile.motion * 0.18)) direction *= -1;

      offset += Math.max(0.54, baseSpacing + rand(-jitter, jitter));
    }

    lane.lastIndex = current;
    lane.contour = direction;

    const lastOffset = notes[notes.length - 1]?.offset ?? 0.2;
    return {
      notes,
      durationSec: lastOffset + rand(2, 3.6)
    };
  }

  scheduleMidLane(index) {
    if (!this.context || !this.enabled || !this.schedulerStarted) return;

    const lane = this.midLanes[index];
    if (!lane) return;

    const now = this.context.currentTime;
    const profile = this.getProfile(now);
    const phraseChance = clamp01(0.74 + (profile.richness * 0.14) + (profile.motion * 0.12) - (index * 0.08));
    let phraseDuration = rand(1.8, 2.8);

    if (Math.random() < phraseChance) {
      const phrase = this.composeMidFragment(index, lane, profile);
      const laneCenter = [-0.32, 0.02, 0.34][index] ?? 0;

      phrase.notes.forEach(({ index: noteIndex, offset, octaveLift, accent }) => {
        const midi = (AMBIENT_NOTE_WORLD.midMidi[noteIndex] || AMBIENT_NOTE_WORLD.midMidi[0]) + octaveLift;

        this.createMidVoice({
          midi,
          profile,
          startTime: now + offset,
          pan: clamp(rand(laneCenter - 0.2, laneCenter + 0.2), -0.68, 0.68),
          accent
        });
      });

      phraseDuration = phrase.durationSec;
    } else {
      lane.contour *= -1;
    }

    const rest = rand(1.2, 3.2) * (1.08 - (profile.motion * 0.14) - (profile.pace * 0.1) + ((1 - profile.density) * 0.1));
    lane.timer = window.setTimeout(() => this.scheduleMidLane(index), (phraseDuration + rest) * 1000);
  }

  getAccentWeights(profile) {
    const emphasis = [0.42, 1.02, 1.16, 1.08, 0.92];
    return profile.midWeights.map((weight, index) => Math.max(0.01, (weight || 0.01) * (emphasis[index] ?? 1)));
  }

  createAccentVoice({ midi, profile, startTime, pan, accent = 1 }) {
    const ctx = this.context;
    const attack = rand(0.016, 0.05);
    const decay = rand(0.52, 1.08) * (1.04 + (profile.texture * 0.12));
    const release = rand(0.28, 0.92) * (1.02 + ((1 - profile.pace) * 0.08));
    const peak = (0.0032 + (profile.motion * 0.0034) + (profile.texture * 0.0012) + (profile.brightness * 0.001)) * accent;

    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(MIN_GAIN, startTime);
    voiceGain.gain.linearRampToValueAtTime(peak, startTime + attack);
    voiceGain.gain.exponentialRampToValueAtTime(Math.max(MIN_GAIN, peak * 0.52), startTime + attack + decay);
    voiceGain.gain.exponentialRampToValueAtTime(MIN_GAIN, startTime + attack + decay + release);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 170 + (profile.brightness * 130) + (profile.texture * 60);
    highpass.Q.value = 0.36;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1500 + (profile.brightness * 1700) + (profile.topRegister * 320);
    lowpass.Q.value = 0.62;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(midiToFrequency(midi) * 1.01, startTime);
    osc.frequency.exponentialRampToValueAtTime(midiToFrequency(midi), startTime + 0.08);

    const harmonicOsc = ctx.createOscillator();
    harmonicOsc.type = 'sine';
    harmonicOsc.frequency.setValueAtTime(midiToFrequency(midi + 12), startTime);

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.value = 0.08 + (profile.brightness * 0.05) + (profile.texture * 0.02);

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1100 + (profile.brightness * 1200);
    noiseFilter.Q.value = 0.82;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(MIN_GAIN, startTime);
    noiseGain.gain.linearRampToValueAtTime(0.00055 + (profile.texture * 0.0012), startTime + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(MIN_GAIN, startTime + 0.075);

    osc.connect(voiceGain);
    harmonicOsc.connect(harmonicGain);
    harmonicGain.connect(voiceGain);
    voiceGain.connect(highpass);
    highpass.connect(lowpass);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(lowpass);

    let outputNode = lowpass;
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      lowpass.connect(panner);
      outputNode = panner;
    }

    this.connectVoiceToLayer(outputNode, 'accent');

    osc.start(startTime);
    harmonicOsc.start(startTime);
    noiseSource.start(startTime);
    osc.stop(startTime + attack + decay + release + 0.08);
    harmonicOsc.stop(startTime + attack + decay + release + 0.08);
    noiseSource.stop(startTime + 0.09);

    return this.makeVoiceController({
      gainNode: voiceGain,
      sources: [osc, harmonicOsc, noiseSource],
      nodes: [
        osc,
        harmonicOsc,
        harmonicGain,
        noiseSource,
        noiseFilter,
        noiseGain,
        voiceGain,
        highpass,
        lowpass,
        outputNode
      ],
      naturalEndTime: startTime + attack + decay + release + 0.14
    });
  }

  composeAccentCluster(profile) {
    const weights = this.getAccentWeights(profile);
    const maxNotes = Math.max(1, 1 + Math.round((profile.motion * 1.2) + (profile.texture * 0.7) + (profile.brightness * 0.5) - (profile.sustain * 0.35)));
    const noteCount = randomInt(1, Math.min(3, maxNotes));
    const baseSpacing = rand(0.34, 1.18) * (1.06 - (profile.pace * 0.08));
    const jitter = 0.12 + (profile.texture * 0.16);
    const anchorIndex = this.accentAnchorIndex >= 0 && Math.random() > 0.5
      ? this.accentAnchorIndex
      : chooseWeightedIndex(weights, this.lastAccentIndex, 0.16);

    this.accentAnchorIndex = anchorIndex;

    let direction = this.accentContour || (Math.random() < 0.5 ? -1 : 1);
    let current = this.lastAccentIndex >= 0 ? this.lastAccentIndex : anchorIndex;

    if (current <= 1) direction = 1;
    if (current >= weights.length - 2) direction = -1;

    const notes = [];
    let offset = rand(0.05, 0.18);

    for (let step = 0; step < noteCount; step += 1) {
      const nextIndex = step === 0 && this.lastAccentIndex < 0
        ? anchorIndex
        : this.pickMelodicIndex({
          weights,
          lastIndex: current,
          recent: this.accentRecent,
          direction,
          anchorIndex,
          settle: step === noteCount - 1 && Math.random() < 0.38
        });

      current = nextIndex;
      this.accentRecent = this.updateRecentIndices(this.accentRecent, current, 6);

      let midi = AMBIENT_NOTE_WORLD.midMidi[current] || AMBIENT_NOTE_WORLD.midMidi[0];
      if (Math.random() < Math.max(0, profile.topRegister - 0.66) * 0.18) midi += 12;

      notes.push({
        midi,
        offset,
        accent: 0.88 + rand(0, 0.24)
      });

      if (current <= 1) direction = 1;
      else if (current >= weights.length - 2) direction = -1;
      else if (Math.random() < 0.22 + (profile.motion * 0.1)) direction *= -1;

      offset += Math.max(0.22, baseSpacing + rand(-jitter, jitter));
    }

    this.lastAccentIndex = current;
    this.accentContour = direction;

    const lastOffset = notes[notes.length - 1]?.offset ?? 0.12;
    return {
      notes,
      durationSec: lastOffset + rand(0.9, 1.7)
    };
  }

  scheduleAccentEvent() {
    if (!this.context || !this.enabled || !this.schedulerStarted) return;

    const now = this.context.currentTime;
    const profile = this.getProfile(now);
    const playChance = clamp01(
      0.08
      + (profile.motion * 0.34)
      + (profile.brightness * 0.14)
      + (profile.texture * 0.12)
      + (profile.pace * 0.08)
      - (profile.sustain * 0.26)
    );

    let clusterDuration = rand(0.8, 1.4);

    if (Math.random() < playChance) {
      const cluster = this.composeAccentCluster(profile);

      cluster.notes.forEach(({ midi, offset, accent }) => {
        this.createAccentVoice({
          midi,
          profile,
          startTime: now + offset + rand(-0.03, 0.05),
          pan: rand(-0.56, 0.56),
          accent
        });
      });

      clusterDuration = cluster.durationSec;
    } else {
      this.accentContour *= -1;
    }

    const spacing = clusterDuration + (
      rand(4.8, 13.5)
      * (1.08 + (profile.sustain * 0.14) - (profile.motion * 0.2) - (profile.pace * 0.08))
    ) + ((1 - profile.density) * 1.2);

    this.accentTimer = window.setTimeout(() => this.scheduleAccentEvent(), spacing * 1000);
  }

  createPluckVoice({ midi, profile, startTime, pan, accent = 1 }) {
    const ctx = this.context;
    const decay = 1 + (profile.texture * 0.9) + ((1 - profile.pace) * 0.4);
    const peak = (0.0045 + (profile.motion * 0.007) + (profile.brightness * 0.004) + (profile.topRegister * 0.002)) * accent;

    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(MIN_GAIN, startTime);
    voiceGain.gain.linearRampToValueAtTime(peak, startTime + 0.018);
    voiceGain.gain.exponentialRampToValueAtTime(Math.max(MIN_GAIN, peak * 0.48), startTime + 0.24);
    voiceGain.gain.exponentialRampToValueAtTime(MIN_GAIN, startTime + decay);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 420 + (profile.brightness * 280) + (profile.topRegister * 180);
    highpass.Q.value = 0.38;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 2800 + (profile.brightness * 3400) + (profile.topRegister * 1000);
    lowpass.Q.value = 0.88;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(midiToFrequency(midi) * 1.012, startTime);
    osc.frequency.exponentialRampToValueAtTime(midiToFrequency(midi), startTime + 0.09);
    osc.frequency.exponentialRampToValueAtTime(midiToFrequency(midi) * 0.998, startTime + (decay * 0.72));

    const harmonicOsc = ctx.createOscillator();
    harmonicOsc.type = 'sine';
    harmonicOsc.frequency.setValueAtTime(midiToFrequency(midi + 12), startTime);

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.value = 0.18 + (profile.brightness * 0.08) + (profile.topRegister * 0.04);

    const airOsc = ctx.createOscillator();
    airOsc.type = 'sine';
    airOsc.frequency.setValueAtTime(midiToFrequency(midi + 24), startTime);

    const airGain = ctx.createGain();
    airGain.gain.value = 0.05 + (profile.topRegister * 0.05) + (profile.brightness * 0.04);

    osc.connect(voiceGain);
    harmonicOsc.connect(harmonicGain);
    harmonicGain.connect(voiceGain);
    airOsc.connect(airGain);
    airGain.connect(voiceGain);
    voiceGain.connect(highpass);
    highpass.connect(lowpass);

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2200 + (profile.brightness * 2400);
    noiseFilter.Q.value = 0.7;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(MIN_GAIN, startTime);
    noiseGain.gain.linearRampToValueAtTime(0.0008 + (profile.texture * 0.0022), startTime + 0.008);
    noiseGain.gain.exponentialRampToValueAtTime(MIN_GAIN, startTime + 0.11);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(lowpass);

    let outputNode = lowpass;
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      lowpass.connect(panner);
      outputNode = panner;
    }

    this.connectVoiceToLayer(outputNode, 'top');

    osc.start(startTime);
    harmonicOsc.start(startTime);
    airOsc.start(startTime);
    noiseSource.start(startTime);
    osc.stop(startTime + decay + 0.12);
    harmonicOsc.stop(startTime + decay + 0.12);
    airOsc.stop(startTime + decay + 0.12);
    noiseSource.stop(startTime + 0.14);

    return this.makeVoiceController({
      gainNode: voiceGain,
      sources: [osc, harmonicOsc, airOsc, noiseSource],
      nodes: [
        osc,
        harmonicOsc,
        harmonicGain,
        airOsc,
        airGain,
        noiseSource,
        noiseFilter,
        noiseGain,
        voiceGain,
        highpass,
        lowpass,
        outputNode
      ],
      naturalEndTime: startTime + decay + 0.2
    });
  }

  composeTopCluster(profile) {
    const maxNotes = Math.max(1, 1 + Math.round((profile.motion * 1.4) + (profile.brightness * 1.2) + (profile.topRegister * 1.1)));
    const noteCount = randomInt(1, maxNotes);
    const baseSpacing = rand(0.32, 0.88) * (1.08 - (profile.pace * 0.1));
    const jitter = 0.08 + (profile.texture * 0.08);
    const anchorIndex = this.topAnchorIndex >= 0 && Math.random() > 0.46
      ? this.topAnchorIndex
      : chooseWeightedIndex(profile.topWeights, this.lastTopIndex, 0.12);

    this.topAnchorIndex = anchorIndex;

    let direction = this.topContour || (Math.random() < 0.5 ? -1 : 1);
    let current = this.lastTopIndex >= 0 ? this.lastTopIndex : anchorIndex;

    if (current <= 1) direction = 1;
    if (current >= profile.topWeights.length - 2) direction = -1;

    const notes = [];
    let offset = rand(0.05, 0.18);

    for (let step = 0; step < noteCount; step += 1) {
      const settle = step === noteCount - 1;
      const nextIndex = step === 0 && this.lastTopIndex < 0
        ? anchorIndex
        : this.pickMelodicIndex({
          weights: profile.topWeights,
          lastIndex: current,
          recent: this.topRecent,
          direction,
          anchorIndex,
          settle
        });

      current = nextIndex;
      this.topRecent = this.updateRecentIndices(this.topRecent, current, 7);

      let midi = AMBIENT_NOTE_WORLD.highMidi[current] || AMBIENT_NOTE_WORLD.highMidi[0];
      if (Math.random() < (0.24 + (profile.topRegister * 0.32) + (profile.brightness * 0.12))) midi += 12;
      if (Math.random() < Math.max(0, profile.topRegister - 0.78) * 0.24) midi += 12;

      const accent = noteCount === 1 || step === noteCount - 1
        ? 1 + rand(0, 0.12)
        : 0.82 + rand(0, 0.14);

      notes.push({
        midi,
        offset,
        accent
      });

      if (current <= 0) direction = 1;
      else if (current >= profile.topWeights.length - 1) direction = -1;
      else if (Math.random() < 0.18 + (profile.motion * 0.16)) direction *= -1;

      offset += Math.max(0.22, baseSpacing + rand(-jitter, jitter));
    }

    this.lastTopIndex = current;
    this.topContour = direction;

    const lastOffset = notes[notes.length - 1]?.offset ?? 0.16;
    return {
      notes,
      durationSec: lastOffset + rand(0.9, 1.6)
    };
  }

  scheduleTopEvent() {
    if (!this.context || !this.enabled || !this.schedulerStarted) return;

    const now = this.context.currentTime;
    const profile = this.getProfile(now);
    const playChance = clamp01(0.62 + (profile.motion * 0.18) + (profile.brightness * 0.12) - (profile.sustain * 0.06));
    let clusterDuration = rand(1.2, 2.2);

    if (Math.random() < playChance) {
      const cluster = this.composeTopCluster(profile);

      cluster.notes.forEach(({ midi, offset, accent }) => {
        this.createPluckVoice({
          midi,
          profile,
          startTime: now + offset,
          pan: rand(-0.74, 0.74),
          accent
        });
      });

      clusterDuration = cluster.durationSec;
    } else {
      this.topContour *= -1;
    }

    const spacing = clusterDuration
      + (rand(1.6, 4.2) * (1.12 - (profile.motion * 0.18) - (profile.pace * 0.14)))
      + ((1 - profile.density) * 0.6);

    this.topTimer = window.setTimeout(() => this.scheduleTopEvent(), spacing * 1000);
  }
}

export default AmbientAudioEngine;
