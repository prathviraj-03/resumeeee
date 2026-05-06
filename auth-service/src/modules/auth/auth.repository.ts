import prisma from '../../config/database.config';

export async function createUser(email: string, password: string, role: string = 'user') {
	return prisma.user.create({
		data: { email, password, role },
	});
}

export async function findUserByEmail(email: string) {
	return prisma.user.findUnique({
		where: { email },
	});
}

export async function updateLastLogin(userId: string) {
	return prisma.user.update({
		where: { id: userId },
		data: { updatedAt: new Date() },
	});
}

export async function storeRefreshToken(userId: string, token: string, expiresAt: Date) {
	return prisma.refreshToken.create({
		data: { userId, token, expiresAt },
	});
}

export async function revokeRefreshToken(token: string) {
	return prisma.refreshToken.delete({
		where: { token },
	});
}

export async function findRefreshToken(token: string) {
	return prisma.refreshToken.findUnique({
		where: { token },
	});
}

export async function findPasswordResetToken(token: string) {
	return prisma.passwordResetToken.findUnique({
		where: { token },
	});
}

export async function revokePasswordResetToken(token: string) {
	return prisma.passwordResetToken.delete({
		where: { token },
	});
}

export async function storePasswordResetToken(userId: string, token: string, expiresAt: Date) {
	return prisma.passwordResetToken.create({
		data: { userId, token, expiresAt },
	});
}

export async function updateUserPassword(userId: string, password: string) {
	return prisma.user.update({
		where: { id: userId },
		data: { password },
	});
}
