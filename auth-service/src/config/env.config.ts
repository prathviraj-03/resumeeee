import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = Joi.object({
	PORT: Joi.number().default(3000),
	DATABASE_URL: Joi.string().required(),
	REDIS_URL: Joi.string().required(),
	JWT_SECRET: Joi.string().required(),
	JWT_EXPIRES_IN: Joi.string().default('1h'),
	JWT_REFRESH_SECRET: Joi.string().required(),
	JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
}).unknown();

const { value: envVars, error } = envSchema.validate(process.env);

if (error) {
	throw new Error(`Environment validation error: ${error.message}`);
}

export const config = {
	port: envVars.PORT,
	databaseUrl: envVars.DATABASE_URL,
	redisUrl: envVars.REDIS_URL,
	jwt: {
		secret: envVars.JWT_SECRET,
		expiresIn: envVars.JWT_EXPIRES_IN,
		refreshSecret: envVars.JWT_REFRESH_SECRET,
		refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
	},
};
