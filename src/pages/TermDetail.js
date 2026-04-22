import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAmbientAudio, useAmbientTerm } from '../audio/AmbientAudioProvider';
import { TERM_LIST, HOU_MAP, TERM_CONTENT_MAP, TERM_POEM_MAP, TERM_POEM_META_EN_MAP, TERM_COLORS } from '../data';
import { TermBackground } from '../components';
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
    en: 'As the sun climbs higher, shadows begin to shorten.',
    zh: '日升影渐短'
  },
  yushui: {
    en: 'With the sun rising further, shadows continue to shorten.',
    zh: '日高影续短'
  },
  jingzhe: {
    en: 'As the sun advances, the shadow draws in further.',
    zh: '日进影更收'
  },
  chunfen: {
    en: 'At the equinox, shadow and sunlight move toward balance.',
    zh: '日中影近平'
  },
  qingming: {
    en: 'With a higher sun, shadows appear clearer and shorter.',
    zh: '日高影清短'
  },
  guyu: {
    en: 'As the sun continues forward, shadows tighten slightly.',
    zh: '日进影微收'
  },
  lixia: {
    en: 'As solar height increases, shadows grow shorter.',
    zh: '日盛影渐短'
  },
  xiaoman: {
    en: 'The higher sun makes the noon shadow compact.',
    zh: '日高中影实'
  },
  mangzhong: {
    en: 'A stronger overhead sun produces a short, sharp shadow.',
    zh: '日强影短锐'
  },
  xiazhi: {
    en: 'At the solstice, the shadow reaches its shortest length.',
    zh: '日极影最短'
  },
  xiaoshu: {
    en: 'As the sun begins to withdraw, shadows lengthen slightly.',
    zh: '日退影微长'
  },
  dashu: {
    en: 'As the sun shifts away, shadows begin to grow again.',
    zh: '日移影稍长'
  },
  liqiu: {
    en: 'With the sun lowering, shadows turn longer.',
    zh: '日退影转长'
  },
  chushu: {
    en: 'As solar altitude drops, shadows continue to lengthen.',
    zh: '日降影渐长'
  },
  bailu: {
    en: 'With a lower sun angle, morning shadows grow long.',
    zh: '日斜晨影长'
  },
  qiufen: {
    en: 'At the equinox, shadow and sunlight return to balance.',
    zh: '日中影复平'
  },
  hanlu: {
    en: 'A lower sun creates a clearer, longer shadow.',
    zh: '日低影清长'
  },
  shuangjiang: {
    en: 'As the sun slants further, shadows lengthen more.',
    zh: '日斜影更长'
  },
  lidong: {
    en: 'A lower seasonal sun makes shadows noticeably longer.',
    zh: '日低影明显长'
  },
  xiaoxue: {
    en: 'As the sun weakens, the shadow extends outward.',
    zh: '日弱影延伸'
  },
  daxue: {
    en: 'The low sun produces a long, distinct shadow.',
    zh: '日低影长清'
  },
  dongzhi: {
    en: 'At the solstice, the shadow reaches its greatest length.',
    zh: '日极影最长'
  },
  xiaohan: {
    en: 'As the sun returns, shadows begin to draw back.',
    zh: '日回影微收'
  },
  dahan: {
    en: 'With the sun rising again, shadows shorten slightly.',
    zh: '日升影稍短'
  }
};

