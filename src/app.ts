import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import { connectDB } from './config/db';
import { errorHandler, notFound } from './middlewares/error';
import { apiLimiter } from './middlewares/rateLimiter';
import routes from './routes';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: config.clientUrls,
    credentials: true,
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(compression());

if (config.env !== 'test') {
  app.use(morgan(config.isProd ? 'combined' : 'dev'));
}

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'OK', uptime: process.uptime() });
});

// Ensure DB is connected on every request (important for Vercel serverless).
app.use((_req, _res, next) => {
  connectDB().then(() => next()).catch(next);
});

app.use('/api/v1', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;

export default app;
