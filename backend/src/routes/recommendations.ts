import { Router, Request, Response } from 'express';
import { cached } from '../cache';
import { getSummary } from '../services/aggregation';
import { buildRecommendations } from '../services/recommendations';

export const recommendationsRouter = Router();

recommendationsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  const data = await cached('analytics:recommendations', 120, async () => {
    const summary = await getSummary('24h');
    return buildRecommendations(summary);
  });
  res.json({ recommendations: data, evaluatedAt: new Date().toISOString() });
});
