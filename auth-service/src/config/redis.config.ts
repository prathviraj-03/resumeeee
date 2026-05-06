import { createClient } from 'redis';
import { config } from './env.config';

const redisClient = createClient({
	url: config.redisUrl,
});

redisClient.on('error', (err) => {
	console.error('Redis error:', err);
});

redisClient.connect();

export default redisClient;
