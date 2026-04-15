import 'dotenv/config';

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  PORT: parseInt(process.env.PORT ?? '4000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DATABASE_URL: requireEnv('DATABASE_URL'),
  REDIS_URL: requireEnv('REDIS_URL'),
  RUST_AGGREGATOR_URL: process.env.RUST_AGGREGATOR_URL ?? 'http://localhost:3010',
};
