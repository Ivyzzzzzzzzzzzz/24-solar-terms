import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAmbientTerm } from '../audio/AmbientAudioProvider';
import { getCurrentTermId } from '../data';
import {
  claimTermBackgroundOwner,
  ensureTermBackgroundScript,
  isTermBackgroundOwnerActive,
  leaveTermBackgroundPointer,
  moveTermBackgroundPointer,
  pressTermBackgroundPointer,
  releaseTermBackgroundOwner,
  startTermBackgroundSeasonLoop
} from '../lib';
import './Intro.css';

const SEASON_LOOP_DURATION_MS = 60000;

const Intro = () => {
  useAmbientTerm(getCurrentTermId());
  const backgroundOwnerRef = useRef(Symbol('intro-term-background'));

  useEffect(() => {
    let alive = true;
    const owner = claimTermBackgroundOwner(backgroundOwnerRef.current);
    const restartTimers = [];
    const handlePointerMove = (event) => {
      if (!isTermBackgroundOwnerActive(owner)) return;
      moveTermBackgroundPointer({ x: event.clientX, y: event.clientY });
    };
    const handlePointerDown = (event) => {
      if (!isTermBackgroundOwnerActive(owner)) return;
      pressTermBackgroundPointer({ x: event.clientX, y: event.clientY });
    };
    const handlePointerLeave = () => {
      if (!isTermBackgroundOwnerActive(owner)) return;
      leaveTermBackgroundPointer();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('blur', handlePointerLeave);

    ensureTermBackgroundScript()
      .then(() => {
        if (!alive || !isTermBackgroundOwnerActive(owner)) return;
        startTermBackgroundSeasonLoop({ durationMs: SEASON_LOOP_DURATION_MS, forceRecreate: true });
        restartTimers.push(window.setTimeout(() => {
          if (!alive || !isTermBackgroundOwnerActive(owner)) return;
          startTermBackgroundSeasonLoop({ durationMs: SEASON_LOOP_DURATION_MS });
        }, 120));
        restartTimers.push(window.setTimeout(() => {
          if (!alive || !isTermBackgroundOwnerActive(owner)) return;
          startTermBackgroundSeasonLoop({ durationMs: SEASON_LOOP_DURATION_MS });
        }, 420));
      })
      .catch(() => {});

    return () => {
      alive = false;
      restartTimers.forEach((timerId) => window.clearTimeout(timerId));
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('blur', handlePointerLeave);
      leaveTermBackgroundPointer();
      releaseTermBackgroundOwner(owner);
    };
  }, []);

  return (
    <div className="intro-page">
      <div id="termP5Mount" className="intro-p5" aria-hidden="true"></div>
      <header className="intro-header">
        <Link className="intro-back" to="/" aria-label="Back to landing">
          <span className="intro-back-label">Back</span>
        </Link>
        <div className="intro-title">
          <div className="intro-title-zh">二十四节气</div>
          <div className="intro-title-en">24 Solar Terms</div>
        </div>
      </header>

      <main className="intro-content">
        <p className="intro-lead">
          The 24 Solar Terms (Jieqi) divide the solar year into 24 seasonal markers.
          They were developed in ancient China to track changes in climate, guide farming,
          and mark shifts in light, temperature, and weather.
        </p>
        <p>
          Each term begins at a precise solar longitude and helps describe the rhythm of the year:
          from the first warming of spring, to the height of summer, to the deep of winter.
          The system is still used today in calendars, cultural practices, and traditional knowledge.
        </p>
      </main>
    </div>
  );
};

export default Intro;
