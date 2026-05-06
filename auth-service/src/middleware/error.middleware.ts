import { NextFunction, Request, Response } from 'express';
import logger from '../common/logger';
import { ERROR_MESSAGES } from '../common/constants';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
	logger.error({ err }, 'Error occurred');

	// Validation error
	if (err.isJoi) {
		return res.status(400).json({ error: err.details[0].message });
	}

	// Explicit statusCode errors (e.g., thrown by service logic)
	if (typeof err.statusCode === 'number' && typeof err.message === 'string') {
		return res.status(err.statusCode).json({ error: err.message });
	}

	// Prisma database error
	if (err.code && err.code.startsWith('P')) {
		return res.status(500).json({ error: 'Database error' });
	}

	// Generic error
	res.status(500).json({ error: ERROR_MESSAGES.INTERNAL_ERROR });
}
