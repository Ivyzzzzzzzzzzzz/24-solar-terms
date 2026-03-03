import React from 'react';
import { Link } from 'react-router-dom';
import { TERM_LIST } from '../data';
import './TermsList.css';

const TermsList = () => {
  const terms = TERM_LIST;

  return (
    <div>
      <header className="site-header">
        <div className="site-title">24 Solar Terms</div>
        <nav>
          <ul className="site-nav">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/terms">Term List</Link></li>
          </ul>
        </nav>
      </header>

      <main>
        <h1>Term List</h1>
        <p>Select a term to open its detail page.</p>
        <div id="termsList" className="terms-grid">
          {terms.map((term) => (
            <Link
              key={term.id}
              className="term-card"
              to={`/term/${term.id}`}
            >
              <div><strong>{term.zh}</strong> — {term.en}</div>
              <div className="term-card-summary">
                {term.summary || ''}
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer>24 Solar Terms</footer>
    </div>
  );
};

export default TermsList;
