export const TOKEN_EXPIRY = {
	ACCESS: '1h',
	REFRESH: '7d',
} as const;

export const ROLES = {
	USER: 'user',
	ADMIN: 'admin',
};

export const ERROR_MESSAGES = {
	INVALID_CREDENTIALS: 'Invalid credentials',
	UNAUTHORIZED: 'Unauthorized',
	FORBIDDEN: 'Forbidden',
	TOKEN_EXPIRED: 'Token expired',
	INTERNAL_ERROR: 'Internal server error',
};

export const RATE_LIMITS = {
	WINDOW_MS: 15 * 60 * 1000, // 15 minutes
	MAX_REQUESTS: 100,
};
