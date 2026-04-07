import React, { useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAmbientAudio } from '../audio/AmbientAudioProvider';
import { P5Wrapper, SolarDial } from '../components';
import { getCurrentTermId } from '../data';
import './Landing.css';

const HANZI_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

const toHanziNumber = (value) => {
  if (value <= 10) return value === 10 ? '十' : HANZI_DIGITS[value];
  if (value < 20) return `十${HANZI_DIGITS[value - 10]}`;
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return `${HANZI_DIGITS[tens]}十${ones ? HANZI_DIGITS[ones] : ''}`;
};

const Landing = () => {
  const { previewTermId, setActiveTermId } = useAmbientAudio();
  const displayYear = useMemo(() => new Date().getFullYear(), []);
  const todayLabels = useMemo(() => {
    const now = new Date();
    const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
    return {
      dateEn: `${monthNames[now.getMonth()]} ${now.getDate()}`,
      dateZh: `${toHanziNumber(now.getMonth() + 1)}月${toHanziNumber(now.getDate())}日`
    };
  }, []);
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
    setActiveTermId(getCurrentTermId());
  }, [setActiveTermId]);

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
