import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';


import authRoutes from './routes/auth.routes.js';
import reelRoutes from './routes/reel.routes.js';
import categoryRoutes from './routes/category.routes.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { isDbConnected, dbDetails } from './config/db.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS with allowed origins
const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Permissive origin check:
      // 1. Matches configured CLIENT_URL
      // 2. Wildcard '*'
      // 3. Any Vercel deployment (*.vercel.app)
      // 4. Localhost during development
      const isAllowed =
        configuredOrigins.includes('*') ||
        configuredOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:');

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Allowed fallback for origin: ${origin}`);
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Compression for responses
app.use(compression());

// Body parser with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parameterized SQL queries natively sanitize all input against injection

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint for Render and uptime pings
app.get('/api/health', (req, res) => {
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ok' : 'degraded',
    database: isDbConnected ? 'connected' : 'disconnected',
    databaseHost: dbDetails?.host || null,
    databaseName: dbDetails?.database || null,
    error: dbDetails?.error || null,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Apply rate limiter to /api routes
app.use('/api', apiLimiter);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/categories', categoryRoutes);

// Catch 404 and forward to error handler
app.use(notFound);

// Centralized error handling middleware
app.use(errorHandler);

export default app;
