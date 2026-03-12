const Redis = require('ioredis');
const { LRUCache } = require('lru-cache');

const defaultTtlSeconds = Number(process.env.CACHE_TTL_SECONDS || 60);
const memoryCache = new LRUCache({ max: 500, ttl: defaultTtlSeconds * 1000 });

let redis = null;
if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
    redis.on('error', () => {
        // Fail silently to keep API responsive if Redis is down.
    });
}

const buildKey = (prefix, userId, url) => `${prefix}:${userId}:${url}`;

const getCache = async (key) => {
    if (redis) {
        const cached = await redis.get(key);
        if (cached) return JSON.parse(cached);
    }
    return memoryCache.get(key);
};

const setCache = async (key, value, ttlSeconds) => {
    memoryCache.set(key, value, { ttl: ttlSeconds * 1000 });
    if (redis) {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    }
};

const cacheMiddleware = (ttlSeconds = defaultTtlSeconds, options = {}) => async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const { prefix = 'cache', varyByUser = true } = options;
    const userKey = varyByUser ? (req.user?.id || 'public') : 'public';
    const key = buildKey(prefix, userKey, req.originalUrl);

    try {
        const cached = await getCache(key);
        if (cached) return res.json(cached);
    } catch (err) {
        // ignore cache failures
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
        setCache(key, body, ttlSeconds).catch(() => {});
        return originalJson(body);
    };

    next();
};

const invalidateUserCache = async (userId, prefix = 'cache') => {
    const userKey = userId || 'public';
    const memoryKeys = Array.from(memoryCache.keys());
    memoryKeys.forEach((key) => {
        if (key.startsWith(`${prefix}:${userKey}:`)) memoryCache.delete(key);
    });

    if (!redis) return;

    let cursor = '0';
    do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}:${userKey}:*`, 'COUNT', 100);
        if (keys.length) await redis.del(keys);
        cursor = nextCursor;
    } while (cursor !== '0');
};

module.exports = {
    cacheMiddleware,
    invalidateUserCache,
    redis
};
