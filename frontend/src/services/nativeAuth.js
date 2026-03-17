const SENSITIVE_KEYS = new Set(['studentToken', 'studentInfo']);

let nativeSession = null;
let shimInstalled = false;

const getBridge = () => (typeof window !== 'undefined' ? window.NativeAuth : null);

const isNativePayload = (payload) => Boolean(payload && payload.isNativeShell);

const readBridgeBootstrap = () => {
    try {
        const raw = getBridge()?.getBootstrap?.();
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!isNativePayload(parsed)) return null;

        window.__NATIVE_AUTH_BOOTSTRAP__ = parsed;
        return parsed;
    } catch {
        return null;
    }
};

const parseBootstrap = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    if (isNativePayload(window.__NATIVE_AUTH_BOOTSTRAP__)) {
        return window.__NATIVE_AUTH_BOOTSTRAP__;
    }

    return readBridgeBootstrap();
};

const applyNativeSession = (payload) => {
    nativeSession = isNativePayload(payload) ? payload : null;
};

const clearSensitiveKey = (key) => {
    if (!nativeSession) return;

    if (key === 'studentToken') {
        nativeSession = { ...nativeSession, accessToken: null };
    } else if (key === 'studentInfo') {
        nativeSession = { ...nativeSession, student: null };
    }
};

const sensitiveValueFor = (key) => {
    if (!nativeSession) return null;

    if (key === 'studentToken') {
        return nativeSession.accessToken || null;
    }

    if (key === 'studentInfo') {
        return nativeSession.student ? JSON.stringify(nativeSession.student) : null;
    }

    return null;
};

const installStorageShim = () => {
    if (shimInstalled || typeof window === 'undefined') {
        return;
    }

    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    Storage.prototype.getItem = function getItem(key) {
        if (this === window.localStorage && nativeSession && SENSITIVE_KEYS.has(String(key))) {
            return sensitiveValueFor(String(key));
        }

        return originalGetItem.call(this, key);
    };

    Storage.prototype.setItem = function setItem(key, value) {
        if (this === window.localStorage && nativeSession && SENSITIVE_KEYS.has(String(key))) {
            if (key === 'studentToken') {
                nativeSession = { ...nativeSession, accessToken: String(value) };
            } else if (key === 'studentInfo') {
                try {
                    nativeSession = { ...nativeSession, student: JSON.parse(String(value)) };
                } catch {
                    nativeSession = { ...nativeSession };
                }
            }
            return;
        }

        return originalSetItem.call(this, key, value);
    };

    Storage.prototype.removeItem = function removeItem(key) {
        if (this === window.localStorage && nativeSession && SENSITIVE_KEYS.has(String(key))) {
            clearSensitiveKey(String(key));
            return;
        }

        return originalRemoveItem.call(this, key);
    };

    shimInstalled = true;
};

export const initNativeAuthBridge = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    installStorageShim();

    const bootstrap = parseBootstrap();
    if (!bootstrap) {
        return null;
    }

    applyNativeSession(bootstrap);
    window.__NATIVE_AUTH_SYNC__ = (payload) => {
        applyNativeSession(payload);
        window.__NATIVE_AUTH_BOOTSTRAP__ = payload;
    };

    return bootstrap;
};

export const isNativeShell = () => Boolean(nativeSession?.isNativeShell || isNativePayload(parseBootstrap()));

export const syncNativeSession = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    const bootstrap = readBridgeBootstrap() || parseBootstrap();
    if (!bootstrap) {
        return null;
    }

    applyNativeSession(bootstrap);
    window.__NATIVE_AUTH_BOOTSTRAP__ = bootstrap;
    return bootstrap;
};

export const triggerNativeLogout = (reason = 'logout') => {
    try {
        getBridge()?.logout?.(reason);
    } catch {
        // Native bridge may be absent when running in a browser.
    }
};
