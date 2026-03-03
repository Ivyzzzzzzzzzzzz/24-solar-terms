import { useEffect } from 'react';
import {
  applyTermBackgroundTheme,
  disposeTermBackground,
  ensureTermBackgroundScript
} from '../lib';

const TermBackground = ({ termId }) => {
  useEffect(() => {
    ensureTermBackgroundScript()
      .then(() => applyTermBackgroundTheme(window.__TERM_ID__ || termId))
      .catch(() => {
        // Keep UI resilient if runtime fails to load.
      });

    // initialize once; per-term updates happen in the effect below
  }, []);

  useEffect(() => {
    window.__TERM_ID__ = termId;

    ensureTermBackgroundScript()
      .then(() => applyTermBackgroundTheme(termId))
      .catch(() => {
        // Keep UI resilient if runtime fails to load.
      });
  }, [termId]);

  useEffect(() => {
    return () => {
      disposeTermBackground();
    };
  }, []);

  return <div id="termP5Mount" aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
};

export default TermBackground;
