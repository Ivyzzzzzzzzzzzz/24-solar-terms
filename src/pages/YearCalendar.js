import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TERM_LIST, TERM_COLORS } from '../data';
import { BackCorner } from '../components';
import './YearCalendar.css';

const INITIAL_YEAR = 2026;

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

const rgbStr = (c) => `rgb(${c.r}, ${c.g}, ${c.b})`;

const clamp01 = (v) => Math.max(0, Math.min(1, v));

const YearCalendar = () => {
  const [year, setYear] = useState(INITIAL_YEAR);
  const [isTextOn, setIsTextOn] = useState(true);
  const [hoveredTerm, setHoveredTerm] = useState(null);
  const lastWheelTsRef = useRef(0);
  const today = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }, []);

  const shiftYear = (delta) => {
    setYear((prev) => Math.max(1900, Math.min(2100, prev + delta)));
  };

  const handleYearWheel = (e) => {
    e.preventDefault();

    const now = Date.now();
    if (now - lastWheelTsRef.current < 160) return;
    lastWheelTsRef.current = now;

    if (e.deltaY > 0) shiftYear(1);
    else if (e.deltaY < 0) shiftYear(-1);
  };

  const termFillRgbById = useMemo(() => {
    const paper = { r: 246, g: 241, b: 234 };
    const map = {};

    TERM_LIST.forEach((term) => {
      const entry = TERM_COLORS[term.id] || { base: '#9aa6b2' };
      const base = hexToRgb(entry.base);
      const sum = (term.dayH + term.nightH) || 24;
      const dayBias = clamp01(term.dayH / sum);
      const lightT = 0.48 + 0.36 * dayBias;
      const fill = mix(base, paper, Math.min(0.88, lightT + 0.1));
      map[term.id] = fill;
    });

    return map;
  }, []);

  const termFillById = useMemo(() => {
    const map = {};
    TERM_LIST.forEach((term) => {
      map[term.id] = rgbStr(termFillRgbById[term.id]);
    });
    return map;
  }, [termFillRgbById]);

  const dayGradientFillByDoy = useMemo(() => {
    const DAYS_IN_YEAR = 365;
    const paper = { r: 246, g: 241, b: 234 };
    const termsByDoy = [...TERM_LIST].sort((a, b) => a.doy - b.doy);
    const map = {};

    for (let doy = 1; doy <= DAYS_IN_YEAR; doy++) {
      let nextIdx = termsByDoy.findIndex((t) => doy < t.doy);
      if (nextIdx === -1) nextIdx = 0;
      const prevIdx = (nextIdx - 1 + termsByDoy.length) % termsByDoy.length;

      const prevTerm = termsByDoy[prevIdx];
      const nextTerm = termsByDoy[nextIdx];
      const prevDoy = prevTerm.doy;
      const nextDoy = nextTerm.doy;

      const span = nextDoy > prevDoy ? nextDoy - prevDoy : (DAYS_IN_YEAR - prevDoy) + nextDoy;
      const offset = doy >= prevDoy ? doy - prevDoy : (DAYS_IN_YEAR - prevDoy) + doy;
      const t = span === 0 ? 0 : clamp01(offset / span);

      const prevFill = termFillRgbById[prevTerm.id] || paper;
      const nextFill = termFillRgbById[nextTerm.id] || paper;
      const gradientBase = mix(prevFill, nextFill, t);
      const softened = mix(gradientBase, paper, 0.52);

      map[doy] = rgbStr(softened);
    }

    return map;
  }, [termFillRgbById]);

  const dayPulseMetaByDoy = useMemo(() => {
    const DAYS_IN_YEAR = 365;
    const PULSE_CYCLE_SEC = 3.8;
    const termsByDoy = [...TERM_LIST].sort((a, b) => a.doy - b.doy);
    const map = {};

    for (let doy = 1; doy <= DAYS_IN_YEAR; doy++) {
      let nextIdx = termsByDoy.findIndex((t) => doy < t.doy);
      if (nextIdx === -1) nextIdx = 0;
      const prevIdx = (nextIdx - 1 + termsByDoy.length) % termsByDoy.length;

      const prevTerm = termsByDoy[prevIdx];
      const nextTerm = termsByDoy[nextIdx];
      const prevDoy = prevTerm.doy;
      const nextDoy = nextTerm.doy;

      const span = nextDoy > prevDoy ? nextDoy - prevDoy : (DAYS_IN_YEAR - prevDoy) + nextDoy;
      const offset = doy >= prevDoy ? doy - prevDoy : (DAYS_IN_YEAR - prevDoy) + doy;

      const progress = clamp01(offset / Math.max(1, span - 1));
      const strength = 0.32 + (0.68 * (1 - progress));
      const termPhaseOffset = (prevIdx / termsByDoy.length) * PULSE_CYCLE_SEC;
      const delay = termPhaseOffset + (2.6 * progress);

      map[doy] = {
        strength,
        delay,
        termId: prevTerm.id
      };
    }

    return map;
  }, []);

  const termByDateKey = useMemo(() => {
    const map = {};
    TERM_LIST.forEach((term) => {
      const parsed = parseTermDate(term.dateEn);
      if (!parsed) return;
      map[keyFromDate(year, parsed.month, parsed.day)] = term;
    });
    return map;
  }, [year]);

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

  return (
    <main className="year-calendar-page">
      <BackCorner />
      <section
        className="year-calendar-grid is-year-scroll"
        aria-label={`Solar terms year calendar ${year}`}
        onWheel={handleYearWheel}
      >
        <div className={`year-calendar-term-preview-en-top${hoveredTerm ? ' is-visible' : ''}`} aria-live="polite">
          {hoveredTerm?.en || ''}
        </div>
        <div className="year-calendar-home-col">
          <Link className="year-calendar-home-link-inline" to="/" aria-label="Back to landing page">
            <img
              className="year-calendar-home-icon-inline"
              src="/assets/images/Ellipse%2025.svg"
              alt=""
              aria-hidden="true"
            />
          </Link>
        </div>
        <div className="year-calendar-year-col">
          <div className="year-calendar-year-switch-wrap" onWheel={handleYearWheel}>
            <div className={`year-calendar-term-preview${hoveredTerm ? ' is-visible' : ''}`} aria-live="polite">
              <span className="year-calendar-term-preview-zh">{hoveredTerm?.zh || ''}</span>
            </div>
            <span className="year-calendar-year-arrow year-calendar-year-arrow-top" aria-hidden="true">↑</span>
            <button
              type="button"
              className="year-calendar-year-switch"
              onClick={() => shiftYear(1)}
              aria-label="Scroll up and down to switch year"
              title="Scroll up/down to change year"
            >
            <span className="year-calendar-title year-calendar-title-vertical">{year}</span>
            </button>
            <span className="year-calendar-year-arrow year-calendar-year-arrow-bottom" aria-hidden="true">↓</span>
          </div>
        </div>
        <div className="year-day-stream" role="list">
          {dayStream.map(({ month, day, doy, isMonthStart }) => {
            const dateKey = keyFromDate(year, month, day);
            const term = termByDateKey[dateKey];
            const isToday = year === today.year && month === today.month && day === today.day;
            const dayFill = dayGradientFillByDoy[doy];
            const pulse = dayPulseMetaByDoy[doy] || { strength: 0, delay: 0, termId: null };
            const pulseColor = pulse.termId ? termFillById[pulse.termId] : dayFill;
            const baseStyle = {
              '--year-day-fill': dayFill,
              '--year-pulse-strength': pulse.strength,
              '--year-pulse-delay': `${pulse.delay}s`,
              '--year-pulse-color': pulseColor
            };
            if (term) {
              return (
                <Link
                  key={`${month}-${day}`}
                  to={`/term/${term.id}`}
                  className={`year-day is-seasonal is-pulse is-term${isToday ? ' is-today' : ''}${isMonthStart ? ' is-month-start' : ''}`}
                  style={{ ...baseStyle, '--year-term-fill': termFillById[term.id] }}
                  aria-label={`${MONTHS[month]} ${day}, ${term.zh} ${term.en}`}
                  onMouseEnter={() => setHoveredTerm(term)}
                  onMouseLeave={() => setHoveredTerm(null)}
                  onFocus={() => setHoveredTerm(term)}
                  onBlur={() => setHoveredTerm(null)}
                >
                  {isTextOn && <span className="year-day-num">{String(day).padStart(2, '0')}</span>}
                  {isTextOn && isMonthStart && <span className="year-day-month">{MONTHS[month]}</span>}
                </Link>
              );
            }
            return (
              <span
                key={`${month}-${day}`}
                className={`year-day is-seasonal is-pulse${isToday ? ' is-today' : ''}${isMonthStart ? ' is-month-start' : ''}`}
                style={baseStyle}
              >
                {isTextOn && <span className="year-day-num">{String(day).padStart(2, '0')}</span>}
                {isTextOn && isMonthStart && <span className="year-day-month">{MONTHS[month]}</span>}
              </span>
            );
          })}
        </div>
        <div className="year-calendar-control-col">
          <button
            type="button"
            className={`year-calendar-text-toggle${isTextOn ? '' : ' is-off'}`}
            onClick={() => setIsTextOn((v) => !v)}
            aria-pressed={!isTextOn}
            aria-label={isTextOn ? 'Turn text off' : 'Turn text on'}
          >
            <span className="year-calendar-toggle-word">Text</span>
            <span className="year-calendar-toggle-word-zh">日期</span>
          </button>
        </div>
      </section>
    </main>
  );
};

export default YearCalendar;
