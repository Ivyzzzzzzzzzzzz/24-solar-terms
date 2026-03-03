import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TERM_LIST, HOU_MAP, TERM_COLORS } from '../data';
import './SolarDial.css';

const SolarDial = ({ onTermChange }) => {
  const navigate = useNavigate();
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [state, setState] = useState({
    currentTermIndex: 0,
    ringRotations: {
      name: 0,
      date: 0,
      lon: 0,
      daynight: 0,
      hou: 0,
      allTerms: 0
    },
    outerMode: 'terms',
    tooltip: { text: '', x: 0, y: 0, visible: false },
    isDragging: false
  });

  const dialRef = useRef(null);
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const audioCtxRef = useRef(null);
  const moveRafRef = useRef(null);
  const pendingMoveRef = useRef(null);
  const currentTermIndexRef = useRef(0);

  const N = TERM_LIST.length;
  const TEXT_TOP_OFFSET = 180;
  const RING_UNITS = { name: N, date: 365, lon: 360, daynight: 24 };

  // Utility functions
  const mod = (n, m) => ((n % m) + m) % m;
  const normDeg = (d) => {
    let x = ((d % 360) + 360) % 360;
    return x >= 180 ? x - 360 : x;
  };

  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  const isLeapYear = (year) => new Date(year, 1, 29).getMonth() === 1;

  const dayOfYearFloat = (date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    const ms = date - start;
    return ms / 86400000 + 1;
  };

  const estimateDayHours = (doy) => {
    const t = ((doy - 172) / 365) * (Math.PI * 2);
    const v = Math.cos(t);
    const day = 12 + 3 * v;
    return Math.max(8.5, Math.min(15.5, day));
  };

  const getTodayInfo = () => {
    const now = new Date();
    const yearDays = isLeapYear(now.getFullYear()) ? 366 : 365;
    const doy = dayOfYearFloat(now);
    const yearProgress = Math.min(1, Math.max(0, doy / yearDays));
    const daysLeftYear = Math.max(0, yearDays - doy);

    const terms = [...TERM_LIST].sort((a, b) => a.doy - b.doy);
    let idx = terms.length - 1;
    for (let i = 0; i < terms.length; i++) {
      if (doy >= terms[i].doy) idx = i;
    }

    const current = terms[idx];
    const next = terms[(idx + 1) % terms.length];
    const termLen =
      next.doy > current.doy ? next.doy - current.doy : yearDays - current.doy + next.doy;
    const pos = doy >= current.doy ? doy - current.doy : yearDays - current.doy + doy;
    const houLen = termLen / 3;
    const houIndex = Math.min(3, Math.floor(pos / houLen) + 1);
    const houProgress = Math.max(0, Math.min(1, (pos - (houIndex - 1) * houLen) / houLen));
    const daysToNextHou = Math.max(0, houLen - (pos - (houIndex - 1) * houLen));

    return { currentTerm: current, yearProgress, daysLeftYear, houIndex, houProgress, daysToNextHou };
  };

  const getTodayDateLabels = () => {
    const now = new Date();
    const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
    const dateEn = `${monthNames[now.getMonth()]} ${now.getDate()}`;
    const dateZh = `${now.getMonth() + 1}月${now.getDate()}日`;
    return { dateEn, dateZh };
  };

  const rotationFromValue = (value, units) => {
    const deg = (Number(value) / units) * 360;
    return TEXT_TOP_OFFSET + deg;
  };

  const valueFromRotation = (rot, units) => {
    const deg = mod(rot - TEXT_TOP_OFFSET, 360);
    return (deg / 360) * units;
  };

  const rotationForTerm = (kind, idx) => {
    if (kind === 'name') {
      const step = 360 / N;
      return TEXT_TOP_OFFSET + idx * step;
    }
    const units = RING_UNITS[kind];
    const term = TERM_LIST[idx];
    let value = 0;
    if (kind === 'date') value = term.doy || 0;
    else if (kind === 'lon') value = mod(term.solarLon || 0, 360);
    return rotationFromValue(value, units);
  };

  const hexToRgb = (hex) => {
    const h = String(hex).replace('#', '').trim();
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };

  const mix = (a, b, t) => ({
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t)
  });

  const rgbStr = (c) => `rgb(${c.r}, ${c.g}, ${c.b})`;

  const setTermTheme = (term) => {
    const paper = { r: 246, g: 241, b: 234 };
    const entry = TERM_COLORS[term.id] || { base: '#9aa6b2' };
    const base = hexToRgb(entry.base);

    const sum = (term.dayH + term.nightH) || 24;
    const dayBias = clamp01(term.dayH / sum);
    const lightT = 0.48 + 0.36 * dayBias;

    const track = mix(base, paper, Math.min(0.94, lightT + 0.22));
    const fill = mix(base, paper, Math.min(0.88, lightT + 0.1));
    const rim = mix(base, paper, 0.78);

    const root = document.documentElement.style;
    root.setProperty('--term-base', entry.base);
    root.setProperty('--term-track', rgbStr(track));
    root.setProperty('--term-fill', rgbStr(fill));
    root.setProperty('--term-rim', rgbStr(rim));
    root.setProperty('--term-text', rgbStr(mix(base, { r: 20, g: 18, b: 16 }, 0.65)));
  };

  const valueForTerm = (kind, term) => {
    if (kind === 'date') return Number(term.doy || 0);
    if (kind === 'lon') return mod(Number(term.solarLon || 0), 360);
    if (kind === 'daynight') return Number(term.dayH || 0);
    return 0;
  };

  const circularDistance = (a, b, units) => {
    const d = Math.abs(a - b);
    return Math.min(d, units - d);
  };

  const nearestTermIndexFor = (kind, value) => {
    let bestI = 0;
    let bestD = Infinity;

    for (let i = 0; i < TERM_LIST.length; i++) {
      const v = valueForTerm(kind, TERM_LIST[i]);
      let dist;
      if (kind === 'date') dist = circularDistance(value, v, 365);
      else if (kind === 'lon') dist = circularDistance(value, v, 360);
      else dist = Math.abs(value - v);

      if (dist < bestD) {
        bestD = dist;
        bestI = i;
      }
    }
    return bestI;
  };

  const outerRotationForIndex = (idx) => {
    const step = 360 / N;
    return -step * (idx + 0.5);
  };

  const indexFromOuterRotation = (rot) => {
    const step = 360 / N;
    const raw = (-rot / step) - 0.5 + 1e-6;
    return mod(Math.round(raw), N);
  };

  const annularGuidePath = (cx, cy, rOuter, rInner, startDeg, endDeg) => {
    const a0 = (startDeg - 90) * Math.PI / 180;
    const a1 = (endDeg - 90) * Math.PI / 180;
    const x0 = cx + Math.cos(a0) * rOuter;
    const y0 = cy + Math.sin(a0) * rOuter;
    const x1 = cx + Math.cos(a1) * rOuter;
    const y1 = cy + Math.sin(a1) * rOuter;
    const x2 = cx + Math.cos(a1) * rInner;
    const y2 = cy + Math.sin(a1) * rInner;
    const x3 = cx + Math.cos(a0) * rInner;
    const y3 = cy + Math.sin(a0) * rInner;
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;

    return [
      `M ${x0.toFixed(2)} ${y0.toFixed(2)}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      `L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}`,
      'Z'
    ].join(' ');
  };

  const angleFromPointer = (evt) => {
    if (!svgRef.current) return 0;
    const pt = svgRef.current.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return 0;
    const p = pt.matrixTransform(ctm.inverse());
    const dx = p.x - 200;
    const dy = p.y - 200;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  const radiusFromPointer = (evt) => {
    if (!svgRef.current) return 0;
    const pt = svgRef.current.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return 0;
    const p = pt.matrixTransform(ctm.inverse());
    const dx = p.x - 200;
    const dy = p.y - 200;
    return Math.hypot(dx, dy);
  };

  const clickFeedback = () => {
    try {
      if (navigator.vibrate) navigator.vibrate(8);
    } catch (_) {}
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();

      const t0 = audioCtxRef.current.currentTime;
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(900, t0);

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.03, t0 + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03);

      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      osc.start(t0);
      osc.stop(t0 + 0.035);
    } catch (_) {}
  };

  const applyTermToAll = (idx) => {
    const term = TERM_LIST[idx];
    setTermTheme(term);
    
    const info = getTodayInfo();
    const yearPct = Math.round(info.yearProgress * 100);

    setState(prev => ({
      ...prev,
      currentTermIndex: idx
    }));
  };

  const handlePointerDown = (ringKind, e) => {
    if (ringKind !== 'outer') return;
    if (!hasUserInteracted) setHasUserInteracted(true);

    e.preventDefault();

    const target = e.currentTarget;
    if (target && target.setPointerCapture) {
      try {
        target.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    dragRef.current = {
      kind: ringKind,
      lastAngle: angleFromPointer(e),
      startRot: state.ringRotations[ringKind === 'outer' ? 'allTerms' : ringKind]
    };

    setState(prev => (prev.isDragging ? prev : { ...prev, isDragging: true }));
  };

  const handleSvgPointerDown = (e) => {
    const r = radiusFromPointer(e);
    if (r >= 168 && r <= 196) {
      handlePointerDown('outer', e);
    }
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;

    const newAngle = angleFromPointer(e);
    const delta = normDeg(newAngle - dragRef.current.lastAngle);
    const newRot = dragRef.current.startRot + delta;

    let nextIdx = state.currentTermIndex;

    if (dragRef.current.kind === 'outer') {
      nextIdx = indexFromOuterRotation(newRot);
    }

    pendingMoveRef.current = {
      kind: dragRef.current.kind,
      newRot,
      nextIdx
    };

    if (!moveRafRef.current) {
      moveRafRef.current = requestAnimationFrame(() => {
        moveRafRef.current = null;
        const pending = pendingMoveRef.current;
        if (!pending) return;

        if (pending.nextIdx !== currentTermIndexRef.current) {
          setTermTheme(TERM_LIST[pending.nextIdx]);
          currentTermIndexRef.current = pending.nextIdx;
        }

        setState(prev => ({
          ...prev,
          ringRotations: {
            ...prev.ringRotations,
            [pending.kind === 'outer' ? 'allTerms' : pending.kind]: pending.newRot,
            date: rotationForTerm('date', pending.nextIdx)
          },
          currentTermIndex: pending.nextIdx
        }));
      });
    }

    dragRef.current.lastAngle = newAngle;
    dragRef.current.startRot = newRot;
  };

  const handlePointerUp = () => {
    if (!dragRef.current) return;

    const kind = dragRef.current.kind;
    let finalIdx = state.currentTermIndex;

    if (kind === 'outer') {
      finalIdx = indexFromOuterRotation(state.ringRotations.allTerms);
    }

    snapAllRings(finalIdx);
    dragRef.current = null;
    pendingMoveRef.current = null;

    if (moveRafRef.current) {
      cancelAnimationFrame(moveRafRef.current);
      moveRafRef.current = null;
    }
  };

  const snapAllRings = (idx) => {
    applyTermToAll(idx);

    setState(prev => ({
      ...prev,
      ringRotations: {
        name: 0,
        date: rotationForTerm('date', idx),
        lon: 0,
        daynight: 0,
        hou: 0,
        allTerms: outerRotationForIndex(idx)
      },
      currentTermIndex: idx,
      isDragging: false
    }));

    clickFeedback();
  };

  const handleCenterClick = () => {
    const term = TERM_LIST[state.currentTermIndex];
    if (term) {
      navigate(`/term/${term.id}`);
    }
  };

  const handleTermTextClick = (idx) => {
    if (!hasUserInteracted) setHasUserInteracted(true);
    snapAllRings(idx);
  };

  // Initialize on mount
  useEffect(() => {
    const todayInfo = getTodayInfo();
    const initialIdx = TERM_LIST.findIndex(t => t.id === todayInfo.currentTerm.id);
    const startIdx = initialIdx >= 0 ? initialIdx : 0;

    applyTermToAll(startIdx);

    setState(prev => ({
      ...prev,
      ringRotations: {
        name: 0,
        date: rotationForTerm('date', startIdx),
        lon: 0,
        daynight: 0,
        hou: 0,
        allTerms: outerRotationForIndex(startIdx)
      },
      currentTermIndex: startIdx
    }));
  }, []);

  // Add event listeners
  useEffect(() => {
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      if (moveRafRef.current) {
        cancelAnimationFrame(moveRafRef.current);
        moveRafRef.current = null;
      }
    };
  }, [state]);

  useEffect(() => {
    currentTermIndexRef.current = state.currentTermIndex;
  }, [state.currentTermIndex]);

  useEffect(() => {
    if (typeof onTermChange === 'function') {
      onTermChange(TERM_LIST[state.currentTermIndex], state.currentTermIndex);
    }
  }, [state.currentTermIndex, onTermChange]);

  const term = TERM_LIST[state.currentTermIndex];
  const todayInfo = getTodayInfo();
  const todayDateLabels = getTodayDateLabels();
  const currentYearDays = isLeapYear(new Date().getFullYear()) ? 366 : 365;
  const termDoy = Number(term?.doy || 1);
  const termYearProgress = clamp01(termDoy / currentYearDays);
  const termDaysLeftYear = Math.max(0, currentYearDays - termDoy);
  const activeYearProgress = hasUserInteracted ? termYearProgress : todayInfo.yearProgress;
  const activeDaysLeftYear = hasUserInteracted ? termDaysLeftYear : todayInfo.daysLeftYear;
  const dialDateEn = hasUserInteracted ? (term?.dateEn || 'Dec. 21') : todayDateLabels.dateEn;
  const dialDateZh = hasUserInteracted ? (term?.dateZh || '十二月二十一') : todayDateLabels.dateZh;
  const yearRingProgress = Math.max(0, Math.min(1, activeYearProgress || 0));
  const yearBoxTrackPath = annularGuidePath(200, 200, 98, 86, 0, 359.9);
  const yearBoxProgressEnd = -90 + (yearRingProgress * 360);
  const yearBoxProgressPath = annularGuidePath(200, 200, 98, 86, -90, yearBoxProgressEnd);
  const outerSnapGuidePath = annularGuidePath(200, 200, 186, 166, -10.5, 10.5);

  return (
    <div className="landing-dial" id="landingDial" ref={dialRef}>
      <div id="outerTip" className="outer-tip en" aria-hidden="true" style={{
        opacity: state.tooltip.visible ? 1 : 0,
        transform: `translate(${state.tooltip.x}px, ${state.tooltip.y}px)`
      }}>
        {state.tooltip.text}
      </div>

      <svg
        ref={svgRef}
        className={`dial-svg${state.isDragging ? ' is-dragging' : ''}`}
        viewBox="0 0 400 400"
        role="img"
        aria-label="Solar term dial"
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handlePointerMove}
      >
        <defs>
          <filter id="inkWobble" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012"
              numOctaves="2"
              seed="3"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="7s"
                values="0.010;0.016;0.010"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="10"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="dialBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
          </filter>

          <path id="pAllTerms" d="M 200 25  A 175 175 0 1 1 200 375 A 175 175 0 1 1 200 25" fill="none" />
          <path id="pOuterEn" d="M 200 8   A 192 192 0 1 1 200 392 A 192 192 0 1 1 200 8" fill="none" />
          <path id="pDate" d="M 200 72  A 128 128 0 1 1 199.9 72" fill="none" />
          <path id="pLon" d="M 292 200 A 92 92 0 1 1 108 200 A 92 92 0 1 1 292 200" fill="none" />
          <path id="pDayN" d="M 350 200 A 150 150 0 1 1 50 200 A 150 150 0 1 1 350 200" fill="none" />
        </defs>

        <circle cx="200" cy="200" r="170" className="dial-halo" filter="url(#dialBlur)" />

        <g id="dialTicks" aria-hidden="true">
          {/* Ticks will be rendered here */}
          {TERM_LIST.map((_, i) => {
            const step = 360 / N;
            const angle = i * step;
            const majorEvery = N % 4 === 0 ? N / 4 : Math.max(1, Math.round(N / 4));
            const isMajor = i % majorEvery === 0;
            const rOuter = 180;
            const rInner = isMajor ? 164 : 172;
            const theta = (angle - 90) * (Math.PI / 180);
            const x1 = 200 + Math.cos(theta) * rOuter;
            const y1 = 200 + Math.sin(theta) * rOuter;
            const x2 = 200 + Math.cos(theta) * rInner;
            const y2 = 200 + Math.sin(theta) * rInner;
            return (
              <line
                key={`tick-${i}`}
                x1={x1.toFixed(2)}
                y1={y1.toFixed(2)}
                x2={x2.toFixed(2)}
                y2={y2.toFixed(2)}
                className={`dial-tick ${isMajor ? 'major' : 'minor'}`}
              />
            );
          })}
        </g>

        <g id="outerSnapGuide" aria-hidden="true" className="outer-snap-guide">
          <path className="outer-snap-highlight" d={outerSnapGuidePath} />
        </g>

        {/* Outermost ring with all terms */}
        <g
          className="dial-ring dial-ring-static dial-ring-outer"
          id="ringAllTerms"
          style={{ transform: `rotate(${state.ringRotations.allTerms}deg)` }}
        >
          <circle cx="200" cy="200" r="182" className="dial-outer-hit" />
          <circle cx="200" cy="200" r="182" className="dial-track dial-track-0" />
          <circle cx="200" cy="200" r="182" className="dial-rim dial-rim-soft" />

          <g id="allTermsTextG">
            {TERM_LIST.map((t, idx) => {
              const startOffset = ((idx + 0.5) / TERM_LIST.length) * 100;
              return (
                <text
                  key={`term-${t.id}`}
                  className="dial-allterms-text zh-only"
                  data-en={t.en}
                  onClick={() => handleTermTextClick(idx)}
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                >
                  <textPath href="#pAllTerms" startOffset={`${startOffset}%`} textAnchor="middle">
                    {t.zh}
                  </textPath>
                </text>
              );
            })}
          </g>
        </g>

        {/* Name ring */}
        <g
          className="dial-ring"
          data-ring="name"
          id="ringName"
          style={{ transform: `rotate(${state.ringRotations.name}deg)` }}
        >
          <circle cx="200" cy="200" r="150" className="dial-track dial-track-1" />
          <circle cx="200" cy="200" r="150" className="dial-rim dial-rim-soft" />
        </g>

        {/* Date ring */}
        <g
          className="dial-ring"
          data-ring="date"
          id="ringDate"
          style={{ transform: `rotate(${state.ringRotations.date}deg)` }}
        >
          <circle cx="200" cy="200" r="128" className="dial-track dial-track-2" />
          <circle cx="200" cy="200" r="128" className="dial-rim dial-rim-soft" />
          <text className="dial-text en dial-text-date">
            <textPath href="#pDate" startOffset="50%" textAnchor="middle">
              <tspan id="dialDateEn">{dialDateEn}</tspan>
              <tspan className="dial-sep"> · </tspan>
              <tspan className="dial-inline-zh" id="dialDateZh">{dialDateZh}</tspan>
            </textPath>
          </text>
        </g>

        {/* Solar longitude ring */}
        <g className="dial-ring" data-ring="lon" id="ringLon" style={{ transform: `rotate(${state.ringRotations.lon}deg)` }}>
          <circle cx="200" cy="200" r="92" className="dial-track dial-track-3" />
          <circle cx="200" cy="200" r="92" className="dial-rim dial-rim-soft" />
          <path className="dial-year-box-track" d={yearBoxTrackPath} />
          <path className="dial-year-box-fill" d={yearBoxProgressPath} />
          <circle cx="200" cy="200" r="84" className="dial-undertext dial-undertext-lon" />

          <text className="dial-text en dial-text-lon">
            <textPath href="#pLon" startOffset="75%" textAnchor="middle" id="dialLon">
              Year {Math.round(activeYearProgress * 100)}% · {activeDaysLeftYear.toFixed(0)} days
            </textPath>
          </text>
        </g>

        {/* Day/Night ring */}
        <g className="dial-ring" data-ring="daynight" id="ringDayN" style={{ transform: `rotate(${state.ringRotations.daynight}deg)` }}>
          <circle cx="200" cy="200" r="80" className="dial-track dial-track-4" />
          <circle cx="200" cy="200" r="80" className="dial-rim dial-rim-soft" />
        </g>

        {/* Hou ring */}
        <g className="dial-ring" data-ring="hou" id="ringHou">
          <circle cx="200" cy="200" r="150" className="dial-hit dial-hit-hou" />

          <text className="dial-text en dial-text-daynight dial-text-hou">
            <textPath href="#pDayN" startOffset="75%" textAnchor="middle" id="dialHou1">
              {HOU_MAP[term?.id]?.[0]?.replace(' — ', ' / ') || `Hou 1`}
            </textPath>
          </text>
          <text className="dial-text en dial-text-daynight dial-text-hou">
            <textPath href="#pDayN" startOffset="8.3%" textAnchor="middle" id="dialHou2">
              {HOU_MAP[term?.id]?.[1]?.replace(' — ', ' / ') || `Hou 2`}
            </textPath>
          </text>
          <text className="dial-text en dial-text-daynight dial-text-hou">
            <textPath href="#pDayN" startOffset="41.6%" textAnchor="middle" id="dialHou3">
              {HOU_MAP[term?.id]?.[2]?.replace(' — ', ' / ') || `Hou 3`}
            </textPath>
          </text>
        </g>

        {/* Center button */}
        <g
          id="centerButton"
          className="dial-center-btn"
          role="button"
          tabIndex={0}
          aria-label="Enter term details"
          onClick={handleCenterClick}
          style={{ cursor: 'pointer' }}
        >
          <circle cx="200" cy="200" r="68" className="dial-core" />

          <text x="200" y="190" textAnchor="middle" className="dial-center-term en" id="dialCenterEn">
            {term?.en || 'Winter Solstice'}
          </text>
          <text x="200" y="214" textAnchor="middle" className="dial-center-term-zh zh" id="dialCenterZh">
            {term?.zh || '冬至'}
          </text>

          <text x="200" y="246" textAnchor="middle" className="dial-center-hint en">
            Enter
          </text>
        </g>
      </svg>
    </div>
  );
};

export default SolarDial;
