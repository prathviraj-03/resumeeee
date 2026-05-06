import {
	register,
	login,
	refreshToken,
	generatePasswordReset,
	resetPassword,
} from './auth.service';
import { registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.validator';
import { ERROR_MESSAGES } from '../../common/constants';
import { Request, Response, NextFunction } from 'express';

export async function registerController(req: Request, res: Response, next: NextFunction) {
	try {
		const { email, password } = await registerSchema.validateAsync(req.body);
		const result = await register(email, password);
		res.status(201).json(result);
	} catch (err) {
		next(err);
	}
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
	try {
		const { email, password } = await loginSchema.validateAsync(req.body);
		const result = await login(email, password);
		res.status(200).json(result);
	} catch (err) {
		next(err);
	}
}

export async function refreshController(req: Request, res: Response, next: NextFunction) {
	try {
		const { refreshToken: token } = await refreshTokenSchema.validateAsync(req.body);
		const result = await refreshToken(token);
		res.status(200).json(result);
	} catch (err) {
		next(err);
	}
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
	try {
		// Implement token revocation logic if needed
		res.status(200).json({ message: 'Logged out' });
	} catch (err) {
		next(err);
	}
}

export async function meController(req: Request, res: Response, next: NextFunction) {
	try {
		res.status(200).json({ user: req.user });
	} catch (err) {
		next(err);
	}
}

export async function forgotPasswordController(req: Request, res: Response, next: NextFunction) {
	try {
		const { email } = await forgotPasswordSchema.validateAsync(req.body);
		const result = await generatePasswordReset(email);
		res.status(200).json(result);
	} catch (err) {
		next(err);
	}
}

export async function resetPasswordController(req: Request, res: Response, next: NextFunction) {
	try {
		const { token, password } = await resetPasswordSchema.validateAsync(req.body);
		const result = await resetPassword(token, password);
		res.status(200).json({ success: result });
	} catch (err) {
		next(err);
	}
}