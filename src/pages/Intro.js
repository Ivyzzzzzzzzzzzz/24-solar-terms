import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAmbientTerm } from '../audio/AmbientAudioProvider';
import { getCurrentTermId, TERM_COLORS } from '../data';
import {
  claimTermBackgroundOwner,
  ensureTermBackgroundScript,
  leaveTermBackgroundPointer,
  moveTermBackgroundPointer,
  pressTermBackgroundPointer,
  releaseTermBackgroundOwner,
  startTermBackgroundSeasonLoop,
  getYearProgressInfo,
  yearProgressDeg
} from '../lib';
import './Intro.css';

const SEASON_LOOP_DURATION_MS = 60000;
const LOOP_ENSURE_INTERVAL_MS = 320;

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

const INTRO_COPY = {
  en: [
    "The 24 Solar Terms are a traditional East Asian calendrical system that divides the solar year into 24 seasonal markers. Developed in ancient China, the system tracks the sun's movement through the year and names recurring changes in climate, daylight, temperature, weather, and ecological activity. Rather than measuring time only through numbered dates or months, the 24 Solar Terms describe time through observable transformation in the natural world: the first rain of spring, the ripening of grain, the height of heat, the arrival of frost, or the lengthening and shortening of days.",
    'Historically, the 24 Solar Terms were used to guide agricultural labor and seasonal decision-making, helping people know when to sow, harvest, prepare, rest, or adapt to environmental change. Over time, they also became embedded in everyday life through calendars, food customs, poetry, festivals, and local practices of observation. In this sense, the system functions not only as a way of counting time, but as a way of living with it.',
    'The title A Living Calendar comes from this understanding. Unlike a conventional calendar, which often feels fixed, abstract, and detached from lived experience, the 24 Solar Terms describe time as something dynamic, sensory, and relational. They are "living" because they emerge from the ongoing interaction between the sun, the earth, climate, human activity, and other forms of life. Time here is not simply read on a grid; it is seen in leaves, felt in temperature, heard in insects, tasted in seasonal food, and remembered through cultural practice.',
    "This project is an interactive website that reinterprets the Chinese 24 Solar Terms through ecological data, cultural practices, and personal reflection. By visualizing seasonal changes such as daylight, temperature, and natural rhythms, the website helps users reconnect calendar time with the environment around them. The 24 Solar Terms are recognized as an item of Intangible Cultural Heritage, and part of this project's intention is to help preserve and carry this knowledge forward. Through visual storytelling and interactive exploration, the project translates traditional knowledge into a contemporary experience that encourages people today to notice seasonal change and keep this cultural memory alive into the future."
  ],
  zh: [
    '二十四节气是一种传统的东亚历法系统，将一个太阳年划分为二十四个季节性的时间标记。它起源于中国古代，通过追踪太阳在一年中的运行，来命名气候、日照、温度、天气与生态活动中反复出现的变化。与其说它只是用数字日期或月份来计算时间，不如说二十四节气是通过自然界中可被观察到的转变来描述时间：例如春天的第一场雨、谷物的成熟、暑热的高点、霜的降临，或白昼长短的变化。',
    '在历史上，二十四节气被用来指导农业劳作与季节性的生活判断，帮助人们知道何时播种、收获、准备、休养，或因应环境变化。随着时间推移，它也逐渐嵌入日常生活之中，体现在历书、饮食习俗、诗歌、节庆以及各地的观察传统里。从这个意义上来说，它不仅是一种计时方式，也是一种与时间共同生活的方式。',
    '“时序有声”这个标题正是来自这样的理解。与传统日历常常给人固定、抽象、并且脱离生活经验的感觉不同，二十四节气所描述的时间是动态的、可感知的、也是关系性的。它之所以是“活着的”，是因为它来自太阳、地球、气候、人类活动以及其他生命形式之间持续发生的互动。这里的时间并不只是被读在一个网格上；它可以在树叶中被看见，在温度中被感知，在虫鸣中被听见，在时令食物中被品尝，也在文化实践中被记忆。',
    '这个项目是一个互动网站，通过生态数据、文化习俗与个人感受，重新诠释中国的二十四节气。网站通过可视化白昼时长、气温变化与自然节律等季节性变化，帮助使用者重新将日历中的时间与周围的环境连接起来。二十四节气已被列入非物质文化遗产，而本项目的其中一个意图，也是希望帮助保存并延续这份知识。通过视觉叙事与互动式探索，这个项目将传统知识转译为一种当代体验，鼓励今天的人们重新注意季节变化，并让这份文化记忆继续活在未来。'
  ]
};

