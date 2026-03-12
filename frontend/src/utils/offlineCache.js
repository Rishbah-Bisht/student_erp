import localforage from 'localforage';

const store = localforage.createInstance({
    name: 'student-erp',
    storeName: 'api_cache'
});

export const setCached = async (key, data) => {
    await store.setItem(key, { data, ts: Date.now() });
};

export const getCached = async (key, maxAgeMs = 5 * 60 * 1000) => {
    const cached = await store.getItem(key);
    if (!cached) return null;
    if (Date.now() - cached.ts > maxAgeMs) return null;
    return cached.data;
};
