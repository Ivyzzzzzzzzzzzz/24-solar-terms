import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAmbientAudio } from '../audio/AmbientAudioProvider';
import './AmbientSoundControl.css';

const STATUS_LABEL = {
  idle: { en: 'Sound off', zh: '关闭声音' },
  starting: { en: 'Starting sound', zh: '启动声音中' },
  ready: { en: 'Sound on', zh: '开启声音' },
  error: { en: 'Retry sound', zh: '重试声音' },
  unsupported: { en: 'Audio unavailable', zh: '音频不可用' }
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
  const stateLabelText = `${stateLabel.en} ${stateLabel.zh}`;
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
          <span className="ambient-sound-control-state-en">{stateLabel.en}</span>
          <span className="ambient-sound-control-state-zh">{stateLabel.zh}</span>
        </span>
      </button>
    </div>
  );
};

export default AmbientSoundControl;
