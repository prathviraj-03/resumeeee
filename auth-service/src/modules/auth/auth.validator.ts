import Joi from 'joi';

export const registerSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string()
		.min(8)
		.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
		.required(),
}).options({ stripUnknown: true });

export const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
}).options({ stripUnknown: true });

export const refreshTokenSchema = Joi.object({
	refreshToken: Joi.string().required(),
}).options({ stripUnknown: true });

export const forgotPasswordSchema = Joi.object({
	email: Joi.string().email().required(),
}).options({ stripUnknown: true });

export const resetPasswordSchema = Joi.object({
	token: Joi.string().required(),
	password: Joi.string()
		.min(8)
		.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
		.required(),
}).options({ stripUnknown: true });
