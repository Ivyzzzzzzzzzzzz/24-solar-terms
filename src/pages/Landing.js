import React, { useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAmbientAudio } from '../audio/AmbientAudioProvider';
import { P5Wrapper, SolarDial } from '../components';
import { getCurrentTermId } from '../data';
import './Landing.css';

const Landing = () => {
  const { previewTermId, setActiveTermId } = useAmbientAudio();
  const displayYear = useMemo(() => new Date().getFullYear(), []);
  const todayLabels = useMemo(() => {
    const now = new Date();
    const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
    return {
      dateEn: `${monthNames[now.getMonth()]} ${now.getDate()}`,
      dateZh: `${now.getMonth() + 1}月${now.getDate()}日`
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
