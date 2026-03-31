import { useEffect, useRef } from 'react';
import {
  applyTermBackgroundTheme,
  claimTermBackgroundOwner,
  disposeTermBackground,
  ensureTermBackgroundScript,
  isTermBackgroundOwnerActive
} from '../lib';

const TermBackground = ({ termId }) => {
  const backgroundOwnerRef = useRef(Symbol('term-page-background'));

  useEffect(() => {
    const owner = claimTermBackgroundOwner(backgroundOwnerRef.current);

    return () => {
      disposeTermBackground(owner);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const owner = backgroundOwnerRef.current;
    window.__TERM_ID__ = termId;

    ensureTermBackgroundScript()
      .then(() => {
        if (!alive || !isTermBackgroundOwnerActive(owner)) return;
        applyTermBackgroundTheme(termId);
      })
      .catch(() => {
        // Keep UI resilient if runtime fails to load.
      });

    return () => {
      alive = false;
    };
  }, [termId]);

  return <div id="termP5Mount" aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
};

export default TermBackground;
