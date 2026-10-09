import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import routes from './routes/index.js';
import csrfProtection from './middleware/csrf.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use(generalLimiter);

// Pre-authentication endpoints are exempt from the double-submit CSRF check
// (they do not act on cookie-derived identity and are rate limited).
const csrfExempt = [
  '/auth/login',
  '/auth/forgot-password',
  '/auth/set-password',
  '/auth/reset-password',
  '/auth/csrf',
];

app.use('/api', csrfProtection(csrfExempt), routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
