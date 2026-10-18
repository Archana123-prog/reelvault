import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to Neon DB (PostgreSQL)
await connectDB();

const server = app.listen(PORT, () => {
  console.log(`[Server] ReelVault Backend (Neon DB Postgres) running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`[Server] Health check endpoint: http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]:', err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

// Graceful termination signals
const handleShutdown = (signal) => {
  console.log(`[Server] ${signal} signal received. Closing HTTP server gracefully...`);
  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    await disconnectDB();
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