const SOLAR_PANEL_COPY_FALLBACK = {
  en: 'The Sun shifts season by season. Shadow follows quietly.',
  zh: '太阳随季节变化，影子也随之转移。'
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

const MENU_AUTO_ADVANCE_MS = 5000;
const MENU_ROTATION_STEP = 90;

const hexToRgbChannels = (hex) => {
  const value = String(hex || '').replace('#', '').trim();
  const normalized = value.length === 3
    ? value.split('').map((ch) => ch + ch).join('')
    : value;
  const intValue = Number.parseInt(normalized, 16);
  if (Number.isNaN(intValue)) return '146 158 170';
  return `${(intValue >> 16) & 255} ${(intValue >> 8) & 255} ${intValue & 255}`;
};

const darkenRgbChannels = (channels, factor = 0.78) => {
  const values = String(channels || '').split(/\s+/).map(Number);
  const safeValues = values.length === 3 && values.every(Number.isFinite)
    ? values
    : [146, 158, 170];
  return safeValues
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel * factor))))
    .join(' ');
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
  const { selectTermId } = useAmbientAudio();
  useAmbientTerm(termId || TERM_LIST[0].id);
  const [term, setTerm] = useState(null);
  const [menuRotation, setMenuRotation] = useState(0);
  const [isContentHover, setIsContentHover] = useState(false);
  const [isMenuRingHover, setIsMenuRingHover] = useState(false);
  const [isTermNavHover, setIsTermNavHover] = useState(false);
  const [isSolarPanelHover, setIsSolarPanelHover] = useState(false);
  const [navPulseOn, setNavPulseOn] = useState(false);
  const [solarPanelCopyHeight, setSolarPanelCopyHeight] = useState(null);
  const [solarCaptionLang, setSolarCaptionLang] = useState('en');
  const [isWindowedHeight, setIsWindowedHeight] = useState(false);
  const isMenuAutoAdvancePausedRef = useRef(false);
  const navWheelTsRef = useRef(0);
  const navWheelAccumRef = useRef(0);
  const navWheelResetTimerRef = useRef(null);
  const navPulseTimerRef = useRef(null);
  const menuAutoAdvanceTimerRef = useRef(null);
  const menuAutoAdvanceStartedAtRef = useRef(0);
  const menuAutoAdvanceRemainingRef = useRef(MENU_AUTO_ADVANCE_MS);
  const clearMenuAutoAdvanceTimer = useCallback(() => {
    if (menuAutoAdvanceTimerRef.current) {
      window.clearTimeout(menuAutoAdvanceTimerRef.current);
      menuAutoAdvanceTimerRef.current = null;
    }
  }, []);

  const startMenuAutoAdvance = useCallback((delay = MENU_AUTO_ADVANCE_MS) => {
    clearMenuAutoAdvanceTimer();
    const nextDelay = Math.max(0, delay);
    menuAutoAdvanceRemainingRef.current = nextDelay;
    menuAutoAdvanceStartedAtRef.current = Date.now();
    menuAutoAdvanceTimerRef.current = window.setTimeout(() => {
      menuAutoAdvanceTimerRef.current = null;
      menuAutoAdvanceRemainingRef.current = MENU_AUTO_ADVANCE_MS;
      setMenuRotation((prev) => prev + MENU_ROTATION_STEP);
    }, nextDelay);
  }, [clearMenuAutoAdvanceTimer]);

  const pauseMenuAutoAdvance = useCallback(() => {
    if (!menuAutoAdvanceTimerRef.current) return;
    const elapsed = Date.now() - menuAutoAdvanceStartedAtRef.current;
    menuAutoAdvanceRemainingRef.current = Math.max(0, menuAutoAdvanceRemainingRef.current - elapsed);
    clearMenuAutoAdvanceTimer();
  }, [clearMenuAutoAdvanceTimer]);

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

  const isMenuAutoAdvancePaused = isContentHover || isMenuRingHover;

  useEffect(() => {
    isMenuAutoAdvancePausedRef.current = isMenuAutoAdvancePaused;
  }, [isMenuAutoAdvancePaused]);

  useEffect(() => () => {
    if (navPulseTimerRef.current) window.clearTimeout(navPulseTimerRef.current);
    if (navWheelResetTimerRef.current) window.clearTimeout(navWheelResetTimerRef.current);
    clearMenuAutoAdvanceTimer();
  }, [clearMenuAutoAdvanceTimer]);

  useEffect(() => {
    menuAutoAdvanceRemainingRef.current = MENU_AUTO_ADVANCE_MS;
    if (!isMenuAutoAdvancePausedRef.current) {
      startMenuAutoAdvance(MENU_AUTO_ADVANCE_MS);
    }

    return () => {
      clearMenuAutoAdvanceTimer();
    };
  }, [clearMenuAutoAdvanceTimer, menuRotation, startMenuAutoAdvance]);

  useEffect(() => {
    if (isMenuAutoAdvancePaused) {
      pauseMenuAutoAdvance();
      return;
    }

    if (!menuAutoAdvanceTimerRef.current) {
      startMenuAutoAdvance(menuAutoAdvanceRemainingRef.current || MENU_AUTO_ADVANCE_MS);
    }
  }, [isMenuAutoAdvancePaused, pauseMenuAutoAdvance, startMenuAutoAdvance]);

  useEffect(() => {
    if (typeof document === 'undefined' || !document.body) return undefined;

    let isDisposed = false;

    const measureLargestCopyHeight = () => {
      const host = document.createElement('div');
      host.style.position = 'fixed';
      host.style.left = '-9999px';
      host.style.top = '0';
      host.style.opacity = '0';
      host.style.pointerEvents = 'none';
      host.style.width = '210px';
      host.style.boxSizing = 'border-box';
      host.style.zIndex = '-1';
      document.body.appendChild(host);

      const allCopies = [...Object.values(SOLAR_PANEL_COPY), SOLAR_PANEL_COPY_FALLBACK];
      let largestHeight = 0;

      allCopies.forEach((copy) => {
        const box = document.createElement('div');
        box.className = 'term-solar-panel-copy';
        box.style.height = 'auto';
        box.style.minHeight = '0';
        box.style.animation = 'none';
        box.style.transition = 'none';

        const en = document.createElement('div');
        en.className = 'term-solar-panel-note';
        en.lang = 'en';
        en.textContent = copy.en;

        const zh = document.createElement('div');
        zh.className = 'term-solar-panel-note-zh';
        zh.lang = 'zh-Hans';
        zh.textContent = copy.zh;

        box.append(en, zh);
        host.appendChild(box);
        largestHeight = Math.max(largestHeight, box.getBoundingClientRect().height);
        host.removeChild(box);
      });

      document.body.removeChild(host);

      if (!isDisposed && largestHeight > 0) {
        setSolarPanelCopyHeight(Number(largestHeight.toFixed(2)));
      }
    };

    const scheduleMeasure = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!isDisposed) measureLargestCopyHeight();
        });
      });
    };

    scheduleMeasure();

    document.fonts?.ready
      ?.then(() => {
        if (!isDisposed) scheduleMeasure();
      })
      .catch(() => {});

    window.addEventListener('resize', scheduleMeasure);

    return () => {
      isDisposed = true;
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateWindowedHeightState = () => {
      const viewportHeight = window.innerHeight || 0;
      const fullscreenHeight = window.screen?.availHeight || viewportHeight;
      const isDesktopViewport = window.innerWidth > 760;
      setIsWindowedHeight(isDesktopViewport && viewportHeight < (fullscreenHeight - 2));
    };

    updateWindowedHeightState();
    window.addEventListener('resize', updateWindowedHeightState);
    return () => window.removeEventListener('resize', updateWindowedHeightState);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined' || !document.body) return undefined;
    const hoverClass = 'term-solar-panel-hovering';
    if (isSolarPanelHover) {
      document.body.classList.add(hoverClass);
    } else {
      document.body.classList.remove(hoverClass);
    }

    return () => {
      document.body.classList.remove(hoverClass);
    };
  }, [isSolarPanelHover]);

  if (!term) return <div>Loading...</div>;

  const hou = HOU_MAP[term.id] || [];
  const termContentOverrides = TERM_CONTENT_MAP[term.id] || {};
  const poemContent = TERM_POEM_MAP[term.id] || TERM_POEM_MAP.default;
  const poemMetaEn = TERM_POEM_META_EN_MAP[term.id] || TERM_POEM_META_EN_MAP.default;
  const content = {
    ...TERM_CONTENT_MAP.default,
    ...termContentOverrides,
    ...poemContent,
    ...poemMetaEn
  };
  const rawPhaseRows = (hou && hou.length ? hou.slice(0, 3) : (content.phasesRows || []));
  const phaseRows = rawPhaseRows.map((phase) => {
    if (typeof phase === 'string') {
      const [zhPart, ...enParts] = phase.split(' — ');
      return {
        zh: (zhPart || '').trim(),
        en: enParts.join(' — ').trim()
      };
    }

    return {
      zh: String(phase?.zh || '').replace(/\s*\/\s*$/, '').trim(),
      en: String(phase?.en || '').trim()
    };
  });

  const normalizedRotation = ((menuRotation % 360) + 360) % 360;
  const activeMenuIndex = ((Math.round(normalizedRotation / 90) % MENU_ITEMS.length) + MENU_ITEMS.length) % MENU_ITEMS.length;
  const activeMenu = MENU_ITEMS[activeMenuIndex].key;
  const currentTermIndex = TERM_LIST.findIndex((t) => t.id === term.id);
  const nextTermIndex = currentTermIndex >= 0 ? (currentTermIndex + 1) % TERM_LIST.length : 0;
  const termBaseColor = TERM_COLORS[term.id]?.base || '#9aa6b2';
  const orbBaseRgb = hexToRgbChannels(termBaseColor);
  const orbPaletteStyle = {
    '--term-orb-color-base-rgb': orbBaseRgb,
    '--term-orb-ring-rgb': darkenRgbChannels(orbBaseRgb)
  };
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
  const panelCopy = SOLAR_PANEL_COPY[term.id] || SOLAR_PANEL_COPY_FALLBACK;
  const panelShadowScale = SOLAR_SHADOW_LENGTH_SCALE[term.id] ?? 0.68;
  const solarPanelStyle = {
    '--term-solar-shadow-scale': panelShadowScale,
    ...(solarPanelCopyHeight ? { '--term-solar-copy-height': `${solarPanelCopyHeight}px` } : {})
  };

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
    selectTermId(targetTerm.id);
    navigate(`/term/${targetTerm.id}`);
  };

  const handleTermNavWheel = (e) => {
    if (typeof window !== 'undefined' && window.innerWidth <= 760) return;
    e.preventDefault();
    if (Math.abs(e.deltaY) < 0.6) return;

    const now = Date.now();
    if (now < navWheelTsRef.current) return;

    navWheelAccumRef.current += e.deltaY;
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
    const target = (((index * 90) % 360) + 360) % 360;
    const clockwiseDelta = (target - current + 360) % 360;
    setMenuRotation((prev) => prev + clockwiseDelta);
  };

  return (
    <div
      className={`term-page${isWindowedHeight ? ' is-windowed-height' : ''}${isSolarPanelHover ? ' is-solar-panel-hover' : ''}`}
      style={{ '--term-detail-outline-color': termBaseColor }}
      onWheel={handleTermNavWheel}
    >
      <TermBackground termId={term.id} />
        <div className="frame term-frame">
        <div className="term-main">
          <div className="term-content">
            <div className="term-header">
              <Link className="term-left-home-link" to="/" aria-label="Go to landing page" style={orbPaletteStyle}>
                <span className="term-left-home-orb" aria-hidden="true">
                  <span className="term-left-home-orb-fluid">
                    <span className="term-left-home-orb-spectrum"></span>
                    <span className="term-left-home-orb-stream"></span>
                    <span className="term-left-home-orb-layer term-left-home-orb-layer-cool"></span>
                    <span className="term-left-home-orb-layer term-left-home-orb-layer-warm"></span>
                    <span className="term-left-home-orb-layer term-left-home-orb-layer-gold"></span>
                    <span className="term-left-home-orb-layer term-left-home-orb-layer-muted"></span>
                  </span>
                </span>
              </Link>
              <div className="term-title-stack">
                <div className="term-title-zh" id="termTitleZh">{term.zh || term.nameZh}</div>
                <div className="term-title-en" id="termTitleEn">{term.en || term.nameEn}</div>
              </div>
            </div>
            <div className="term-title-switch-hint" aria-label="Scroll to switch term hint">
              <div className="term-title-switch-hint-zh">滚动切换节气</div>
              <div className="term-title-switch-hint-en">Scroll to switch term</div>
            </div>
          </div>

          <div
            className={`term-badge term-term-nav${isTermNavHover ? ' is-hover' : ''}`}
            role="button"
            tabIndex={0}
            aria-label="Term navigator"
            onMouseEnter={() => setIsTermNavHover(true)}
            onMouseLeave={() => setIsTermNavHover(false)}
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
            <div className="term-term-nav-pop-hint">Scroll to switch term</div>
            <div className="term-term-nav-pop-next">Next: {nextTerm?.zh || ''} ({Number(nextTerm?.solarLon || 0).toFixed(0)}°)</div>
          </div>
        </div>
        </div>

        <Link className="term-grid-link" to="/calendar" aria-label="Year calendar grid">
          <span className="term-grid-icon" aria-hidden="true"></span>
        </Link>

        <div className={`term-solar-panel-wrap${isTermNavHover ? ' is-hover' : ''}`}>
          <div
            className="term-solar-panel-hover-zone"
            onMouseEnter={() => {
              setIsTermNavHover(true);
              setIsSolarPanelHover(true);
            }}
            onMouseLeave={() => {
              setIsTermNavHover(false);
              setIsSolarPanelHover(false);
            }}
          >
          <aside
            className="term-solar-panel"
            role="button"
            tabIndex={0}
            aria-label="Term navigator panel"
            style={solarPanelStyle}
            onKeyDown={handleTermNavKeyDown}
          >
            <div className="term-solar-panel-value">{Number(term.solarLon || 0).toFixed(0)}°</div>
            <div className="term-solar-panel-copy">
              <div className="term-solar-panel-note" lang="en">{panelCopy.en}</div>
              <div className="term-solar-panel-note-zh">{panelCopy.zh}</div>
            </div>
          </aside>
          <div className="term-solar-panel-caption-wrap">
            <div className="term-solar-panel-caption-toggle" role="group" aria-label="Caption language">
              <button
                type="button"
                className={`term-solar-panel-caption-toggle-btn${solarCaptionLang === 'zh' ? ' is-active' : ''}`}
                aria-pressed={solarCaptionLang === 'zh'}
                onClick={() => setSolarCaptionLang('zh')}
              >
                CN
              </button>
              <button
                type="button"
                className={`term-solar-panel-caption-toggle-btn${solarCaptionLang === 'en' ? ' is-active' : ''}`}
                aria-pressed={solarCaptionLang === 'en'}
                onClick={() => setSolarCaptionLang('en')}
              >
                EN
              </button>
            </div>
            {solarCaptionLang === 'en' ? (
              <p className="term-solar-panel-caption-body" lang="en">
                The solar longitude is a way scientists describe the Sun&apos;s position along its apparent path in the sky (the ecliptic). Solar longitude can be understood through the changing length of a shadow. As the sun&apos;s apparent position shifts along the ecliptic through the year, the sun&apos;s height in the sky changes, and the shadow cast at the same time of day becomes longer or shorter. In this way, shadow length becomes a visible trace of solar longitude.
              </p>
            ) : (
              <p className="term-solar-panel-caption-body term-solar-panel-caption-body-zh" lang="zh-Hans">
                太阳黄经是科学上用来描述太阳在天空中沿黄道（太阳运动路径）位置的一种方式。太阳黄经可以通过影长的变化来理解。随着太阳在黄道上的视位置于一年中不断移动，太阳在天空中的高度也随之变化，因此在同一时刻投下的影子会变长或变短。由此，影长成为太阳黄经的一种可见痕迹。
              </p>
            )}
          </div>

          </div>
        </div>

        <TermMenuRing
          menuItems={MENU_ITEMS}
          menuRotation={menuRotation}
          activeMenu={activeMenu}
          alignMenuToTop={alignMenuToTop}
          menuRingColor={termBaseColor}
          onHoverChange={setIsMenuRingHover}
        />

        <TermCenterPanels
          activeMenu={activeMenu}
          content={content}
          phaseRows={phaseRows}
          onContentMouseEnter={() => setIsContentHover(true)}
          onContentMouseLeave={() => setIsContentHover(false)}
        />
      </div>
    </div>
  );
};

export default TermDetail;
