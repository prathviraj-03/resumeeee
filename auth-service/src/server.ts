
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from './config/env.config';
import prisma from './config/database.config';
import redisClient from './config/redis.config';
import authRoutes from './modules/auth/auth.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok' });
});

// Mount auth routes
app.use('/api/auth', authRoutes);

// Connect database and redis (prisma and redisClient are imported, connection is handled in their configs)

// Start server
const port = config.port || 3000;
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
