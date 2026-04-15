export type Window = '1h' | '24h' | '7d';

export const WINDOW_INTERVALS: Record<Window, string> = {
  '1h':  'NOW() - INTERVAL \'1 hour\'',
  '24h': 'NOW() - INTERVAL \'24 hours\'',
  '7d':  'NOW() - INTERVAL \'7 days\'',
};

export interface EndpointSummary {
  endpoint: string;
  calls: number;
  error_rate_pct: number;
  cache_hit_rate_pct: number;
  avg_latency_ms: number;
  carbon_mg_per_1k: number;
}

export interface LatencyPercentiles {
  endpoint: string;
  p50: number;
  p95: number;
  p99: number;
}

export interface ThroughputBucket {
  bucket: string;
  geo: number;
  currency: number;
  weather: number;
  email: number;
}

export interface CarbonStat {
  endpoint: string;
  carbon_mg_per_1k: number;
  cached_carbon_mg_per_1k: number;
  savings_pct: number;
}

export interface Anomaly {
  endpoint: string;
  type: 'latency_spike' | 'error_surge' | 'cache_degradation';
  severity: 'warning' | 'critical';
  message: string;
  detectedAt: string;
}

export interface Recommendation {
  endpoint: string;
  rule: string;
  title: string;
  detail: string;
  impact: 'high' | 'medium' | 'low';
}
