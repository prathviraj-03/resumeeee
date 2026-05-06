
import jwt, { SignOptions } from 'jsonwebtoken';

export function signToken(
	payload: { id: string; role: string; [key: string]: any },
	secret: string,
	expiresIn: SignOptions['expiresIn']
): string {
	return jwt.sign(payload as Record<string, unknown>, secret, { expiresIn });
}

export function verifyToken(token: string, secret: string): { id: string; role: string; [key: string]: any } | null {
	try {
		const payload = jwt.verify(token, secret);
		if (typeof payload === 'object' && 'id' in payload && 'role' in payload) {
			return payload as { id: string; role: string; [key: string]: any };
		}
		return null;
	} catch (err) {
		return null;
	}
}
