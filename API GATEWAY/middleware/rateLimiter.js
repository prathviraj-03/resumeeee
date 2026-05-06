const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// ── Redis store (optional) ──────────────────────────────────────────────────
// If Redis is unavailable, fall back to in-memory limiter so the gateway
// still boots. This is safe for single-instance dev setups.
let RedisStore = null;
let redisClient = null;

try {
    const redis = require('redis');
    const RLS = require('rate-limit-redis');
    RedisStore = RLS.default || RLS;

    redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: { connectTimeout: 3000, reconnectStrategy: false }, // Don't keep retrying in dev
    });

    redisClient.on('error', (err) => {
        logger.warn(`[RateLimit] Redis unavailable — using in-memory fallback. (${err.message})`);
        redisClient = null; // Disable Redis store
    });

    redisClient.connect().catch((err) => {
        logger.warn(`[RateLimit] Redis connect failed — using in-memory fallback. (${err.message})`);
        redisClient = null;
    });
} catch (e) {
    logger.warn('[RateLimit] redis or rate-limit-redis not installed — using in-memory limiter.');
}

// Helper: build store config only when Redis is ready
function buildStore() {
    if (redisClient && RedisStore) {
        return new RedisStore({
            sendCommand: (...args) => redisClient.sendCommand(args),
        });
    }
    return undefined; // Falls back to express-rate-limit's in-memory store
}

// ── General limiter: 100 req/min per IP ────────────────────────────────────
const generalRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: buildStore(),
    message: {
        error: 'Too many requests — please try again in a minute.',
        status: 429,
    },
});

// ── AI limiter: 20 req/min per IP ─────────────────────────────────────────
// Lower limit because each optimize call hits OpenAI and costs money.
const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: buildStore(),
    message: {
        error: 'AI rate limit reached — please wait a minute before generating another resume.',
        status: 429,
    },
});

module.exports = { generalRateLimiter, aiRateLimiter };
