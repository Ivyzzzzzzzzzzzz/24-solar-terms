import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AmbientAudioProvider } from './audio/AmbientAudioProvider';
import AmbientSoundControl from './components/AmbientSoundControl';
import './App.css';

const Landing = lazy(() => import('./pages/Landing'));
const Intro = lazy(() => import('./pages/Intro'));
const TermsList = lazy(() => import('./pages/TermsList'));
const TermDetail = lazy(() => import('./pages/TermDetail'));
const YearCalendar = lazy(() => import('./pages/YearCalendar'));
const SHOW_AMBIENT_SOUND_CONTROL = true;

function isIntroPath(pathname = '') {
  return pathname.replace(/\/+$/, '') === '/intro';
}

function HistoryTracker() {
  const location = useLocation();

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}${location.hash}`;

    try {
      const existingCurrent = sessionStorage.getItem('__current_path__');
      if (existingCurrent && existingCurrent !== currentPath) {
        sessionStorage.setItem('__prev_path__', existingCurrent);
      }
      sessionStorage.setItem('__current_path__', currentPath);
    } catch (_) {
      // Keep navigation resilient when storage is unavailable.
    }
  }, [location]);

  return null;
}

function IntroRoute({ shouldShowLandingFirst, onLandingRedirected }) {
  useEffect(() => {
    if (shouldShowLandingFirst) {
      onLandingRedirected();
    }
  }, [shouldShowLandingFirst, onLandingRedirected]);

  if (shouldShowLandingFirst) {
    return <Navigate to="/" replace />;
  }

  return <Intro />;
}

function App() {
  const [shouldShowLandingBeforeIntro, setShouldShowLandingBeforeIntro] = useState(() => (
    typeof window !== 'undefined' && isIntroPath(window.location.pathname)
  ));

  return (
    <AmbientAudioProvider>
      <Router>
        <HistoryTracker />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/intro"
              element={(
                <IntroRoute
                  shouldShowLandingFirst={shouldShowLandingBeforeIntro}
                  onLandingRedirected={() => setShouldShowLandingBeforeIntro(false)}
                />
              )}
            />
            <Route path="/calendar" element={<YearCalendar />} />
            <Route path="/terms" element={<TermsList />} />
            <Route path="/term/:termId" element={<TermDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        {SHOW_AMBIENT_SOUND_CONTROL ? <AmbientSoundControl /> : null}
      </Router>
    </AmbientAudioProvider>
  );
}

export default App;
