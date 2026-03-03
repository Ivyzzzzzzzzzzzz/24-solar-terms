import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TERM_LIST, HOU_MAP, TERM_CONTENT_MAP } from '../data';
import { BackCorner, TermBackground } from '../components';
import TermMenuRing from './termDetail/TermMenuRing';
import TermCenterPanels from './termDetail/TermCenterPanels';
import './termDetail/TermDetail.layout.css';
import './termDetail/TermDetail.menu.css';
import './termDetail/TermDetail.content.css';
import './termDetail/TermDetail.solar.css';

const MENU_ITEMS = [
  { key: 'note', zh: '注', en: 'Note' },
  { key: 'phases', zh: '侯', en: 'Phases' },
  { key: 'poem', zh: '诗', en: 'Poem' },
  { key: 'ritual', zh: '行', en: 'Ritual' }
];

const SOLAR_PANEL_COPY = {
  lichun: {
    en: 'Sun begins its northward return. Shadows still long.',
    zh: '太阳开始北归，影子仍然修长。'
  },
  yushui: {
    en: 'The Sun climbs slightly higher. Shadows begin to soften.',
    zh: '太阳略升，影子开始收敛。'
  },
  jingzhe: {
    en: 'Light gains strength. Shadows shorten quietly.',
    zh: '光渐有力，影子悄然变短。'
  },
  chunfen: {
    en: 'Day and night balance. Shadow rests at mid-length.',
    zh: '昼夜平分，影子长短适中。'
  },
  qingming: {
    en: 'The Sun rises clear and bright. Shadow grows lighter.',
    zh: '阳光清朗，影子愈发轻盈。'
  },
  guyu: {
    en: 'Light deepens toward summer. Shadows continue to contract.',
    zh: '阳气渐盛，影子继续收短。'
  },
  lixia: {
    en: 'The Sun stands higher each day. Shadow pulls inward.',
    zh: '太阳日高，影子内收。'
  },
  xiaoman: {
    en: 'Light approaches fullness. Shadow grows compact.',
    zh: '光近盈满，影子紧致。'
  },
  mangzhong: {
    en: 'Sunlight sharpens at noon. Shadow becomes brief.',
    zh: '正午日烈，影子更短。'
  },
  xiazhi: {
    en: 'The Sun reaches its highest point. The shortest shadow of the year.',
    zh: '太阳至高，全年最短的影子。'
  },
  xiaoshu: {
    en: 'The Sun begins its slow descent. Shadow lengthens slightly.',
    zh: '太阳微降，影子略长。'
  },
  dashu: {
    en: 'Light remains strong. Shadow holds its shortness.',
    zh: '光仍炽盛，影子依旧短促。'
  },
  liqiu: {
    en: 'The Sun lowers toward autumn. Shadow grows noticeable.',
    zh: '太阳渐低，影子渐显。'
  },
  chushu: {
    en: 'Heat recedes. Shadow stretches a little farther.',
    zh: '暑气退去，影子稍长。'
  },
  bailu: {
    en: 'Light cools. Shadow lengthens with clarity.',
    zh: '光色转凉，影子愈发分明。'
  },
  qiufen: {
    en: 'Balance returns. Shadow rests at mid-length again.',
    zh: '昼夜再平，影子再次适中。'
  },
  hanlu: {
    en: 'The Sun drops lower. Shadow grows longer.',
    zh: '太阳渐低，影子渐长。'
  },
  shuangjiang: {
    en: 'Light thins. Shadow extends across the ground.',
    zh: '阳光渐薄，影子铺展。'
  },
  lidong: {
    en: 'The Sun descends toward winter. Shadow stretches outward.',
    zh: '太阳入冬，影子延伸。'
  },
  xiaoxue: {
    en: 'Light weakens. Shadow becomes pronounced.',
    zh: '光势减弱，影子更加明显。'
  },
  daxue: {
    en: 'The Sun stands low at noon. Shadow grows long and sharp.',
    zh: '正午日低，影子修长而清晰。'
  },
  dongzhi: {
    en: 'The Sun reaches its lowest height. The longest shadow of the year.',
    zh: '太阳至低，全年最长的影子。'
  },
  xiaohan: {
    en: 'Light slowly begins to return. Shadow remains long.',
    zh: '阳气初回，影子仍长。'
  },
  dahan: {
    en: 'The Sun prepares to rise again. Shadow at its winter depth.',
    zh: '太阳将升，影子仍在冬的深处。'
  }
};

