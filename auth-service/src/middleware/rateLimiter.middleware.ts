import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../common/constants';

export const loginLimiter = rateLimit({
	windowMs: RATE_LIMITS.WINDOW_MS,
	max: RATE_LIMITS.MAX_REQUESTS,
	message: 'Too many login attempts, please try again later.',
});

export const passwordResetLimiter = rateLimit({
	windowMs: RATE_LIMITS.WINDOW_MS,
	max: RATE_LIMITS.MAX_REQUESTS,
	message: 'Too many password reset attempts, please try again later.',
});
