import React from 'react';

const TermCenterPanels = ({ activeMenu, content, phaseRows }) => {
  const getPhaseHoverText = (phase) => {
    const text = phase?.en || '';
    const splitIndex = text.indexOf(':');
    return splitIndex >= 0 ? text.slice(splitIndex + 1).trim() : text;
  };

  return (
    <div className="term-center-content">
      <div className={`term-note ${activeMenu === 'note' ? 'is-visible' : ''}`} id="termNoteContent" aria-hidden={activeMenu !== 'note'}>
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

      <div className={`term-phases ${activeMenu === 'phases' ? 'is-visible' : ''}`} id="termPhasesContent" aria-hidden={activeMenu !== 'phases'}>
        {phaseRows[0] && (
          <>
            <div className="term-phases-row term-phases-row-1">
              <div className="term-phases-row-inner">
                <div className="term-phases-zh">{phaseRows[0].zh}</div>
                <div className="term-phases-en">{phaseRows[0].en}</div>
              </div>
            </div>
            <div className="term-phases-note">{content.phasesNote || ''}</div>
          </>
        )}

        {phaseRows[1] && (
          <div className="term-phases-row term-phases-row-2" tabIndex={0}>
            <div className="term-phases-en">{phaseRows[1].en}</div>
            <div className="term-phases-zh">{phaseRows[1].zh}</div>
            <div className="term-phases-hover-note">{getPhaseHoverText(phaseRows[1])}</div>
          </div>
        )}

        {phaseRows[2] && (
          <div className="term-phases-row term-phases-row-3" tabIndex={0}>
            <div className="term-phases-zh">{phaseRows[2].zh}</div>
            <div className="term-phases-en">{phaseRows[2].en}</div>
            <div className="term-phases-hover-note">{getPhaseHoverText(phaseRows[2])}</div>
          </div>
        )}
      </div>

      <div className={`term-poem ${activeMenu === 'poem' ? 'is-visible' : ''}`} id="termPoemContent" aria-hidden={activeMenu !== 'poem'}>
        <div className="term-poem-verse">{content.poemVerse}</div>
        <div className="term-poem-author">{content.poemAuthor}</div>
        <div className="term-poem-title">{content.poemTitle}</div>
        <div className="term-poem-note">{content.poemNote}</div>
      </div>

      <div className={`term-ritual ${activeMenu === 'ritual' ? 'is-visible' : ''}`} id="termRitualContent" aria-hidden={activeMenu !== 'ritual'}>
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
