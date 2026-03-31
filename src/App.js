import React, { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AmbientAudioProvider } from './audio/AmbientAudioProvider';
import AmbientSoundControl from './components/AmbientSoundControl';
import Landing from './pages/Landing';
import Intro from './pages/Intro';
import TermsList from './pages/TermsList';
import TermDetail from './pages/TermDetail';
import YearCalendar from './pages/YearCalendar';
import './App.css';

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

function App() {
  return (
    <AmbientAudioProvider>
      <Router>
        <HistoryTracker />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/calendar" element={<YearCalendar />} />
          <Route path="/terms" element={<TermsList />} />
          <Route path="/term/:termId" element={<TermDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AmbientSoundControl />
      </Router>
    </AmbientAudioProvider>
  );
}

export default App;
