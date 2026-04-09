import React from 'react';

const TermCenterPanels = ({
  activeMenu,
  content,
  phaseRows,
  onContentMouseEnter,
  onContentMouseLeave
}) => {
  const preventWidow = (text = '') => {
    const normalized = String(text).trim().replace(/\s+/g, ' ');
    return normalized.replace(/\s+([^\s]+)\s*$/, '\u00A0$1');
  };

  const getPhaseHoverText = (phase) => {
    return preventWidow(phase?.en || '');
  };

  const panelHoverProps = {
    onMouseEnter: onContentMouseEnter,
    onMouseLeave: onContentMouseLeave
  };

  return (
    <div className="term-center-content">
      <div
        className={`term-note ${activeMenu === 'note' ? 'is-visible' : ''}`}
        id="termNoteContent"
        aria-hidden={activeMenu !== 'note'}
        {...panelHoverProps}
      >
        <div className="term-note-en">
          <span className="term-note-en-text">
            {content.noteEn[0]}<br />
            {content.noteEn[1]}
          </span>
        </div>
        <div className="term-note-zh">
          {content.noteZh.map((line, idx) => (
            <React.Fragment key={`note-zh-${idx}`}>
              {line}
              {idx < content.noteZh.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div
        className={`term-phases ${activeMenu === 'phases' ? 'is-visible' : ''}`}
        id="termPhasesContent"
        aria-hidden={activeMenu !== 'phases'}
        {...panelHoverProps}
      >
        {phaseRows.slice(0, 3).map((phase, index) => (
          <div
            key={`phase-row-${index}`}
            className={`term-phases-row term-phases-row-${index + 1}`}
            tabIndex={0}
          >
            <div className="term-phases-row-inner">
              <div className="term-phases-zh">{phase.zh}</div>
            </div>
            <div className="term-phases-hover-note">{getPhaseHoverText(phase)}</div>
          </div>
        ))}
      </div>

      <div
        className={`term-poem ${activeMenu === 'poem' ? 'is-visible' : ''}`}
        id="termPoemContent"
        aria-hidden={activeMenu !== 'poem'}
        {...panelHoverProps}
      >
        <div className="term-poem-verse">{content.poemVerse}</div>
        <div className="term-poem-author">{content.poemAuthor}</div>
        <div className="term-poem-title">{content.poemTitle}</div>
        <div className="term-poem-note">{content.poemNote}</div>
      </div>

      <div
        className={`term-ritual ${activeMenu === 'ritual' ? 'is-visible' : ''}`}
        id="termRitualContent"
        aria-hidden={activeMenu !== 'ritual'}
        {...panelHoverProps}
      >
        <div className="term-ritual-col">
          <div
            className="term-ritual-artboard"
            style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/artboard-1-2.svg)` }}
            aria-hidden="true"
          ></div>
          <div className="term-ritual-trigger">
            <div className="term-ritual-marker"></div>
            <div className="term-ritual-note">{content.ritualNotes[0]}</div>
          </div>
        </div>

        <div className="term-ritual-col">
          <div
            className="term-ritual-artboard"
            style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/artboard-2-2.svg)` }}
            aria-hidden="true"
          ></div>
          <div className="term-ritual-trigger">
            <div className="term-ritual-marker"></div>
            <div className="term-ritual-note">{content.ritualNotes[1]}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermCenterPanels;
