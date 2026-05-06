import crypto from 'crypto';

export function hashToken(token: string): string {
	return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSecureToken(length = 48): string {
	return crypto.randomBytes(length).toString('hex');
}
