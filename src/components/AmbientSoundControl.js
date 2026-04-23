import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAmbientAudio } from '../audio/AmbientAudioProvider';
import './AmbientSoundControl.css';

const STATUS_LABEL = {
  idle: { en: 'Off', zh: '关' },
  starting: { en: 'Starting', zh: '启动中' },
  ready: { en: 'On', zh: '开' },
  error: { en: 'Retry', zh: '重试' },
  unsupported: { en: 'Unavailable', zh: '不可用' }
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
  const stateLabelText = `Music 音乐： ${stateLabel.en} ${stateLabel.zh}`;
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
        aria-label={supported ? stateLabelText : 'Audio unavailable 音频不可用'}
      >
        <span className="ambient-sound-control-state">
          <span className="ambient-sound-control-line ambient-sound-control-label">
            <span className="ambient-sound-control-en">Music</span>
            <span className="ambient-sound-control-zh">音乐：</span>
          </span>
          <span className="ambient-sound-control-line ambient-sound-control-value">
            <span className="ambient-sound-control-en">{stateLabel.en}</span>
            <span className="ambient-sound-control-zh">{stateLabel.zh}</span>
          </span>
        </span>
      </button>
    </div>
  );
};

export default AmbientSoundControl;
