import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { env } from './config/env';
import { db } from './db';
import { redis } from './cache';
import { metricsRouter } from './routes/metrics';
import { anomaliesRouter } from './routes/anomalies';
import { recommendationsRouter } from './routes/recommendations';

const app = express();
app.use(cors());
app.use(express.json());
app.set('trust proxy', 1);

// Health check
app.get('/health', async (_req, res) => {
  const checks: Record<string, string> = {};
  try { await db.query('SELECT 1'); checks.db = 'connected'; } catch { checks.db = 'error'; }
  try { await redis.ping(); checks.redis = 'connected'; } catch { checks.redis = 'error'; }
  try {
    await axios.get(`${env.RUST_AGGREGATOR_URL}/health`, { timeout: 1000 });
    checks.rust = 'connected';
  } catch { checks.rust = 'unavailable (fallback active)'; }

  const ok = checks.db === 'connected' && checks.redis === 'connected';
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', checks });
});

app.use('/api/metrics', metricsRouter);
app.use('/api/anomalies', anomaliesRouter);
app.use('/api/recommendations', recommendationsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

async function start() {
  await redis.connect().catch(() => {});
  await db.query('SELECT 1');
  console.log('✅ PostgreSQL connected');
  console.log('✅ Redis connected');
  app.listen(env.PORT, () => {
    console.log(`🚀 Analytics backend running on port ${env.PORT}`);
  });
}

start().catch((err) => { console.error('Failed to start:', err); process.exit(1); });
