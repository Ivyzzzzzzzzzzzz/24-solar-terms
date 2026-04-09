import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAmbientAudio } from '../audio/AmbientAudioProvider';
import { P5Wrapper, SolarDial } from '../components';
import { getCurrentTermId } from '../data';
import './Landing.css';

const LUNAR_DAY_LABELS = [
  '',
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
];

function formatLunarDateZh(date) {
  try {
    const fmt = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      month: 'long',
      day: 'numeric'
    });
    const parts = fmt.formatToParts(date);
    const monthRaw = (parts.find((p) => p.type === 'month')?.value || '').replace(/\s+/g, '');
    const dayRaw = parts.find((p) => p.type === 'day')?.value || '';
    const dayNum = Number.parseInt(dayRaw, 10);
    const monthLabel = monthRaw && monthRaw.includes('月') ? monthRaw : `${monthRaw}月`;
    const dayLabel = Number.isFinite(dayNum) && dayNum >= 1 && dayNum <= 30 ? LUNAR_DAY_LABELS[dayNum] : '';

    if (monthLabel && dayLabel) return `${monthLabel}${dayLabel}`;
  } catch (_) {
    // no-op: fallback below
  }

  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

const Landing = () => {
  const { previewTermId, setActiveTermId } = useAmbientAudio();
  const [today, setToday] = useState(() => new Date());
  const displayYear = useMemo(() => today.getFullYear(), [today]);
  const todayLabels = useMemo(() => {
    const monthShortEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      dateEn: `${monthShortEn[today.getMonth()]}. ${today.getDate()}`,
      dateZh: formatLunarDateZh(today)
    };
  }, [today]);
  const handleTermChange = useCallback((term, _termIndex, meta = {}) => {
    if (!term?.id) return;
    if (meta.isDragging) {
      previewTermId(term.id);
      return;
    }

    setActiveTermId(term.id, {
      playIdentity: Boolean(meta.isUserInteracted)
    });
  }, [previewTermId, setActiveTermId]);

  useEffect(() => {
    const currentTermId = getCurrentTermId();
    setActiveTermId(currentTermId);
  }, [setActiveTermId]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const timerId = window.setInterval(() => {
      setToday(new Date());
    }, 60000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.classList.add('landing-no-scroll');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    return () => {
      document.body.classList.remove('landing-no-scroll');
    };
  }, []);

  return (
    <div className="landing-page">
      <P5Wrapper />
      
      <section className="landing" id="landingPage">
        <div className="landing-title-wrap">
          <Link className="landing-title-link" to="/intro" aria-label="Introduction to the 24 solar terms">
            <div className="landing-title-row">
              <div className="landing-title-zh">二十四节气</div>
              <div className="landing-title">24 Solar Terms</div>
            </div>
          </Link>
          <div className="landing-meta" aria-live="polite">
            <div className="landing-meta-year">{displayYear}</div>
            <div className="landing-meta-date" aria-label={`${todayLabels.dateEn} ${todayLabels.dateZh}`}>
              <span className="landing-meta-date-en en">{todayLabels.dateEn}</span>
              <span className="landing-meta-date-sep" aria-hidden="true">/</span>
              <span className="landing-meta-date-zh zh">{todayLabels.dateZh}</span>
            </div>
          </div>
        </div>
        <Link className="term-grid-link" to="/calendar" aria-label="Year calendar grid">
          <span className="term-grid-icon" aria-hidden="true"></span>
        </Link>

        <div className="landing-dial">
          <SolarDial onTermChange={handleTermChange} />
        </div>
      </section>
    </div>
  );
};

export default Landing;
