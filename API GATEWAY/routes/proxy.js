const { createProxyMiddleware } = require('http-proxy-middleware');
const verifyJWT = require('../middleware/auth');
const logger = require('../utils/logger');

const setupProxy = (app) => {
    const services = [
        // ── AI Service ────────────────────────────────────────────────────────
        // Routes: optimize, download, jobs, health
        // Rewrite: /api/ai/v1/* → /api/v1/*
        {
            prefix: '/api/ai',
            target: process.env.AI_SERVICE_URL || 'http://localhost:8001',
            auth: true,
        },

        // ── Auth Service ──────────────────────────────────────────────────────
        // Public — no JWT required
        {
            prefix: '/api/auth',
            target: process.env.AUTH_SERVICE_URL || 'http://localhost:3000',
            auth: false,
        },

        // ── Interview Service ─────────────────────────────────────────────────
        {
            prefix: '/api/interview',
            target: process.env.INTERVIEW_SERVICE_URL || 'http://localhost:8002',
            auth: true,
        },

        // ── Profile Service ───────────────────────────────────────────────────
        // Handles: profile CRUD, resume uploads, DOCX templates
        {
            prefix: '/api/profile',
            target: process.env.PROFILE_SERVICE_URL || 'http://localhost:3002',
            auth: true,
        },
        {
            prefix: '/api/resumes',
            target: process.env.PROFILE_SERVICE_URL || 'http://localhost:3002',
            auth: true,
        },
        {
            prefix: '/api/templates',
            target: process.env.PROFILE_SERVICE_URL || 'http://localhost:3002',
            auth: true,
        },

        // ── Skill Gap Service ─────────────────────────────────────────────────
        // Skill-gap analysis is handled by the AI Service.
        {
            prefix: '/api/skill-gap',
            target: process.env.AI_SERVICE_URL || 'http://localhost:8001',
            auth: true,
        },
    ];

    services.forEach(service => {
        const middlewares = [];

        if (service.auth) {
            middlewares.push(verifyJWT);
        }

        app.use(service.prefix, ...middlewares, createProxyMiddleware({
            target: service.target,
            changeOrigin: true,
            // ── Increase timeouts for the AI service (OpenAI call can take ~15s) ──
            proxyTimeout: 120000,   // 120s — wait for upstream
            timeout: 130000,        // 130s — socket timeout (slightly longer)

            pathRewrite: (path, req) => {
                let rewrittenPath;

                if (service.prefix === '/api/ai') {
                    // /api/ai/v1/optimize  →  /api/v1/optimize
                    rewrittenPath = '/api' + path;
                } else if (service.prefix === '/api/skill-gap') {
                    // /api/skill-gap/analyze  →  /api/v1/skill-gap/analyze
                    rewrittenPath = '/api/v1/skill-gap' + path;
                } else {
                    // Preserve full prefix for profile, auth, templates, etc.
                    rewrittenPath = service.prefix + path;
                }

                // Strip trailing slash (except root)
                if (rewrittenPath.length > 1 && rewrittenPath.endsWith('/')) {
                    rewrittenPath = rewrittenPath.slice(0, -1);
                }

                logger.info(`[Proxy] ${req.method} ${req.originalUrl} → ${service.target}${rewrittenPath}`);
                return rewrittenPath;
            },

            on: {
                proxyReq: (proxyReq, req) => {
                    // Forward request identity
                    proxyReq.setHeader('x-request-id', req.id);

                    if (req.user) {
                        // Normalise userId — JWT might use 'userId' or 'id'
                        const userId = req.user.userId || req.user.id || req.user.sub;
                        proxyReq.setHeader('x-user-id', String(userId));
                        proxyReq.setHeader('x-user-role', req.user.role || '');
                        proxyReq.setHeader('x-user-data', JSON.stringify(req.user));
                        logger.info(`[Proxy] → ${service.target} | User: ${userId} | ${req.method} ${req.originalUrl}`);
                    } else {
                        logger.warn(`[Proxy] → ${service.target} | No user context | ${req.method} ${req.originalUrl}`);
                    }
                },

                error: (err, req, res) => {
                    logger.error(`[Proxy Error] ${service.target} | ${err.code} | ${err.message}`);
                    if (!res.headersSent) {
                        const isTimeout = err.code === 'ECONNRESET' || err.message?.includes('timeout');
                        res.status(isTimeout ? 504 : 502).json({
                            error: isTimeout ? 'Gateway Timeout' : 'Bad Gateway',
                            message: isTimeout
                                ? 'The AI service is taking longer than expected. Please try again.'
                                : 'Upstream service unavailable.',
                            requestId: req.id,
                        });
                    }
                }
            }
        }));
    });
};

module.exports = setupProxy;
