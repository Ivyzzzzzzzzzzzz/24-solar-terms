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
  const suppressIdentityUntilRef = useRef(0);
  const startAttemptRef = useRef(0);

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

  const startEngine = useCallback(async (options = {}) => {
    const attemptId = ++startAttemptRef.current;
    const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(0, options.timeoutMs) : 0;
    const failureStatus = options.failureStatus || 'error';

    if (!supported) {
      setStatus('unsupported');
      return false;
    }

    const engine = ensureEngine();
    if (!engine) return false;

    setStatus('starting');

    try {
      const startPromise = engine.start(activeTermRef.current);

      if (timeoutMs > 0) {
        await new Promise((resolve, reject) => {
          let settled = false;
          const finish = (fn, value) => {
            if (settled) return;
            settled = true;
            if (timerId) window.clearTimeout(timerId);
            fn(value);
          };

          const timerId = window.setTimeout(() => {
            finish(reject, new Error('start-timeout'));
          }, timeoutMs);

          startPromise
            .then(() => finish(resolve))
            .catch((error) => finish(reject, error));
        });
      } else {
        await startPromise;
      }

      if (attemptId !== startAttemptRef.current) return enabledRef.current;

      enabledRef.current = true;
      setEnabled(true);
      setStatus('ready');
      return true;
    } catch (_) {
      if (attemptId !== startAttemptRef.current || enabledRef.current) {
        return enabledRef.current;
      }

      try {
        await engine.suspend({ immediate: true });
      } catch (_) {
        // Keep startup fallback resilient if suspend is unavailable.
      }

      enabledRef.current = false;
      setEnabled(false);
      setStatus(failureStatus);
      return false;
    }
  }, [ensureEngine, supported]);

  const stopEngine = useCallback(async (options = {}) => {
    const immediate = Boolean(options.immediate);
    startAttemptRef.current += 1;
    clearGestureHandlers();

    if (!engineRef.current) {
      enabledRef.current = false;
      setEnabled(false);
      setStatus(supported ? 'idle' : 'unsupported');
      return;
    }

    try {
      await engineRef.current.suspend({ immediate });
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
      await stopEngine({ immediate: true });
      return;
    }

    // Avoid one-shot identity cues when the user explicitly toggles sound.
    suppressIdentityUntilRef.current = Date.now() + 1500;
    clearGestureHandlers();
    const started = await startEngine();
    writeStoredPreference(started);
  }, [clearGestureHandlers, startEngine, stopEngine, supported]);

  const setActiveTermId = useCallback((termId, options = {}) => {
    const nextTermId = termId || getCurrentTermId();
    const shouldPlayIdentity = Boolean(options.playIdentity);
    const allowIdentityNow = Date.now() >= suppressIdentityUntilRef.current;
    const previousTermId = activeTermRef.current;
    const didChange = previousTermId !== nextTermId;

    activeTermRef.current = nextTermId;
    setActiveTermIdState((prev) => (prev === nextTermId ? prev : nextTermId));

    if (engineRef.current) {
      if (didChange) engineRef.current.setTerm(nextTermId);
      if (shouldPlayIdentity && allowIdentityNow) engineRef.current.playTermIdentity(nextTermId);
    }
  }, []);

  const selectTermId = useCallback((termId, options = {}) => {
    setActiveTermId(termId, {
      ...options,
      playIdentity: true
    });
  }, [setActiveTermId]);

  const previewTermId = useCallback((termId) => {
    const nextTermId = termId || getCurrentTermId();
    activeTermRef.current = nextTermId;

    if (engineRef.current) {
      engineRef.current.setTerm(nextTermId);
    }
  }, []);

  useEffect(() => {
    clearGestureHandlers();
    enabledRef.current = false;
    setEnabled(false);
    setStatus(supported ? 'idle' : 'unsupported');
    writeStoredPreference(false);
  }, [clearGestureHandlers, supported]);

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
    previewTermId,
    selectTermId,
    toggleEnabled
  }), [activeTermId, enabled, previewTermId, selectTermId, setActiveTermId, status, supported, toggleEnabled]);

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
