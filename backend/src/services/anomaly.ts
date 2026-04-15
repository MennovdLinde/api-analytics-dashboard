import type { Anomaly } from '../types';

const ENDPOINTS = ['geo', 'currency', 'weather', 'email'];

type BaselineMap = Record<string, { avg_latency: number; error_rate_pct: number; cache_hit_rate_pct: number }>;
type CurrentMap  = Record<string, { p95: number; error_rate_pct: number; cache_hit_rate_pct: number }>;

export function detectAnomalies(baseline: BaselineMap, current: CurrentMap): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const now = new Date().toISOString();

  for (const ep of ENDPOINTS) {
    const b = baseline[ep];
    const c = current[ep];
    if (!b || !c) continue;

    // 1. Latency spike: current p95 > 2.5x baseline avg AND > 150ms absolute floor
    if (c.p95 > b.avg_latency * 2.5 && c.p95 > 150) {
      anomalies.push({
        endpoint: ep,
        type: 'latency_spike',
        severity: c.p95 > b.avg_latency * 5 ? 'critical' : 'warning',
        message: `p95 latency is ${c.p95}ms (baseline avg: ${Math.round(b.avg_latency)}ms, ${Math.round(c.p95 / b.avg_latency)}x above normal)`,
        detectedAt: now,
      });
    }

    // 2. Error surge: >5% error rate AND >3x baseline
    if (c.error_rate_pct > 5 && c.error_rate_pct > b.error_rate_pct * 3) {
      anomalies.push({
        endpoint: ep,
        type: 'error_surge',
        severity: c.error_rate_pct > 15 ? 'critical' : 'warning',
        message: `Error rate is ${c.error_rate_pct}% (baseline: ${b.error_rate_pct}%)`,
        detectedAt: now,
      });
    }

    // 3. Cache degradation: >20pp drop AND below 50% absolute
    if (c.cache_hit_rate_pct < b.cache_hit_rate_pct - 20 && c.cache_hit_rate_pct < 50) {
      anomalies.push({
        endpoint: ep,
        type: 'cache_degradation',
        severity: c.cache_hit_rate_pct < 20 ? 'critical' : 'warning',
        message: `Cache hit rate dropped to ${c.cache_hit_rate_pct}% (baseline: ${b.cache_hit_rate_pct}%)`,
        detectedAt: now,
      });
    }
  }

  return anomalies;
}
