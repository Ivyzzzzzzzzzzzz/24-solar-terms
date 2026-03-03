import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Landing, TermsList, TermDetail, YearCalendar } from './pages';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/calendar" element={<YearCalendar />} />
        <Route path="/terms" element={<TermsList />} />
        <Route path="/term/:termId" element={<TermDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
