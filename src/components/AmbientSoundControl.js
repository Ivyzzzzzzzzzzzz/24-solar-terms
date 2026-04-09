import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAmbientAudio } from '../audio/AmbientAudioProvider';
import './AmbientSoundControl.css';

const STATUS_LABEL = {
  idle: 'Sound off',
  starting: 'Starting sound',
  ready: 'Sound on',
  error: 'Retry sound',
  unsupported: 'Audio unavailable'
};

const AmbientSoundControl = () => {
  const location = useLocation();
  const {
    enabled,
    status,
    supported,
    toggleEnabled
  } = useAmbientAudio();

  const stateLabel = STATUS_LABEL[status] || STATUS_LABEL.idle;
  const path = location.pathname || '/';
  const pageClass = path.startsWith('/term/')
    ? 'is-term'
    : path === '/calendar'
      ? 'is-calendar'
      : (path === '/' || path === '/intro')
        ? 'is-landing'
        : 'is-default';

  return (
    <div className={`ambient-sound-control-shell ${pageClass}`}>
      <button
        type="button"
        className={`ambient-sound-control${enabled ? ' is-on' : ''}`}
        onClick={toggleEnabled}
        disabled={!supported || status === 'starting'}
        aria-pressed={enabled}
        aria-label={supported ? stateLabel : 'Audio unavailable in this browser'}
      >
        <span className="ambient-sound-control-state">{stateLabel}</span>
      </button>
    </div>
  );
};

export default AmbientSoundControl;
