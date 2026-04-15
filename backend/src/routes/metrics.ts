import { Router, Request, Response } from 'express';
import { cached } from '../cache';
import { getSummary, getLatencyPercentiles, getThroughput, getBaselineStats, getCurrentHourStats } from '../services/aggregation';
import { buildCarbonStats } from '../services/carbon';
import type { Window } from '../types';

export const metricsRouter = Router();

function getWindow(req: Request): Window {
  const w = req.query.window as string;
  return (['1h', '24h', '7d'].includes(w) ? w : '24h') as Window;
}

metricsRouter.get('/summary', async (req: Request, res: Response): Promise<void> => {
  const window = getWindow(req);
  const data = await cached(`analytics:summary:${window}`, 30, () => getSummary(window));
  res.json({ endpoints: data, window });
});

metricsRouter.get('/latency', async (req: Request, res: Response): Promise<void> => {
  const window = getWindow(req);
  const data = await cached(`analytics:latency:${window}`, 30, () => getLatencyPercentiles(window));
  res.json({ endpoints: data, window });
});

metricsRouter.get('/throughput', async (req: Request, res: Response): Promise<void> => {
  const window = getWindow(req);
  const data = await cached(`analytics:throughput:${window}`, 60, () => getThroughput(window));
  res.json({ buckets: data, window });
});

metricsRouter.get('/carbon', async (req: Request, res: Response): Promise<void> => {
  const window = getWindow(req);
  const data = await cached(`analytics:carbon:${window}`, 60, async () => {
    const summary = await getSummary(window);
    return buildCarbonStats(summary);
  });
  res.json({ endpoints: data, window });
});
