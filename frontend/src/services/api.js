import axios from 'axios';
import { isNativeShell, syncNativeSession, triggerNativeLogout } from './nativeAuth';

const getBaseURL = () => {
    const envBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
    if (!envBase) return '/api';

    // If it's a full URL and doesn't end with /api, append it
    if (envBase.startsWith('http') && !envBase.includes('/api')) {
        return envBase.endsWith('/') ? `${envBase}api` : `${envBase}/api`;
    }
    return envBase;
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

const retryNativeRequest = async (error) => {
    const config = error?.config;
    if (!config) {
        return null;
    }

    const retryCount = Number(config.__nativeRetryCount || 0);
    if (retryCount >= 1) {
        return null;
    }

    const bootstrap = syncNativeSession();
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
        return 'token-invalid';
    }

    return 'session-expired';
};

api.interceptors.request.use((config) => {
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

        if (isNativeShell()) {
            if (statusCode === 503 || reason === 'db_unavailable') {
                return Promise.reject(error);
            }

            if (statusCode === 401) {
                const retriedResponse = await retryNativeRequest(error);
                if (retriedResponse) {
                    return retriedResponse;
                }

                triggerNativeLogout(nativeLogoutReason(reason));
            }

            return Promise.reject(error);
        }

        if (statusCode === 401) {
            localStorage.removeItem('studentToken');
            localStorage.removeItem('studentInfo');
            window.location.href = '/student/login';
        }

        return Promise.reject(error);
    }
);

export default api;