const preventIntroWidow = (text = '') => {
  const normalized = String(text).trim().replace(/\s+/g, ' ');
  return normalized.replace(/\s+([^\s]+)\s*$/, '\u00A0$1');
};

const getIntroZhNoWidowParts = (text = '') => {
  const chars = Array.from(String(text).trim());
  if (chars.length <= 2) {
    return {
      head: chars.join(''),
      tail: '',
      hasTail: false
    };
  }

  const normalized = chars.join('');
  const trailingPunctuation = normalized.match(/[，。！？；：、,.!?;:）】》」』”’]+$/u)?.[0] || '';
  const keepCount = Math.min(chars.length, 2 + Array.from(trailingPunctuation).length);

  if (chars.length <= keepCount) {
    return {
      head: chars.join(''),
      tail: '',
      hasTail: false
    };
  }

  return {
    head: chars.slice(0, -keepCount).join(''),
    tail: chars.slice(-keepCount).join(''),
    hasTail: true
  };
};

const renderIntroParagraphText = (text, lang) => {
  if (lang !== 'zh') return preventIntroWidow(text);

  const { head, tail, hasTail } = getIntroZhNoWidowParts(text);
  if (!hasTail) return head;

  return (
    <>
      {head}
      <span className="intro-no-widow">{tail}</span>
    </>
  );
};

