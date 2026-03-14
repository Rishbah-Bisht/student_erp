import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { PushNotifications } from '@capacitor/push-notifications';
import api from './api';

const PUSH_ENABLED = import.meta.env.VITE_ENABLE_PUSH === 'true';
const APP_TYPE = 'student';
const PACKAGE_NAME = 'com.student.erp';

let devicePayloadPromise = null;
let pushListeners = [];
let pendingRegistrationResolve = null;
let pendingRegistrationPromise = null;

const PUSH_REGISTRATION_TIMEOUT_MS = 12000;

const clearPendingRegistration = () => {
    pendingRegistrationResolve = null;
    pendingRegistrationPromise = null;
};

const resolvePendingRegistration = (result) => {
    if (pendingRegistrationResolve) {
        pendingRegistrationResolve(result);
    }
    clearPendingRegistration();
};

const createPendingRegistration = () => {
    if (pendingRegistrationPromise) return pendingRegistrationPromise;

    pendingRegistrationPromise = new Promise((resolve) => {
        pendingRegistrationResolve = resolve;
    });

    return pendingRegistrationPromise;
};

const getDevicePayload = async () => {
    if (devicePayloadPromise) return devicePayloadPromise;

    devicePayloadPromise = (async () => {
        try {
            const info = await Device.getInfo();
            const id = await Device.getId().catch(() => ({}));
            return {
                platform: info.platform || '',
                model: info.model || '',
                manufacturer: info.manufacturer || '',
                appVersion: info.appVersion || '',
                deviceId: id.identifier || '',
                appType: APP_TYPE,
                packageName: PACKAGE_NAME
            };
        } catch {
            return {
                appType: APP_TYPE,
                packageName: PACKAGE_NAME
            };
        }
    })();

    return devicePayloadPromise;
};

const attachPushListeners = async () => {
    if (pushListeners.length > 0) return;

    const registrationListener = await PushNotifications.addListener('registration', async (token) => {
        try {
            const devicePayload = await getDevicePayload();
            await api.post('/student/device', {
                fcmToken: token.value,
                ...devicePayload
            });
            localStorage.setItem('pushNotificationsEnabled', 'true');
            resolvePendingRegistration({ ok: true, token: token.value });
        } catch (error) {
            localStorage.removeItem('pushNotificationsEnabled');
            resolvePendingRegistration({
                ok: false,
                reason: 'backend_registration_failed',
                message: error?.response?.data?.message || error?.message || 'Unable to save this device for notifications.'
            });
        }
    });

    const registrationErrorListener = await PushNotifications.addListener('registrationError', (error) => {
        localStorage.removeItem('pushNotificationsEnabled');
        resolvePendingRegistration({
            ok: false,
            reason: 'registration_error',
            message: error?.error || 'Firebase could not register this device for notifications.'
        });
    });

    pushListeners = [registrationListener, registrationErrorListener];
};

export const isPushEnabledInBuild = () => PUSH_ENABLED;

export const checkPushPermission = async () => {
    if (!Capacitor.isNativePlatform()) return 'unsupported';
    if (!PUSH_ENABLED) return 'disabled';

    try {
        const perm = await PushNotifications.checkPermissions();
        return perm.receive || 'prompt';
    } catch {
        return 'unknown';
    }
};

export const registerPushNotifications = async ({ requestPermission = false } = {}) => {
    if (!Capacitor.isNativePlatform()) {
        return { ok: false, reason: 'unsupported', message: 'Notifications can only be enabled inside the Android app.' };
    }

    if (!PUSH_ENABLED) {
        return { ok: false, reason: 'disabled', message: 'Push notifications are disabled in this build.' };
    }

    try {
        const perm = requestPermission
            ? await PushNotifications.requestPermissions()
            : await PushNotifications.checkPermissions();

        if (perm.receive !== 'granted') {
            return { ok: false, reason: perm.receive || 'denied', message: 'Notification permission was not granted.' };
        }

        await attachPushListeners();
        
        let timeoutId;
        const registrationResult = Promise.race([
            createPendingRegistration(),
            new Promise((resolve) => {
                timeoutId = setTimeout(() => {
                    resolve({
                        ok: false,
                        reason: 'timeout',
                        message: 'Timed out while registering this device for notifications.'
                    });
                }, PUSH_REGISTRATION_TIMEOUT_MS);
            })
        ]);

        try {
            await PushNotifications.register();
            const result = await registrationResult;
            clearTimeout(timeoutId);
            
            if (!result.ok) {
                localStorage.removeItem('pushNotificationsEnabled');
                cleanupPushListeners(); // Clean up if it failed
                return result;
            }

            return { ok: true, message: 'Notifications enabled for this device.' };
        } catch (regError) {
            clearTimeout(timeoutId);
            throw regError;
        }
    } catch (error) {
        localStorage.removeItem('pushNotificationsEnabled');
        clearPendingRegistration();
        cleanupPushListeners();
        return {
            ok: false,
            reason: 'error',
            message: error?.message || 'Unable to enable notifications right now.'
        };
    }
};

export const cleanupPushListeners = () => {
    pushListeners.forEach((listener) => listener.remove());
    pushListeners = [];
    clearPendingRegistration();
};
