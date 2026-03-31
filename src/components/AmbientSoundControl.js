import React from 'react';
import { useAmbientAudio } from '../audio/AmbientAudioProvider';
import { TERM_LIST } from '../data';
import './AmbientSoundControl.css';

const STATUS_LABEL = {
  idle: 'Sound off',
  starting: 'Starting sound',
  ready: 'Sound on',
  error: 'Retry sound',
  unsupported: 'Audio unavailable'
};

const AmbientSoundControl = () => {
  const {
    activeTermId,
    enabled,
    status,
    supported,
    toggleEnabled
  } = useAmbientAudio();

  const activeTerm = TERM_LIST.find((term) => term.id === activeTermId);
  const stateLabel = STATUS_LABEL[status] || STATUS_LABEL.idle;

  return (
    <div className="ambient-sound-control-shell">
      <button
        type="button"
        className={`ambient-sound-control${enabled ? ' is-on' : ''}`}
        onClick={toggleEnabled}
        disabled={!supported || status === 'starting'}
        aria-pressed={enabled}
        aria-label={supported ? stateLabel : 'Audio unavailable in this browser'}
      >
        <span className="ambient-sound-control-kicker">Ambient</span>
        <span className="ambient-sound-control-state">{stateLabel}</span>
        {activeTerm ? (
          <span className="ambient-sound-control-term">
            <span className="ambient-sound-control-term-zh">{activeTerm.zh}</span>
            <span className="ambient-sound-control-term-en">{activeTerm.en}</span>
          </span>
        ) : null}
      </button>
    </div>
  );
};

export default AmbientSoundControl;
