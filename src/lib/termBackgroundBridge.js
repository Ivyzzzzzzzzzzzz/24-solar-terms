import { ensureP5Global } from './ensureP5Global';

let scriptLoadPromise = null;
let activeBackgroundOwner = null;

const SCRIPT_ID = 'termBackgroundExactScript';
const SCRIPT_SRC = '/term-background-exact.js';
const SCRIPT_STATUS_ATTR = 'data-term-bg-status';
const hasRuntimeApi = () =>
	typeof window.__termBgApplyTheme === 'function' &&
	typeof window.__termBgStartSeasonLoop === 'function' &&
	typeof window.__termBgDispose === 'function';
const getScriptStatus = (script) => script?.getAttribute(SCRIPT_STATUS_ATTR);
const setScriptStatus = (script, status) => {
	if (!script) return;
	script.setAttribute(SCRIPT_STATUS_ATTR, status);
};

export const ensureTermBackgroundScript = () => {
	if (scriptLoadPromise) return scriptLoadPromise;

	scriptLoadPromise = ensureP5Global()
		.then(
			() =>
				new Promise((resolve, reject) => {
					const existing = document.getElementById(SCRIPT_ID);

					const resolveWhenReady = () => {
						if (hasRuntimeApi()) {
							resolve();
							return;
						}

						window.setTimeout(() => {
							if (hasRuntimeApi()) {
								resolve();
							} else {
								reject(new Error('Term background runtime loaded but API not available.'));
							}
						}, 0);
					};
					const rejectLoad = () => reject(new Error('Failed to load term background runtime.'));

					if (existing) {
						if (hasRuntimeApi()) {
							resolve();
							return;
						}

						const status = getScriptStatus(existing);
						if (status === 'ready') {
							resolveWhenReady();
							return;
						}
						if (status === 'error') {
							existing.remove();
						} else {
							existing.addEventListener('load', resolveWhenReady, { once: true });
							existing.addEventListener('error', rejectLoad, { once: true });
							return;
						}
					}

					const script = document.createElement('script');
					script.id = SCRIPT_ID;
					script.src = SCRIPT_SRC;
					script.async = true;
					setScriptStatus(script, 'loading');

					script.onload = () => {
						setScriptStatus(script, 'ready');
						resolveWhenReady();
					};
					script.onerror = () => {
						setScriptStatus(script, 'error');
						rejectLoad();
					};

					document.body.appendChild(script);
				})
		)
		.catch((error) => {
		scriptLoadPromise = null;
		throw error;
	});

	return scriptLoadPromise;
};

export const claimTermBackgroundOwner = (owner) => {
	const nextOwner = owner ?? Symbol('term-background-owner');
	activeBackgroundOwner = nextOwner;
	return nextOwner;
};

export const isTermBackgroundOwnerActive = (owner) => owner != null && activeBackgroundOwner === owner;

export const releaseTermBackgroundOwner = (owner) => {
	if (owner != null && activeBackgroundOwner === owner) {
		activeBackgroundOwner = null;
	}
};

export const applyTermBackgroundTheme = (termId) => {
	if (typeof window.__termBgApplyTheme === 'function') {
		window.__termBgApplyTheme(termId);
	}
};

export const startTermBackgroundSeasonLoop = (options) => {
	if (typeof window.__termBgStartSeasonLoop === 'function') {
		window.__termBgStartSeasonLoop(options);
	}
};

export const moveTermBackgroundPointer = (point) => {
	if (typeof window.__termBgPointerMove === 'function') {
		try {
			window.__termBgPointerMove(point);
		} catch (_) {
			// Keep pointer-forwarding resilient while sketch runtime is warming up.
		}
	}
};

export const pressTermBackgroundPointer = (point) => {
	if (typeof window.__termBgPointerDown === 'function') {
		try {
			window.__termBgPointerDown(point);
		} catch (_) {
			// Keep pointer-forwarding resilient while sketch runtime is warming up.
		}
	}
};

export const leaveTermBackgroundPointer = () => {
	if (typeof window.__termBgPointerLeave === 'function') {
		try {
			window.__termBgPointerLeave();
		} catch (_) {
			// Ignore transient runtime errors from the p5 sketch teardown path.
		}
	}
};

export const disposeTermBackground = (owner) => {
	if (owner != null && !isTermBackgroundOwnerActive(owner)) {
		return;
	}

	activeBackgroundOwner = null;
	if (typeof window.__termBgDispose === 'function') {
		window.__termBgDispose();
	}
};
