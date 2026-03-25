import axios from 'axios';
import { isNativeShell, refreshNativeSession, syncNativeSession, triggerNativeLogout } from './nativeAuth';

const LEGACY_API_ORIGIN = 'https://student-erp-server-api.vercel.app';
const PRIMARY_API_ORIGIN = 'https://student-erp-6w9m.onrender.com';

const normalizeBaseURL = (rawBase) => {
    const value = String(rawBase || '').trim();
    if (!value) return '/api';
    if (!value.startsWith('http')) return value;

    try {
        const url = new URL(value);

        if (url.origin === LEGACY_API_ORIGIN) {
            const target = new URL(PRIMARY_API_ORIGIN);
            url.protocol = target.protocol;
            url.host = target.host;
        }

        if (!url.pathname.startsWith('/api')) {
            url.pathname = `${url.pathname.replace(/\/+$/, '')}/api`;
        }

        return url.toString().replace(/\/$/, '');
    } catch (error) {
        if (!value.includes('/api')) {
            return value.endsWith('/') ? `${value}api` : `${value}/api`;
        }

        return value;
    }
};

const getBaseURL = () => {
    const envBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
    return normalizeBaseURL(envBase);
};

const api = axios.create({
    baseURL: getBaseURL(),
});

const normalizeAuthReason = (error) => {
    const rawReason = error?.response?.data?.error || error?.response?.data?.reason;
    if (!rawReason) return null;

    return String(rawReason).trim().toLowerCase().replace(/-/g, '_');
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryNativeRequest = async (error, options = {}) => {
    const config = error?.config;
    if (!config) {
        return null;
    }

    const retryCount = Number(config.__nativeRetryCount || 0);
    if (retryCount >= 1) {
        return null;
    }

    const bootstrap = options.forceRefresh
        ? refreshNativeSession() || syncNativeSession()
        : syncNativeSession();
    const token = bootstrap?.accessToken || localStorage.getItem('studentToken');
    if (!token) {
        return null;
    }

    config.__nativeRetryCount = retryCount + 1;
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-Native-App'] = 'android';

    await wait(400);
    return api.request(config);
};

const nativeLogoutReason = (reason) => {
    if (reason === 'token_invalid' || reason === 'token_missing') {
        return 'token_invalid';
    }

    return reason || 'session_expired';
};

const buildNativeLogoutPayload = (error, reason) => {
    const statusCode = error?.response?.status ?? null;
    const message = error?.response?.data?.message || error?.message || null;
    const path = typeof error?.config?.url === 'string' ? error.config.url : null;

    return {
        reason: nativeLogoutReason(reason),
        upstreamReason: reason,
        statusCode,
        message,
        path,
        source: 'webview_api'
    };
};

api.interceptors.request.use((config) => {
    if (isNativeShell()) {
        syncNativeSession();
    }

    const token = localStorage.getItem('studentToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const statusCode = error.response?.status;
        const reason = normalizeAuthReason(error);
        const requestUrl = error?.config?.url || '';

        // Never intercept 401s from login endpoints — let the login page handle them
        const isLoginRequest = requestUrl.includes('/login') || requestUrl.includes('/register');

        if (isNativeShell()) {
            if (statusCode === 503 || reason === 'db_unavailable') {
                return Promise.reject(error);
            }

            if (statusCode === 401 && !isLoginRequest) {
                const retriedResponse = await retryNativeRequest(error, { forceRefresh: true });
                if (retriedResponse) {
                    return retriedResponse;
                }

                triggerNativeLogout(buildNativeLogoutPayload(error, reason));
            }

            return Promise.reject(error);
        }

        if (statusCode === 401 && !isLoginRequest) {
            localStorage.removeItem('studentToken');
            localStorage.removeItem('studentInfo');
            window.location.href = '/student/login';
        }

        return Promise.reject(error);
    }
);

export default api;
