import { Router, Request, Response } from 'express';
import { cached } from '../cache';
import { getBaselineStats, getCurrentHourStats } from '../services/aggregation';
import { detectAnomalies } from '../services/anomaly';

export const anomaliesRouter = Router();

anomaliesRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  const data = await cached('analytics:anomalies', 60, async () => {
    const [baseline, current] = await Promise.all([getBaselineStats(), getCurrentHourStats()]);
    return detectAnomalies(baseline, current);
  });
  res.json({ anomalies: data, evaluatedAt: new Date().toISOString() });
});
