import { Pool } from 'pg';
import { env } from '../config/env';

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5, // read-only — smaller pool than the gateway
});

db.on('error', (err) => console.error('PostgreSQL pool error:', err));
