import type { CarbonStat } from '../types';

// Energy model:
// ENERGY_PER_MS = 0.0003 mWh per ms (conservative single-core estimate)
// CARBON_INTENSITY = 400 g CO2/kWh (European average grid)
// carbon_mg_per_call = latency_ms * 0.0003 * (1/1_000_000) * 400 * 1_000_000
//                    = latency_ms * 0.00012 mg CO2

const CARBON_PER_MS = 0.00012; // mg CO2 per ms of latency
const CACHE_MULTIPLIER = 0.05;  // cache hit = ~5% of compute vs full upstream call

export function carbonPer1k(avgLatencyMs: number, isCached = false): number {
  const base = avgLatencyMs * CARBON_PER_MS * 1000;
  return parseFloat((isCached ? base * CACHE_MULTIPLIER : base).toFixed(4));
}

export function buildCarbonStats(summary: Array<{
  endpoint: string;
  avg_latency_ms: number;
  cache_hit_rate_pct: number;
}>): CarbonStat[] {
  return summary.map((s) => {
    const uncached = carbonPer1k(s.avg_latency_ms, false);
    const cached   = carbonPer1k(s.avg_latency_ms, true);
    const blended  = uncached * (1 - s.cache_hit_rate_pct / 100)
                   + cached   * (s.cache_hit_rate_pct / 100);
    const savings  = uncached > 0
      ? parseFloat(((1 - blended / uncached) * 100).toFixed(1))
      : 0;

    return {
      endpoint: s.endpoint,
      carbon_mg_per_1k: parseFloat(blended.toFixed(4)),
      cached_carbon_mg_per_1k: cached,
      savings_pct: savings,
    };
  });
}
