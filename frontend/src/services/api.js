import axios from 'axios';

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

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('studentToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('studentToken');
            localStorage.removeItem('studentInfo');
            window.location.href = '/student/login';
        }
        return Promise.reject(error);
    }
);

export default api;
