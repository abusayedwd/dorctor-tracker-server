import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(5000),
  CLIENT_URL: Joi.string().default('http://localhost:3000'),
  MONGODB_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_MINUTES: Joi.number().positive().default(15),
  JWT_REFRESH_EXPIRES_DAYS: Joi.number().positive().default(7),
  COOKIE_SAMESITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),
  COOKIE_SECURE: Joi.boolean().default(false),
  ADMIN_NAME: Joi.string().default('Admin'),
  ADMIN_EMAIL: Joi.string().email().default('admin@doctortracker.com'),
  ADMIN_PASSWORD: Joi.string().min(8).default('Admin@12345'),
}).unknown();

const { value: env, error } = schema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Invalid environment configuration: ${error.message}`);
}

export const config = {
  env: env.NODE_ENV as 'development' | 'production' | 'test',
  isProd: env.NODE_ENV === 'production',
  port: env.PORT as number,
  clientUrls: (env.CLIENT_URL as string).split(',').map((url) => url.trim()),
  mongoUrl: env.MONGODB_URL as string,
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET as string,
    refreshSecret: env.JWT_REFRESH_SECRET as string,
    accessExpiresMinutes: env.JWT_ACCESS_EXPIRES_MINUTES as number,
    refreshExpiresDays: env.JWT_REFRESH_EXPIRES_DAYS as number,
  },
  cookie: {
    sameSite: env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none',
    secure: env.COOKIE_SECURE as boolean,
  },
  seedAdmin: {
    name: env.ADMIN_NAME as string,
    email: env.ADMIN_EMAIL as string,
    password: env.ADMIN_PASSWORD as string,
  },
} as const;
