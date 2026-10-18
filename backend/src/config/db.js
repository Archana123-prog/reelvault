import pg from 'pg';
import crypto from 'node:crypto';

const { Pool } = pg;

let pool = null;

/**
 * Retrieves the database connection string from environment variables.
 * Supports DATABASE_URL (standard for Neon DB), NEON_DATABASE_URL, POSTGRES_URL, PG_URI,
 * or even MONGODB_URI if the user pasted their PostgreSQL connection string there.
 */
export const getConnectionString = () => {
  const envUrl =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.PG_URI ||
    process.env.MONGODB_URI;

  if (!envUrl) return null;
  const trimmed = envUrl.trim();

  // Validate that it's a PostgreSQL connection string
  if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://')) {
    return trimmed;
  }
  return null;
};

/**
 * Returns the singleton pg.Pool configured with SSL for Neon DB.
 */
export const getPool = () => {
  if (pool) return pool;

  const connectionString = getConnectionString();
  if (!connectionString) {
    return null;
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000
  });

  pool.on('error', (err) => {
    console.error('[Neon DB Pool Error]:', err.message);
  });

  return pool;
};

/**
 * Executes a parameterized SQL query on the Neon DB pool.
 */
export const query = async (text, params) => {
  const activePool = getPool();
  if (!activePool) {
    throw new Error(
      'Neon DB connection not configured. Please paste your Neon PostgreSQL connection string into backend/.env as DATABASE_URL=postgresql://...'
    );
  }
  return activePool.query(text, params);
};

/**
 * Automatically creates all required tables and indexes in Neon DB on startup.
 */
export const initTables = async () => {
  console.log('[Neon DB] Checking and initializing database tables...');

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      icon VARCHAR(50) DEFAULT '📌',
      color VARCHAR(50) DEFAULT '#6366F1',
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_user_category_name UNIQUE (user_id, name)
    );

    CREATE TABLE IF NOT EXISTS reels (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      url TEXT NOT NULL,
      platform VARCHAR(50) DEFAULT 'other',
      title TEXT DEFAULT '',
      note TEXT DEFAULT '',
      tags JSONB DEFAULT '[]'::jsonb,
      thumbnail TEXT DEFAULT NULL,
      is_favorite BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_user_reel_url UNIQUE (user_id, url)
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
    CREATE INDEX IF NOT EXISTS idx_reels_user ON reels(user_id);
    CREATE INDEX IF NOT EXISTS idx_reels_category ON reels(category_id);
    CREATE INDEX IF NOT EXISTS idx_reels_user_fav ON reels(user_id, is_favorite);
    CREATE INDEX IF NOT EXISTS idx_reels_user_platform ON reels(user_id, platform);
  `);

  console.log('[Neon DB] ✅ Tables (users, categories, reels) and indexes verified successfully!');
};

/**
 * Connects to Neon DB with retry logic.
 */
export const connectDB = async (retries = 3, delayMs = 2000) => {
  const connectionString = getConnectionString();

  if (!connectionString) {
    console.warn('\n============================================================');
    console.warn('⚠️  NEON DB NOT CONFIGURED YET');
    console.warn('👉 Please paste your Neon DB connection string into backend/.env:');
    console.warn('   DATABASE_URL=postgresql://user:password@ep-...neon.tech/neondb?sslmode=require');
    console.warn('   Once saved, nodemon will automatically connect and create tables!');
    console.warn('============================================================\n');
    return null;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const activePool = getPool();
      const res = await activePool.query('SELECT NOW()');
      console.log(`[Neon DB] ✅ Connected successfully at ${res.rows[0].now}`);
      await initTables();
      return activePool;
    } catch (err) {
      console.error(`[Neon DB] Connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) {
        console.log(`[Neon DB] Retrying in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error('[Neon DB] Could not connect. Please check your DATABASE_URL in backend/.env.');
};

/**
 * Closes the Neon DB connection pool gracefully.
 */
export const disconnectDB = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[Neon DB] Connection pool closed.');
  }
};