const Intro = () => {
  const currentTermId = getCurrentTermId();
  useAmbientTerm(currentTermId);
  const introOrbBaseColor = TERM_COLORS[currentTermId]?.base || '#9aa6b2';
  const introOrbBaseRgb = hexToRgbChannels(introOrbBaseColor);
  const introYearProgress = getYearProgressInfo();
  const introOrbPaletteStyle = {
    '--intro-orb-color-base-rgb': introOrbBaseRgb,
    '--intro-orb-ring-rgb': darkenRgbChannels(introOrbBaseRgb),
    '--orb-year-progress-deg': yearProgressDeg(introYearProgress.progress)
  };
  const backgroundOwnerRef = useRef(Symbol('intro-term-background'));
  const introPageRef = useRef(null);
  const introContentRef = useRef(null);
  const [introLang, setIntroLang] = useState('en');
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(true);

  useEffect(() => {
    let alive = true;
    const owner = claimTermBackgroundOwner(backgroundOwnerRef.current);
    let lastLoopEnsureAt = 0;
    const ensureSeasonLoopActive = ({ bypassInterval = false, restart = false } = {}) => {
      const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
        ? performance.now()
        : Date.now();
      if (!bypassInterval && now - lastLoopEnsureAt < LOOP_ENSURE_INTERVAL_MS) return;
      lastLoopEnsureAt = now;
      claimTermBackgroundOwner(owner);
      startTermBackgroundSeasonLoop({
        durationMs: SEASON_LOOP_DURATION_MS,
        restart
      });
    };
    const handlePointerMove = (event) => {
      ensureSeasonLoopActive();
      moveTermBackgroundPointer({ x: event.clientX, y: event.clientY });
    };
    const handlePointerDown = (event) => {
      ensureSeasonLoopActive({ bypassInterval: true });
      pressTermBackgroundPointer({ x: event.clientX, y: event.clientY });
    };
    const handlePointerLeave = () => {
      leaveTermBackgroundPointer();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('blur', handlePointerLeave);
    const loopWatchdog = window.setInterval(() => {
      ensureSeasonLoopActive({ bypassInterval: true });
    }, 1000);
    const handlePageWake = () => {
      ensureSeasonLoopActive({ bypassInterval: true });
    };
    window.addEventListener('focus', handlePageWake);
    document.addEventListener('visibilitychange', handlePageWake);

    ensureTermBackgroundScript()
      .then(() => {
        if (!alive) return;
        ensureSeasonLoopActive({ bypassInterval: true, restart: true });
      })
      .catch(() => {});

    return () => {
      alive = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('blur', handlePointerLeave);
      window.clearInterval(loopWatchdog);
      window.removeEventListener('focus', handlePageWake);
      document.removeEventListener('visibilitychange', handlePageWake);
      leaveTermBackgroundPointer();
      releaseTermBackgroundOwner(owner);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.classList.add('landing-no-scroll');
    if (typeof window !== 'undefined') {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch (_) {
        // Test environments may expose scrollTo without implementing it.
      }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    return () => {
      document.body.classList.remove('landing-no-scroll');
    };
  }, []);

  useEffect(() => {
    const contentEl = introContentRef.current;
    if (!contentEl) return;
    const scrollTop = contentEl.scrollTop;
    const maxScrollTop = Math.max(0, contentEl.scrollHeight - contentEl.clientHeight);
    const nextShowTop = scrollTop > 1;
    const nextShowBottom = maxScrollTop - scrollTop > 1;
    setShowTopFade(nextShowTop);
    setShowBottomFade(nextShowBottom);
  }, [introLang]);

  const handleIntroScroll = (event) => {
    const contentEl = event.currentTarget;
    const scrollTop = contentEl.scrollTop;
    const maxScrollTop = Math.max(0, contentEl.scrollHeight - contentEl.clientHeight);
    const nextShowTop = scrollTop > 1;
    const nextShowBottom = maxScrollTop - scrollTop > 1;
    setShowTopFade((prev) => (prev === nextShowTop ? prev : nextShowTop));
    setShowBottomFade((prev) => (prev === nextShowBottom ? prev : nextShowBottom));
  };

  return (
    <div className="intro-page" ref={introPageRef}>
      <div id="termP5Mount" className="intro-p5" aria-hidden="true"></div>
      <Link
        className="intro-home-link"
        to="/"
        aria-label="Go to landing page"
        style={introOrbPaletteStyle}
      >
        <span className="intro-home-orb" aria-hidden="true">
          <span className="intro-home-orb-fluid">
            <span className="intro-home-orb-spectrum"></span>
            <span className="intro-home-orb-stream"></span>
            <span className="intro-home-orb-layer intro-home-orb-layer-cool"></span>
            <span className="intro-home-orb-layer intro-home-orb-layer-warm"></span>
            <span className="intro-home-orb-layer intro-home-orb-layer-gold"></span>
            <span className="intro-home-orb-layer intro-home-orb-layer-muted"></span>
          </span>
        </span>
      </Link>
      <div className="intro-copy-layout">
        <header className="intro-header">
          <div className="intro-title">
            <div className="intro-title-zh">时序有声</div>
            <div className="intro-title-en">A Living Calendar</div>
          </div>
        </header>

        <section className="intro-copy-frame" aria-label="Intro copy">
          <div className="intro-lang-toggle" role="group" aria-label="Intro language">
            <button
              type="button"
              className={`intro-lang-toggle-btn${introLang === 'zh' ? ' is-active' : ''}`}
              aria-pressed={introLang === 'zh'}
              onClick={() => setIntroLang('zh')}
            >
              CN
            </button>
            <button
              type="button"
              className={`intro-lang-toggle-btn${introLang === 'en' ? ' is-active' : ''}`}
              aria-pressed={introLang === 'en'}
              onClick={() => setIntroLang('en')}
            >
              EN
            </button>
          </div>

          <main
            ref={introContentRef}
            className={`intro-content${introLang === 'zh' ? ' is-zh' : ''}${showTopFade ? ' has-top-fade' : ''}${showBottomFade ? ' has-bottom-fade' : ''}`}
            onScroll={handleIntroScroll}
          >
            {INTRO_COPY[introLang].map((paragraph, index) => (
              <p key={`intro-copy-${introLang}-${index}`} className={index === 0 ? 'intro-lead' : ''} lang={introLang === 'zh' ? 'zh-Hans' : 'en'}>
                {renderIntroParagraphText(paragraph, introLang)}
              </p>
            ))}
          </main>
        </section>
      </div>
    </div>
  );
};

export default Intro;
