require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const setupProxy = require('./routes/proxy');
const { generalRateLimiter, aiRateLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 8000;

// Global Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',  // Next.js frontend
        'http://localhost:5173',  // Vite dev server
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
// app.use(compression()); // Buffering interferes with multipart streams

app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Request ID Injection
app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    req.id = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Rate Limiting
app.use('/api/ai', aiRateLimiter);
app.use('/api', generalRateLimiter);

// Setup Proxy Routes
setupProxy(app);

// Error Handling
app.use((err, req, res, next) => {
    logger.error(`${req.id} - ${err.message}`);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            requestId: req.id
        }
    });
});

app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT}`);
});
