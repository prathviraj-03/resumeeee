import { Router } from 'express';
import {
	registerController,
	loginController,
	refreshController,
	logoutController,
	meController,
	forgotPasswordController,
	resetPasswordController,
} from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
// If needed, import AuthPayload and AuthenticatedRequest types here
import { loginLimiter, passwordResetLimiter } from '../../middleware/rateLimiter.middleware';
import { errorHandler } from '../../middleware/error.middleware';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginLimiter, loginController);
router.post('/refresh', refreshController);
// Cast authenticate and controllers to RequestHandler to resolve type mismatch
import { RequestHandler } from 'express';

router.post('/logout', authenticate as RequestHandler, logoutController as RequestHandler);
router.get('/me', authenticate as RequestHandler, meController as RequestHandler);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordController);
router.post('/reset-password', resetPasswordController);

router.use(errorHandler);

export default router;
