import React from 'react';
import { Link } from 'react-router-dom';
import { useAmbientAudio, useAmbientTerm } from '../audio/AmbientAudioProvider';
import { TERM_LIST, getCurrentTermId } from '../data';
import './TermsList.css';

const TermsList = () => {
  const { selectTermId } = useAmbientAudio();
  useAmbientTerm(getCurrentTermId());
  const terms = TERM_LIST;

  return (
    <div className="terms-page">
      <header className="site-header terms-header">
        <div className="site-title">24 Solar Terms</div>
      </header>

      <main className="terms-main">
        <h1 className="terms-title">Term List</h1>
        <p className="terms-subtitle">Select a term to open its detail page.</p>
        <div id="termsList" className="terms-grid">
          {terms.map((term) => (
            <Link
              key={term.id}
              className="term-card"
              to={`/term/${term.id}`}
              onClick={() => selectTermId(term.id)}
            >
              <div><strong>{term.zh}</strong> — {term.en}</div>
              <div className="term-card-summary">
                {term.summary || ''}
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="terms-footer">24 Solar Terms</footer>
    </div>
  );
};

export default TermsList;
