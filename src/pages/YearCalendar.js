import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAmbientAudio } from '../audio/AmbientAudioProvider';
import { TERM_LIST, TERM_COLORS, getCurrentTermId } from '../data';
import { getYearProgressInfo, yearProgressDeg } from '../lib';
import './YearCalendar.css';

const GRID_COLS = 22;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_INDEX = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11
};

const keyFromDate = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const getDayOfYear = (year, month, day) => Math.round((new Date(year, month, day) - new Date(year, 0, 1)) / 86400000) + 1;

const parseTermDate = (dateEn) => {
  if (!dateEn) return null;
  const [monRaw, dayRaw] = String(dateEn).replace('.', '').split(/\s+/);
  const month = MONTH_INDEX[monRaw];
  const day = Number(dayRaw);
  if (Number.isNaN(day) || month === undefined) return null;
  return { month, day };
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

const averageColors = (colors, fallback) => {
  if (!colors.length) return fallback;

  const totals = colors.reduce((acc, color) => ({
    r: acc.r + color.r,
    g: acc.g + color.g,
    b: acc.b + color.b
  }), { r: 0, g: 0, b: 0 });

  return {
    r: Math.round(totals.r / colors.length),
    g: Math.round(totals.g / colors.length),
    b: Math.round(totals.b / colors.length)
  };
};

const rgbStr = (c) => `rgb(${c.r}, ${c.g}, ${c.b})`;
const rgbChannels = (c) => `${c.r} ${c.g} ${c.b}`;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const darkenRgb = (c, factor = 0.78) => ({
  r: Math.max(0, Math.min(255, Math.round(c.r * factor))),
  g: Math.max(0, Math.min(255, Math.round(c.g * factor))),
  b: Math.max(0, Math.min(255, Math.round(c.b * factor)))
});

const YearCalendar = () => {
  const navigate = useNavigate();
  const { previewTermId, selectTermId } = useAmbientAudio();
  const [isTextOn, setIsTextOn] = useState(true);
  const [hoveredTerm, setHoveredTerm] = useState(null);
  const [isLiteEffects, setIsLiteEffects] = useState(false);
  const hoveredTermIdRef = useRef(null);
  const calendarScrollRef = useRef(null);
  const handleTermHover = useCallback((term) => {
    if (!term?.id) return;
    if (hoveredTermIdRef.current === term.id) return;
    hoveredTermIdRef.current = term.id;
    setHoveredTerm(term);
  }, []);
  const handleTermHoverExit = useCallback(() => {
    if (!hoveredTermIdRef.current) return;
    hoveredTermIdRef.current = null;
    setHoveredTerm(null);
  }, []);
  const toggleTextVisibility = useCallback(() => {
    setIsTextOn((v) => !v);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const nav = window.navigator;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    const updateLiteEffects = () => {
      const prefersReducedMotion = media.matches;
      const saveData = Boolean(conn?.saveData);
      const constrainedNetwork = typeof conn?.effectiveType === 'string' && /2g/.test(conn.effectiveType);
      const lowCpu = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4;
      const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
      setIsLiteEffects(prefersReducedMotion || saveData || constrainedNetwork || lowCpu || lowMemory);
    };

    updateLiteEffects();

    if (media.addEventListener) media.addEventListener('change', updateLiteEffects);
    else if (media.addListener) media.addListener(updateLiteEffects);
    conn?.addEventListener?.('change', updateLiteEffects);

    return () => {
      if (media.removeEventListener) media.removeEventListener('change', updateLiteEffects);
      else if (media.removeListener) media.removeListener(updateLiteEffects);
      conn?.removeEventListener?.('change', updateLiteEffects);
    };
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }, []);
  const year = today.year;
  const yearProgressInfo = useMemo(() => (
    getYearProgressInfo(new Date(today.year, today.month, today.day))
  ), [today.day, today.month, today.year]);
  const fallbackOrbTermIndex = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const doy = Math.floor((now - start) / 86400000) + 1;
    const sorted = [...TERM_LIST].sort((a, b) => a.doy - b.doy);
    let active = sorted[sorted.length - 1];
    for (const item of sorted) {
      if (doy >= item.doy) active = item;
      else break;
    }
    return Math.max(0, TERM_LIST.findIndex((term) => term.id === active.id));
  }, []);
  const handleBackClick = useCallback((event) => {
    event.preventDefault();
    const idx = window.history?.state?.idx;
    if (typeof idx === 'number' && idx > 0) navigate(-1);
    else navigate('/');
  }, [navigate]);

  const termPaletteById = useMemo(() => {
    const paper = { r: 246, g: 241, b: 234 };
    const ink = { r: 20, g: 18, b: 16 };
    const map = {};

    TERM_LIST.forEach((term) => {
      const entry = TERM_COLORS[term.id] || { base: '#9aa6b2' };
      const base = hexToRgb(entry.base);
      const sum = (term.dayH + term.nightH) || 24;
      const dayBias = clamp01(term.dayH / sum);
      const lightT = 0.48 + (0.36 * dayBias);
      const track = mix(base, paper, Math.min(0.94, lightT + 0.22));
      const fill = mix(base, paper, Math.min(0.88, lightT + 0.1));
      const mid = mix(base, fill, 0.42);
      const rim = mix(base, paper, 0.78);
      const text = mix(base, ink, 0.8);
      map[term.id] = {
        base: entry.base,
        track,
        fill,
        mid,
        rim,
        text
      };
    });

    return map;
  }, []);

  const termFillRgbById = useMemo(() => {
    const map = {};
    TERM_LIST.forEach((term) => {
      map[term.id] = termPaletteById[term.id]?.fill;
    });
    return map;
  }, [termPaletteById]);

  const termFillById = useMemo(() => {
    const map = {};
    TERM_LIST.forEach((term) => {
      map[term.id] = rgbStr(termFillRgbById[term.id]);
    });
    return map;
  }, [termFillRgbById]);

  const termMidById = useMemo(() => {
    const map = {};
    TERM_LIST.forEach((term) => {
      map[term.id] = rgbStr(termPaletteById[term.id]?.mid || { r: 216, g: 212, b: 206 });
    });
    return map;
  }, [termPaletteById]);

  const termRimById = useMemo(() => {
    const map = {};
    TERM_LIST.forEach((term) => {
      map[term.id] = rgbStr(termPaletteById[term.id]?.rim || { r: 154, g: 166, b: 178 });
    });
    return map;
  }, [termPaletteById]);

  const termTextById = useMemo(() => {
    const map = {};
    TERM_LIST.forEach((term) => {
      map[term.id] = rgbStr(termPaletteById[term.id]?.text || { r: 20, g: 18, b: 16 });
    });
    return map;
  }, [termPaletteById]);

  const orbPaletteStyle = useMemo(() => {
    const baseIndex = hoveredTerm
      ? Math.max(0, TERM_LIST.findIndex((term) => term.id === hoveredTerm.id))
      : fallbackOrbTermIndex;
    const term = TERM_LIST[baseIndex];
    const baseColor = hexToRgb((TERM_COLORS[term?.id] || { base: '#9aa6b2' }).base);
    const baseRgb = rgbChannels(baseColor);

    return {
      '--year-orb-color-base-rgb': baseRgb,
      '--year-orb-ring-rgb': rgbChannels(darkenRgb(baseColor)),
      '--orb-year-progress-deg': yearProgressDeg(yearProgressInfo.progress)
    };
  }, [fallbackOrbTermIndex, hoveredTerm, yearProgressInfo.progress]);

  const dayStream = useMemo(() => {
    const days = [];
    const start = new Date(year, 0, 1);
    const totalDays = Math.round((new Date(year + 1, 0, 1) - start) / 86400000);

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(year, 0, 1 + i);
      const month = d.getMonth();
      const day = d.getDate();
      days.push({ month, day, doy: i + 1, isMonthStart: day === 1 });
    }

    return days;
  }, [year]);

  const scheduledTerms = useMemo(() => (
    TERM_LIST
      .map((term) => {
        const parsed = parseTermDate(term.dateEn);
        if (!parsed) return null;
        return {
          ...term,
          month: parsed.month,
          day: parsed.day,
          doy: getDayOfYear(year, parsed.month, parsed.day)
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.doy - b.doy)
  ), [year]);

  const termByDateKey = useMemo(() => {
    const map = {};
    scheduledTerms.forEach((term) => {
      map[keyFromDate(year, term.month, term.day)] = term;
    });
    return map;
  }, [scheduledTerms, year]);

  const totalRows = useMemo(() => Math.ceil(dayStream.length / GRID_COLS), [dayStream.length]);

  const termAuraMotionById = useMemo(() => {
    if (isLiteEffects) return {};

    const map = {};

    scheduledTerms.forEach((term, index) => {
      const dayBias = clamp01(term.dayH / 24);
      const phaseSeed = ((term.doy * 17 + index * 29) % 97) / 97;
      const cadence = 0.84 + (phaseSeed * 0.44);

      map[term.id] = {
        '--year-aura-duration': `${(17.2 + (cadence * 4.3) + (dayBias * 1.35)).toFixed(2)}s`,
        '--year-aura-delay': `${(-(index * 1.34 + phaseSeed * 6.2)).toFixed(2)}s`,
        '--year-aura-soft-duration': `${(23.4 + (cadence * 5.1) + (dayBias * 1.7)).toFixed(2)}s`,
        '--year-aura-soft-delay': `${(-(index * 1.08 + phaseSeed * 8.4)).toFixed(2)}s`,
        '--year-aura-wave-duration': `${(19.6 + (cadence * 4.7) + (dayBias * 1.45)).toFixed(2)}s`,
        '--year-aura-wave-delay': `${(-(index * 1.72 + phaseSeed * 9.1)).toFixed(2)}s`,
        '--year-aura-scale-peak': '0.3',
        '--year-aura-core-peak': '1.18',
        '--year-aura-wave-peak': '1.30'
      };
    });

    return map;
  }, [isLiteEffects, scheduledTerms]);

  const termAuraNodes = useMemo(() => {
    if (isLiteEffects) return [];

    const fallback = { r: 246, g: 241, b: 234 };

    return scheduledTerms.map((term) => {
      const palette = termPaletteById[term.id] || {};
      const col = (term.doy - 1) % GRID_COLS;
      const row = Math.floor((term.doy - 1) / GRID_COLS);
      const centerX = ((col + 0.5) / GRID_COLS) * 100;
      const centerY = ((row + 0.5) / Math.max(1, totalRows)) * 100;
      const dayBias = clamp01(term.dayH / 24);
      const radiusCells = 2.8;
      const width = ((radiusCells * 2) / GRID_COLS) * 100;
      const height = ((radiusCells * 2) / Math.max(1, totalRows)) * 100;

      return {
        id: term.id,
        style: {
          left: `${centerX.toFixed(4)}%`,
          top: `${centerY.toFixed(4)}%`,
          width: `${width.toFixed(4)}%`,
          height: `${height.toFixed(4)}%`,
          ...termAuraMotionById[term.id],
          '--year-aura-base': palette.base || '#9aa6b2',
          '--year-aura-track': rgbStr(palette.track || fallback),
          '--year-aura-fill': rgbStr(palette.fill || fallback),
          '--year-aura-mid': rgbStr(palette.mid || fallback),
          '--year-aura-opacity': (0.58 + (dayBias * 0.16)).toFixed(3),
          '--year-aura-soft-opacity': (0.46 + (dayBias * 0.12)).toFixed(3),
          '--year-aura-wave-opacity': (0.52 + (dayBias * 0.14)).toFixed(3),
          '--year-aura-line-opacity': (0.82 + (dayBias * 0.15)).toFixed(3),
          '--year-aura-line-thickness': `${(2.08 + (dayBias * 0.72)).toFixed(2)}%`,
          '--year-aura-line-gap': `${(6.4 - (dayBias * 0.84)).toFixed(2)}%`,
          '--year-aura-blur': `${(14 + (dayBias * 3.8)).toFixed(2)}px`
        }
      };
    });
  }, [isLiteEffects, scheduledTerms, termAuraMotionById, termPaletteById, totalRows]);

  const fieldWashStyle = useMemo(() => {
    const paper = { r: 252, g: 252, b: 250 };
    const fallback = { r: 246, g: 241, b: 234 };
    const tracks = scheduledTerms.map((term) => termPaletteById[term.id]?.track).filter(Boolean);
    const fills = scheduledTerms.map((term) => termPaletteById[term.id]?.fill).filter(Boolean);
    const averageTrack = averageColors(tracks, fallback);
    const averageFill = averageColors(fills, fallback);

    return {
      '--year-surface-base': rgbStr(mix(averageTrack, paper, 0.32)),
      '--year-surface-ambient': rgbStr(mix(averageFill, averageTrack, 0.46))
    };
  }, [scheduledTerms, termPaletteById]);

  const termCellStyleById = useMemo(() => {
    const styles = {};

    TERM_LIST.forEach((term) => {
      styles[term.id] = {
        '--year-term-base': termPaletteById[term.id]?.base || termFillById[term.id],
        '--year-term-fill': termFillById[term.id],
        '--year-term-mid': termMidById[term.id],
        '--year-term-rim': termRimById[term.id],
        '--year-term-text': termTextById[term.id],
        '--year-term-focus-strength': (0.24 + (clamp01(term.dayH / 24) * 0.08)).toFixed(3)
      };
    });

    return styles;
  }, [termFillById, termMidById, termPaletteById, termRimById, termTextById]);

  const dayNodes = useMemo(() => dayStream.map(({ month, day, doy, isMonthStart }) => {
    const dateKey = keyFromDate(year, month, day);
    const term = termByDateKey[dateKey];
    const isToday = year === today.year && month === today.month && day === today.day;

    if (term) {
      return (
        <Link
          key={doy}
          to={`/term/${term.id}`}
          className={`year-day is-term${isToday ? ' is-today' : ''}${isMonthStart ? ' is-month-start' : ''}`}
          style={termCellStyleById[term.id]}
          aria-label={`${MONTHS[month]} ${day}, ${year}, ${term.zh} ${term.en}`}
          onClick={() => selectTermId(term.id)}
          onMouseEnter={() => handleTermHover(term)}
          onMouseLeave={handleTermHoverExit}
          onFocus={() => handleTermHover(term)}
          onBlur={handleTermHoverExit}
        >
          {isTextOn && <span className="year-day-num">{String(day).padStart(2, '0')}</span>}
          {isTextOn && isMonthStart && <span className="year-day-month">{MONTHS[month]}</span>}
          <span className="year-day-tooltip" aria-hidden="true">
            <span className="year-day-tooltip-zh">{term.zh}</span>
            <span className="year-day-tooltip-en">{term.en}</span>
          </span>
        </Link>
      );
    }

    return (
      <span
        key={doy}
        className={`year-day is-seasonal${isToday ? ' is-today' : ''}${isMonthStart ? ' is-month-start' : ''}`}
      >
        {isTextOn && <span className="year-day-num">{String(day).padStart(2, '0')}</span>}
        {isTextOn && isMonthStart && <span className="year-day-month">{MONTHS[month]}</span>}
        {isToday && (
          <span className="year-day-tooltip" aria-hidden="true">
            <span className="year-day-tooltip-zh">今天</span>
            <span className="year-day-tooltip-en">Today</span>
          </span>
        )}
      </span>
    );
  }), [dayStream, handleTermHover, handleTermHoverExit, isTextOn, selectTermId, termByDateKey, termCellStyleById, today.day, today.month, today.year, year]);

  useEffect(() => {
    previewTermId(hoveredTerm?.id || getCurrentTermId());
  }, [hoveredTerm, previewTermId]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const { body, documentElement } = document;
    const lockClass = 'year-calendar-no-scroll';

    body.classList.add(lockClass);
    documentElement.classList.add(lockClass);

    const allowCalendarScrollOnly = (event) => {
      if (event.ctrlKey || event.metaKey) return;
      if (calendarScrollRef.current?.contains(event.target)) return;

      event.preventDefault();
    };

    window.addEventListener('wheel', allowCalendarScrollOnly, { passive: false, capture: true });
    window.addEventListener('touchmove', allowCalendarScrollOnly, { passive: false, capture: true });

    return () => {
      window.removeEventListener('wheel', allowCalendarScrollOnly, { capture: true });
      window.removeEventListener('touchmove', allowCalendarScrollOnly, { capture: true });
      body.classList.remove(lockClass);
      documentElement.classList.remove(lockClass);
    };
  }, []);

  return (
    <main className="year-calendar-page">
      <Link className="year-calendar-back-link" to="/" aria-label="Back" onClick={handleBackClick}>
        <span className="year-calendar-back-link-label">Back</span>
      </Link>
      <section
        className="year-calendar-grid"
        aria-label={`Solar terms year calendar ${year}`}
      >
        <div className="year-calendar-home-col">
          <Link
            className="year-calendar-home-link-inline"
            to="/"
            aria-label="Go to landing page"
            style={orbPaletteStyle}
          >
            <span
              className={`year-calendar-home-orb-inline${isLiteEffects ? ' is-lite-effects' : ''}`}
              aria-hidden="true"
            >
              <span className="year-calendar-home-orb-fluid">
                <span className="year-calendar-home-orb-spectrum"></span>
                <span className="year-calendar-home-orb-stream"></span>
                <span className="year-calendar-home-orb-layer year-calendar-home-orb-layer-cool"></span>
                <span className="year-calendar-home-orb-layer year-calendar-home-orb-layer-warm"></span>
                <span className="year-calendar-home-orb-layer year-calendar-home-orb-layer-gold"></span>
                <span className="year-calendar-home-orb-layer year-calendar-home-orb-layer-muted"></span>
              </span>
            </span>
          </Link>
        </div>
        <div className="year-calendar-year-col">
          <div className="year-calendar-year-switch-wrap">
            <div className="year-calendar-year-current" aria-label={`Current year ${year}`}>
              <span className="year-calendar-title year-calendar-title-vertical">{year}</span>
            </div>
          </div>
        </div>
        <div className="year-day-scroll" ref={calendarScrollRef}>
          <div className={`year-day-stream${isLiteEffects ? ' is-lite-effects' : ''}`} role="list" style={fieldWashStyle}>
            <div className="year-day-stream-field" aria-hidden="true">
              {termAuraNodes.map((aura) => (
                <span
                  key={aura.id}
                  className="year-term-aura"
                  style={aura.style}
                ></span>
              ))}
            </div>
            {dayNodes}
          </div>
        </div>
        <div className="year-calendar-control-col">
          <button
            type="button"
            className={`year-calendar-text-toggle${isTextOn ? '' : ' is-off'}`}
            onClick={toggleTextVisibility}
            aria-pressed={!isTextOn}
            aria-label={isTextOn ? 'Turn text off' : 'Turn text on'}
          >
            <span className="year-calendar-toggle-word">See dates</span>
            <span className="year-calendar-toggle-word-zh">显示<br />日期</span>
          </button>
        </div>
      </section>
    </main>
  );
};

export default YearCalendar;
