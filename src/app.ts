import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import { errorHandler, notFound } from './middlewares/error';
import { apiLimiter } from './middlewares/rateLimiter';
import routes from './routes';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // correct client IP behind a reverse proxy (rate limiting)

app.use(helmet());
app.use(
  cors({
    origin: config.clientUrls,
    credentials: true, // allow the httpOnly refresh-token cookie
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips `$` / `.` keys -> blocks NoSQL operator injection
app.use(compression());

if (config.env !== 'test') {
  app.use(morgan(config.isProd ? 'combined' : 'dev'));
}

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'OK', uptime: process.uptime() });
});

app.use('/api/v1', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
