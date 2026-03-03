import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { P5Wrapper, SolarDial } from '../components';
import { TERM_LIST } from '../data';
import './Landing.css';

const Landing = () => {
  const [activeTerm, setActiveTerm] = useState(TERM_LIST[0]);
  const displayYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="landing-page">
      <P5Wrapper />
      
      <section className="landing" id="landingPage">
        <div className="landing-title-wrap">
          <div className="landing-title">24 Solar Terms</div>
          <div className="landing-meta" aria-live="polite">
            <div className="landing-meta-year">{displayYear}</div>
            <div key={`en-${activeTerm?.id || 'init'}`} className="landing-meta-date landing-meta-date-en en">{activeTerm?.dateEn || ''}</div>
            <div key={`zh-${activeTerm?.id || 'init'}`} className="landing-meta-date landing-meta-date-zh zh">{activeTerm?.dateZh || ''}</div>
          </div>
        </div>
        <Link className="term-grid-link" to="/calendar" aria-label="Year calendar grid">
          <span className="term-grid-icon" aria-hidden="true"></span>
        </Link>

        <div className="landing-dial">
          <SolarDial onTermChange={setActiveTerm} />
        </div>
      </section>
    </div>
  );
};

export default Landing;
