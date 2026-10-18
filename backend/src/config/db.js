import mongoose from 'mongoose';

let memoryServer = null;

/**
 * Connect to MongoDB with retry logic and graceful fallback for local development.
 */
export const connectDB = async (retries = 5, delayMs = 3000) => {
  const uri = process.env.MONGODB_URI;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (uri && uri !== 'memory') {
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`[Database] MongoDB Connected to host: ${conn.connection.host}`);
        return conn;
      }
    } catch (err) {
      console.error(`[Database] Connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) {
        console.log(`[Database] Retrying connection in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // If connection failed or URI is 'memory' or local dev, fallback to in-memory MongoDB in dev
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('[Database] Starting in-memory MongoDB fallback for local development/testing...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[Database] In-memory MongoDB Connected successfully at: ${memUri}`);
      return conn;
    } catch (memErr) {
      console.error(`[Database] In-memory MongoDB failed to start: ${memErr.message}`);
    }
  }

  console.error('[Database] Could not connect to any MongoDB instance. Exiting...');
  process.exit(1);
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('[Database] MongoDB connection closed.');
  } catch (err) {
    console.error(`[Database] Error disconnecting: ${err.message}`);
  }
};
