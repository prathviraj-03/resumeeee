import {
	createUser,
	findUserByEmail,
	updateLastLogin,
	storeRefreshToken,
	revokeRefreshToken,
	findRefreshToken,
	findPasswordResetToken,
	revokePasswordResetToken,
	updateUserPassword,
	storePasswordResetToken,
} from './auth.repository';
import { hashPassword, comparePassword } from '../../utils/bcrypt.util';
import { signToken } from '../../utils/jwt.util';
import { generateSecureToken } from '../../utils/crypto.util';
import { TOKEN_EXPIRY } from '../../common/constants';

export async function register(email: string, password: string) {
	const existingUser = await findUserByEmail(email);
	if (existingUser) {
		throw { statusCode: 400, message: 'Email already in use' };
	}
	const hashed = await hashPassword(password);
	const user = await createUser(email, hashed);
	const accessToken = signToken({ id: user.id, role: user.role }, process.env.JWT_SECRET!, TOKEN_EXPIRY.ACCESS);
	const refreshTokenValue = generateSecureToken();
	const refreshToken = await storeRefreshToken(user.id, refreshTokenValue, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
	return { user, accessToken, refreshToken: refreshToken.token };
}

export async function login(email: string, password: string) {
	const user = await findUserByEmail(email);
	if (!user) {
		throw { statusCode: 401, message: 'Invalid credentials' };
	}
	const valid = await comparePassword(password, user.password);
	if (!valid) {
		throw { statusCode: 401, message: 'Invalid credentials' };
	}
	await updateLastLogin(user.id);
	const accessToken = signToken({ id: user.id, role: user.role }, process.env.JWT_SECRET!, TOKEN_EXPIRY.ACCESS);
	const refreshTokenValue = generateSecureToken();
	const refreshToken = await storeRefreshToken(user.id, refreshTokenValue, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
	return { user, accessToken, refreshToken: refreshToken.token };
}

export async function refreshToken(oldToken: string) {
	const tokenRecord = await findRefreshToken(oldToken);
	if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
		throw { statusCode: 401, message: 'Refresh token invalid or expired' };
	}
	await revokeRefreshToken(oldToken);
	const newRefreshTokenValue = generateSecureToken();
	const newRefreshToken = await storeRefreshToken(tokenRecord.userId, newRefreshTokenValue, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
	const user = await findUserByEmail(tokenRecord.userId);
	const accessToken = signToken({ id: tokenRecord.userId, role: user?.role || 'user' }, process.env.JWT_SECRET!, TOKEN_EXPIRY.ACCESS);
	return { accessToken, refreshToken: newRefreshToken.token };
}

export async function generatePasswordReset(email: string) {
	const user = await findUserByEmail(email);
	if (!user) {
		throw { statusCode: 404, message: 'User not found' };
	}
	const resetTokenValue = generateSecureToken();
	const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
	await storePasswordResetToken(user.id, resetTokenValue, expiresAt);
	return { resetToken: resetTokenValue, expiresAt };
}

export async function resetPassword(token: string, newPassword: string) {
	// Find reset token
	const tokenRecord = await findPasswordResetToken(token);
	if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
		throw { statusCode: 400, message: 'Reset token invalid or expired' };
	}

	const hashed = await hashPassword(newPassword);
	await updateUserPassword(tokenRecord.userId, hashed);
	await revokePasswordResetToken(token);
	return true;
}
