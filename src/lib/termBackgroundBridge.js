let scriptLoadPromise = null;

const SCRIPT_ID = 'termBackgroundExactScript';
const SCRIPT_SRC = '/term-background-exact.js';

export const ensureTermBackgroundScript = () => {
	if (scriptLoadPromise) return scriptLoadPromise;

	scriptLoadPromise = new Promise((resolve, reject) => {
		const existing = document.getElementById(SCRIPT_ID);

		const resolveWhenReady = () => {
			if (typeof window.__termBgApplyTheme === 'function') {
				resolve();
				return;
			}

			window.setTimeout(() => {
				if (typeof window.__termBgApplyTheme === 'function') {
					resolve();
				} else {
					reject(new Error('Term background runtime loaded but API not available.'));
				}
			}, 0);
		};

		if (existing) {
			if (typeof window.__termBgApplyTheme === 'function') {
				resolve();
				return;
			}

			existing.addEventListener('load', resolveWhenReady, { once: true });
			existing.addEventListener('error', () => reject(new Error('Failed to load term background runtime.')), { once: true });
			return;
		}

		const script = document.createElement('script');
		script.id = SCRIPT_ID;
		script.src = SCRIPT_SRC;
		script.async = true;

		script.onload = resolveWhenReady;
		script.onerror = () => reject(new Error('Failed to load term background runtime.'));

		document.body.appendChild(script);
	});

	return scriptLoadPromise;
};

export const applyTermBackgroundTheme = (termId) => {
	if (typeof window.__termBgApplyTheme === 'function') {
		window.__termBgApplyTheme(termId);
	}
};

export const disposeTermBackground = () => {
	if (typeof window.__termBgDispose === 'function') {
		window.__termBgDispose();
	}
};