const SOLAR_SHADOW_LENGTH_SCALE = {
  lichun: 0.88,
  yushui: 0.82,
  jingzhe: 0.75,
  chunfen: 0.68,
  qingming: 0.60,
  guyu: 0.52,
  lixia: 0.45,
  xiaoman: 0.38,
  mangzhong: 0.33,
  xiazhi: 0.30,
  xiaoshu: 0.33,
  dashu: 0.38,
  liqiu: 0.45,
  chushu: 0.52,
  bailu: 0.60,
  qiufen: 0.68,
  hanlu: 0.75,
  shuangjiang: 0.82,
  lidong: 0.88,
  xiaoxue: 0.94,
  daxue: 0.98,
  dongzhi: 1.0,
  xiaohan: 0.98,
  dahan: 0.94
};

// Manual controls for term-nav circle sizes
const TERM_NAV_DOT_SIZE = {
  minR: 1.1,
  maxR: 1.8,
  scale: 1,
  currentScale: 1.0,
  nextScale: 1.04
};

// Manual controls for term-nav ellipse track (shape/ratio/position)
const TERM_NAV_TRACK = {
  viewWidth: 89,
  viewHeight: 46,
  cx: 44.5,
  cy: 23,
  rx: 40,
  ry: 19
};

const annularGuidePath = (cx, cy, rOuter, rInner, startDeg, endDeg) => {
  const a0 = ((startDeg - 90) * Math.PI) / 180;
  const a1 = ((endDeg - 90) * Math.PI) / 180;
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

const getEvenlySpacedEllipsePoints = (count, cx, cy, rx, ry, startAngle = -Math.PI / 2) => {
  if (count <= 0) return [];

  const sampleCount = 2048;
  const points = [];
  const cumulative = [0];

  let total = 0;
  let prevX = cx + Math.cos(startAngle) * rx;
  let prevY = cy + Math.sin(startAngle) * ry;
  points.push({ t: startAngle, x: prevX, y: prevY });

  for (let i = 1; i <= sampleCount; i += 1) {
    const t = startAngle + ((Math.PI * 2) * i) / sampleCount;
    const x = cx + Math.cos(t) * rx;
    const y = cy + Math.sin(t) * ry;
    total += Math.hypot(x - prevX, y - prevY);
    cumulative.push(total);
    points.push({ t, x, y });
    prevX = x;
    prevY = y;
  }

  const out = [];
  const step = total / count;

  for (let i = 0; i < count; i += 1) {
    const target = i * step;
    let hi = cumulative.findIndex((v) => v >= target);
    if (hi < 1) hi = 1;
    const lo = hi - 1;
    const span = cumulative[hi] - cumulative[lo] || 1;
    const ratio = (target - cumulative[lo]) / span;
    const x = points[lo].x + ((points[hi].x - points[lo].x) * ratio);
    const y = points[lo].y + ((points[hi].y - points[lo].y) * ratio);
    out.push({ x, y });
  }

  return out;
};

const TermDetail = () => {
  const navigate = useNavigate();
  const { termId } = useParams();
  const [term, setTerm] = useState(null);
  const [menuRotation, setMenuRotation] = useState(0);
  const [isTermNavHover, setIsTermNavHover] = useState(false);
  const [navPulseOn, setNavPulseOn] = useState(false);
  const navWheelTsRef = useRef(0);
  const navWheelAccumRef = useRef(0);
  const navWheelResetTimerRef = useRef(null);
  const navPulseTimerRef = useRef(null);

  useEffect(() => {
    // Find term from the list
    const foundTerm = TERM_LIST.find(t => t.id === termId);
    
    if (foundTerm) {
      setTerm(foundTerm);
      document.title = `${foundTerm.zh} | ${foundTerm.en} | 24 Solar Terms`;
    } else {
      // Fallback to first term
      const defaultTerm = TERM_LIST[0];
      setTerm(defaultTerm);
      document.title = `${defaultTerm.zh} | ${defaultTerm.en} | 24 Solar Terms`;
    }
  }, [termId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMenuRotation((prev) => prev + 0.35);
    }, 50);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => {
    if (navPulseTimerRef.current) window.clearTimeout(navPulseTimerRef.current);
    if (navWheelResetTimerRef.current) window.clearTimeout(navWheelResetTimerRef.current);
  }, []);

  if (!term) return <div>Loading...</div>;

  const hou = HOU_MAP[term.id] || [];
  const content = TERM_CONTENT_MAP[term.id] || TERM_CONTENT_MAP.default;
  const phaseRows = content.phasesRows || hou.slice(0, 3).map((phase) => {
    const parts = phase.split(' — ');
    return { zh: `${parts[0] || ''} /`, en: parts[1] || '' };
  });

  const normalizedRotation = ((menuRotation % 360) + 360) % 360;
  const activeMenuIndex = ((Math.round(-normalizedRotation / 90) % MENU_ITEMS.length) + MENU_ITEMS.length) % MENU_ITEMS.length;
  const activeMenu = MENU_ITEMS[activeMenuIndex].key;
  const menuSelectorPath = annularGuidePath(84, 84, 84, 74, -34, 34);
  const currentTermIndex = TERM_LIST.findIndex((t) => t.id === term.id);
  const nextTermIndex = currentTermIndex >= 0 ? (currentTermIndex + 1) % TERM_LIST.length : 0;
  const nextTerm = TERM_LIST[nextTermIndex];
  const navEllipsePoints = getEvenlySpacedEllipsePoints(
    TERM_LIST.length,
    TERM_NAV_TRACK.cx,
    TERM_NAV_TRACK.cy,
    TERM_NAV_TRACK.rx,
    TERM_NAV_TRACK.ry
  );
  const solarLonValues = TERM_LIST.map((t) => Number(t.solarLon || 0));
  const minSolarLon = Math.min(...solarLonValues);
  const maxSolarLon = Math.max(...solarLonValues);
  const panelCopy = SOLAR_PANEL_COPY[term.id] || {
    en: 'The Sun shifts season by season. Shadow follows quietly.',
    zh: '太阳随季节变化，影子也随之转移。'
  };
  const panelShadowScale = SOLAR_SHADOW_LENGTH_SCALE[term.id] ?? 0.68;

  const navDotRadiusBySolarLon = (solarLon) => {
    if (maxSolarLon === minSolarLon) return (TERM_NAV_DOT_SIZE.minR + TERM_NAV_DOT_SIZE.maxR) / 2;
    const t = (Number(solarLon || 0) - minSolarLon) / (maxSolarLon - minSolarLon);
    return TERM_NAV_DOT_SIZE.minR + ((TERM_NAV_DOT_SIZE.maxR - TERM_NAV_DOT_SIZE.minR) * t);
  };

  const triggerNavPulse = () => {
    setNavPulseOn(true);
    if (navPulseTimerRef.current) window.clearTimeout(navPulseTimerRef.current);
    navPulseTimerRef.current = window.setTimeout(() => setNavPulseOn(false), 260);
  };

  const navigateByWheelDirection = (dir) => {
    if (currentTermIndex < 0) return;
    const targetIndex = (currentTermIndex + dir + TERM_LIST.length) % TERM_LIST.length;
    const targetTerm = TERM_LIST[targetIndex];
    if (!targetTerm) return;
    triggerNavPulse();
    navigate(`/term/${targetTerm.id}`);
  };

  const handleTermNavWheel = (e) => {
    e.preventDefault();

    const axisDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(axisDelta) < 0.6) return;

    const now = Date.now();
    if (now < navWheelTsRef.current) return;

    navWheelAccumRef.current += axisDelta;
    if (navWheelResetTimerRef.current) window.clearTimeout(navWheelResetTimerRef.current);
    navWheelResetTimerRef.current = window.setTimeout(() => {
      navWheelAccumRef.current = 0;
    }, 140);

    if (Math.abs(navWheelAccumRef.current) < 26) return;

    const dir = navWheelAccumRef.current > 0 ? 1 : -1;
    navWheelAccumRef.current = 0;
    navWheelTsRef.current = now + 320;
    navigateByWheelDirection(dir);
  };

  const handleTermNavKeyDown = (e) => {
    const now = Date.now();
    if (now < navWheelTsRef.current) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      navWheelTsRef.current = now + 220;
      navigateByWheelDirection(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navWheelTsRef.current = now + 220;
      navigateByWheelDirection(-1);
    }
  };

  const alignMenuToTop = (index) => {
    const current = ((menuRotation % 360) + 360) % 360;
    const target = (((-index * 90) % 360) + 360) % 360;
    const clockwiseDelta = (target - current + 360) % 360;
    setMenuRotation((prev) => prev + clockwiseDelta);
  };

  return (
    <div className="term-page">
      <TermBackground termId={term.id} />
      <div className="frame term-frame">
        <BackCorner />

        <div className="term-main">
          <div className="term-content">
            <div className="term-header">
              <Link className="term-left-home-link" to="/" aria-label="Back to landing page">
                <img
                  className="term-left-home-icon"
                  src="/assets/images/Ellipse%2025.svg"
                  alt=""
                  aria-hidden="true"
                />
              </Link>
              <div className="term-title-zh" id="termTitleZh">{term.zh || term.nameZh}</div>

              <div className="term-date">
                <div className="term-date-zh">
                  <p className="term-date-line">
                    <span className="term-date-text">二零二五年</span>
                  </p>
                  <p className="term-date-line">
                    <span className="term-date-text">{term.dateZh}</span>
                  </p>
                </div>
                <div className="term-date-en" id="termDateEn">{term.dateEn}</div>
              </div>
            </div>

            <div className="term-summary">
              <div className="term-title-en" id="termTitleEn">{term.en || term.nameEn}</div>
              <p className="term-summary-text" id="termSummary">
                {term.summary}
              </p>
            </div>
          </div>

          <div
            className={`term-badge term-term-nav${isTermNavHover ? ' is-hover' : ''}`}
            role="button"
            tabIndex={0}
            aria-label="Term navigator"
            onMouseEnter={() => setIsTermNavHover(true)}
            onMouseLeave={() => setIsTermNavHover(false)}
            onWheel={handleTermNavWheel}
            onKeyDown={handleTermNavKeyDown}
          >
            <div className="term-term-nav-visual" aria-hidden="true">
              <svg
                className="term-term-nav-ellipse"
                viewBox={`0 0 ${TERM_NAV_TRACK.viewWidth} ${TERM_NAV_TRACK.viewHeight}`}
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
                focusable="false"
              >
                {TERM_LIST.map((item, index) => {
                  const point = navEllipsePoints[index] || { x: TERM_NAV_TRACK.cx, y: TERM_NAV_TRACK.cy };
                  const isCurrent = index === currentTermIndex;
                  const isNext = index === nextTermIndex;
                  const pulseDelay = `${(index * 0.09).toFixed(2)}s`;
                  const baseR = navDotRadiusBySolarLon(item.solarLon) * TERM_NAV_DOT_SIZE.scale;
                  const dotR = isCurrent
                    ? baseR * TERM_NAV_DOT_SIZE.currentScale
                    : isNext
                      ? baseR * TERM_NAV_DOT_SIZE.nextScale
                      : baseR;
                  return (
                    <circle
                      key={`term-nav-dot-${index}`}
                      className={`term-term-nav-circle term-badge-pulse-node${isCurrent ? ' is-current' : ''}${isNext ? ' is-next' : ''}${isNext && navPulseOn ? ' is-pulsing' : ''}`}
                      style={{ animationDelay: pulseDelay }}
                      cx={point.x.toFixed(2)}
                      cy={point.y.toFixed(2)}
                      r={dotR.toFixed(2)}
                    />
                  );
                })}
              </svg>
            </div>

            <div className="term-term-nav-pop" aria-hidden={!isTermNavHover}>
              <div className="term-term-nav-pop-title">Solar Longitude</div>
              <div className="term-term-nav-pop-value">{Number(term.solarLon || 0).toFixed(0)}° · {term.zh}</div>
              <div className="term-term-nav-pop-hint">Scroll horizontally to see other terms</div>
              <div className="term-term-nav-pop-next">Next: {nextTerm?.zh || ''} ({Number(nextTerm?.solarLon || 0).toFixed(0)}°)</div>
            </div>
          </div>
        </div>

        <Link className="term-grid-link" to="/calendar" aria-label="Year calendar grid">
          <span className="term-grid-icon" aria-hidden="true"></span>
        </Link>

        <div className={`term-solar-panel-wrap${isTermNavHover ? ' is-hover' : ''}`}>
          <aside
            className="term-solar-panel"
            role="button"
            tabIndex={0}
            aria-label="Term navigator panel"
            style={{ '--term-solar-shadow-scale': panelShadowScale }}
            onMouseEnter={() => setIsTermNavHover(true)}
            onMouseLeave={() => setIsTermNavHover(false)}
            onWheel={handleTermNavWheel}
            onKeyDown={handleTermNavKeyDown}
          >
            <div className="term-solar-panel-value">{Number(term.solarLon || 0).toFixed(0)}°</div>
            <div className="term-solar-panel-note">{panelCopy.en}</div>
            <div className="term-solar-panel-note-zh">{panelCopy.zh}</div>
          </aside>

          <div className="term-solar-panel-instruction" aria-hidden={!isTermNavHover}>
            <div className="term-solar-panel-instruction-zh">滚动切换节气</div>
            <div className="term-solar-panel-instruction-en">Scroll to switch terms</div>
          </div>
        </div>

        <TermMenuRing
          menuItems={MENU_ITEMS}
          menuRotation={menuRotation}
          menuSelectorPath={menuSelectorPath}
          activeMenu={activeMenu}
          alignMenuToTop={alignMenuToTop}
        />

        <TermCenterPanels
          activeMenu={activeMenu}
          content={content}
          phaseRows={phaseRows}
        />
      </div>
    </div>
  );
};

export default TermDetail;
