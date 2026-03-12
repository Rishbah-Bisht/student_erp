import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import api from '../services/api';
import { checkPushPermission, cleanupPushListeners, registerPushNotifications } from '../services/pushNotifications';

const ACTIVITY_PING_MS = 2 * 60 * 1000;
const APP_TYPE = 'student';
const PACKAGE_NAME = 'com.student.erp';

const getDevicePayload = async (cacheRef) => {
    if (cacheRef.current) return cacheRef.current;
    try {
        const info = await Device.getInfo();
        const id = await Device.getId().catch(() => ({}));
        cacheRef.current = {
            platform: info.platform || '',
            model: info.model || '',
            manufacturer: info.manufacturer || '',
            appVersion: info.appVersion || '',
            deviceId: id.identifier || '',
            appType: APP_TYPE,
            packageName: PACKAGE_NAME
        };
    } catch {
        cacheRef.current = { appType: APP_TYPE, packageName: PACKAGE_NAME };
    }
    return cacheRef.current;
};

export const useAppPresence = () => {
    const startedRef = useRef(false);
    const deviceCacheRef = useRef(null);

    useEffect(() => {
        let intervalId = null;
        let visibilityHandler = null;
        let appStateListener = null;
        let tokenWatcher = null;

        const sendActivity = async (event) => {
            try {
                const payload = { event };
                if (event === 'app_open') {
                    const devicePayload = await getDevicePayload(deviceCacheRef);
                    Object.assign(payload, devicePayload);
                }
                await api.post('/student/activity', payload);
            } catch {
                // Ignore background errors
            }
        };

        const registerPush = async () => {
            const pushEnabledOnThisDevice = localStorage.getItem('pushNotificationsEnabled') === 'true';
            if (!pushEnabledOnThisDevice) {
                const permission = await checkPushPermission();
                if (permission !== 'granted') return;
            }
            await registerPushNotifications();
        };

        const startPresence = () => {
            if (startedRef.current) return;
            const token = localStorage.getItem('studentToken');
            if (!token) return;

            startedRef.current = true;
            sendActivity('app_open');
            registerPush();

            intervalId = setInterval(() => sendActivity('heartbeat'), ACTIVITY_PING_MS);

            visibilityHandler = () => {
                if (document.visibilityState === 'visible') {
                    sendActivity('app_open');
                }
            };
            document.addEventListener('visibilitychange', visibilityHandler);

            if (Capacitor.isNativePlatform()) {
                appStateListener = App.addListener('appStateChange', (state) => {
                    if (state.isActive) sendActivity('app_open');
                });
            }
        };

        startPresence();

        if (!startedRef.current) {
            tokenWatcher = setInterval(() => {
                if (!startedRef.current) startPresence();
                if (startedRef.current && tokenWatcher) {
                    clearInterval(tokenWatcher);
                }
            }, 1000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (tokenWatcher) clearInterval(tokenWatcher);
            if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler);
            if (appStateListener) appStateListener.remove();
            cleanupPushListeners();
        };
    }, []);
};
