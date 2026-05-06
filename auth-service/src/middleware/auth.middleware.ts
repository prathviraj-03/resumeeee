
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { ERROR_MESSAGES, ROLES } from '../common/constants';

interface AuthPayload {
	id: string;
	role: string;
	[key: string]: any;
}

interface AuthenticatedRequest extends Request {
	user?: AuthPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	const token = authHeader.split(' ')[1];
	const payload = verifyToken(token, process.env.JWT_SECRET!);
	if (!payload || typeof payload !== 'object' || !('role' in payload)) {
		return res.status(401).json({ error: ERROR_MESSAGES.TOKEN_EXPIRED });
	}
	req.user = payload as AuthPayload;
	next();
}

export function authorize(roles: string[] = [ROLES.USER]) {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.user || !roles.includes(req.user.role)) {
			return res.status(403).json({ error: ERROR_MESSAGES.FORBIDDEN });
		}
		next();
	};
}