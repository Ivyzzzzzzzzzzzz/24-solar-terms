let p5LoadPromise = null;

const P5_SCRIPT_ID = 'globalP5RuntimeScript';
const P5_SCRIPT_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js';
const P5_SCRIPT_LOADED_ATTR = 'data-p5-loaded';

export const ensureP5Global = async () => {
  if (typeof window === 'undefined') {
    throw new Error('p5 can only be loaded in a browser environment.');
  }

  if (window.p5) {
    return window.p5;
  }

  if (p5LoadPromise) {
    return p5LoadPromise;
  }

  p5LoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(P5_SCRIPT_ID);

    const resolveWhenReady = () => {
      window.setTimeout(() => {
        if (window.p5) {
          resolve(window.p5);
        } else {
          reject(new Error('p5 script loaded but window.p5 is unavailable.'));
        }
      }, 0);
    };

    const rejectLoad = () => reject(new Error('Failed to load p5 runtime.'));

    if (existing) {
      const alreadyLoaded = existing.readyState === 'complete'
        || existing.readyState === 'loaded'
        || existing.getAttribute(P5_SCRIPT_LOADED_ATTR) === '1';
      if (alreadyLoaded) {
        resolveWhenReady();
        return;
      }
      existing.addEventListener('load', resolveWhenReady, { once: true });
      existing.addEventListener('error', rejectLoad, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = P5_SCRIPT_ID;
    script.src = P5_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      script.setAttribute(P5_SCRIPT_LOADED_ATTR, '1');
      resolveWhenReady();
    };
    script.onerror = rejectLoad;
    document.head.appendChild(script);
  }).catch((error) => {
    p5LoadPromise = null;
    throw error;
  });

  return p5LoadPromise;
};
