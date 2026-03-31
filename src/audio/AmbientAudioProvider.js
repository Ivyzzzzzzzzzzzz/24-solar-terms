import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import AmbientAudioEngine, { isAmbientAudioSupported } from '../lib/ambientAudioEngine';
import { getCurrentTermId } from '../data';

const STORAGE_KEY = '__ambient_sound_enabled__';

const readStoredPreference = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch (_) {
    return false;
  }
};

const writeStoredPreference = (enabled) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch (_) {
    // Keep audio controls usable even when persistent storage is unavailable.
  }
};

const AmbientAudioContext = createContext(null);

export const AmbientAudioProvider = ({ children }) => {
  const supported = isAmbientAudioSupported();
  const engineRef = useRef(null);
  const gestureCleanupRef = useRef(null);
  const activeTermRef = useRef(getCurrentTermId());
  const enabledRef = useRef(false);

  const [activeTermId, setActiveTermIdState] = useState(activeTermRef.current);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState(supported ? 'idle' : 'unsupported');

  const clearGestureHandlers = useCallback(() => {
    if (!gestureCleanupRef.current) return;
    gestureCleanupRef.current();
    gestureCleanupRef.current = null;
  }, []);

  const ensureEngine = useCallback(() => {
    if (!supported) return null;
    if (!engineRef.current) {
      engineRef.current = new AmbientAudioEngine(activeTermRef.current);
    }
    return engineRef.current;
  }, [supported]);

  const startEngine = useCallback(async () => {
    if (!supported) {
      setStatus('unsupported');
      return false;
    }

    const engine = ensureEngine();
    if (!engine) return false;

    setStatus('starting');

    try {
      await engine.start(activeTermRef.current);
      enabledRef.current = true;
      setEnabled(true);
      setStatus('ready');
      return true;
    } catch (_) {
      enabledRef.current = false;
      setEnabled(false);
      setStatus('error');
      return false;
    }
  }, [ensureEngine, supported]);

  const stopEngine = useCallback(async () => {
    clearGestureHandlers();

    if (!engineRef.current) {
      enabledRef.current = false;
      setEnabled(false);
      setStatus(supported ? 'idle' : 'unsupported');
      return;
    }

    try {
      await engineRef.current.suspend();
    } catch (_) {
      // Keep UI responsive even if the runtime rejects audio suspension.
    }

    enabledRef.current = false;
    setEnabled(false);
    setStatus(supported ? 'idle' : 'unsupported');
  }, [clearGestureHandlers, supported]);

  const toggleEnabled = useCallback(async () => {
    if (!supported) {
      setStatus('unsupported');
      return;
    }

    if (enabledRef.current) {
      writeStoredPreference(false);
      await stopEngine();
      return;
    }

    clearGestureHandlers();
    const started = await startEngine();
    writeStoredPreference(started);
  }, [clearGestureHandlers, startEngine, stopEngine, supported]);

  const setActiveTermId = useCallback((termId, options = {}) => {
    const nextTermId = termId || getCurrentTermId();
    const shouldPlayIdentity = Boolean(options.playIdentity);
    const previousTermId = activeTermRef.current;
    const didChange = previousTermId !== nextTermId;

    activeTermRef.current = nextTermId;
    setActiveTermIdState((prev) => (prev === nextTermId ? prev : nextTermId));

    if (engineRef.current) {
      if (didChange) engineRef.current.setTerm(nextTermId);
      if (shouldPlayIdentity) engineRef.current.playTermIdentity(nextTermId);
    }
  }, []);

  const selectTermId = useCallback((termId, options = {}) => {
    setActiveTermId(termId, {
      ...options,
      playIdentity: true
    });
  }, [setActiveTermId]);

  useEffect(() => {
    if (!supported) return undefined;

    const preferredOn = readStoredPreference();
    if (!preferredOn) return undefined;

    const handleGesture = async () => {
      clearGestureHandlers();
      const started = await startEngine();
      if (!started) writeStoredPreference(false);
    };

    const detach = () => {
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };

    window.addEventListener('pointerdown', handleGesture, { once: true, passive: true });
    window.addEventListener('keydown', handleGesture, { once: true });
    gestureCleanupRef.current = detach;

    return detach;
  }, [clearGestureHandlers, startEngine, supported]);

  useEffect(() => () => {
    clearGestureHandlers();
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
  }, [clearGestureHandlers]);

  const value = useMemo(() => ({
    activeTermId,
    enabled,
    status,
    supported,
    setActiveTermId,
    selectTermId,
    toggleEnabled
  }), [activeTermId, enabled, selectTermId, setActiveTermId, status, supported, toggleEnabled]);

  return (
    <AmbientAudioContext.Provider value={value}>
      {children}
    </AmbientAudioContext.Provider>
  );
};

export const useAmbientAudio = () => {
  const context = useContext(AmbientAudioContext);
  if (!context) {
    throw new Error('useAmbientAudio must be used within AmbientAudioProvider.');
  }
  return context;
};

export const useAmbientTerm = (termId) => {
  const { setActiveTermId } = useAmbientAudio();

  useEffect(() => {
    if (!termId) return;
    setActiveTermId(termId);
  }, [setActiveTermId, termId]);
};
