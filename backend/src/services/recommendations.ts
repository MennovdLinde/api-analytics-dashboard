import type { Recommendation } from '../types';

const CACHE_STABLE_ENDPOINTS = ['geo', 'currency'];

type Stats = {
  endpoint: string;
  avg_latency_ms: number;
  cache_hit_rate_pct: number;
  error_rate_pct: number;
  calls: number;
};

export function buildRecommendations(stats: Stats[]): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const s of stats) {
    // Rule 1: Cache TTL too low for stable endpoints
    if (CACHE_STABLE_ENDPOINTS.includes(s.endpoint) && s.cache_hit_rate_pct < 60) {
      recs.push({
        endpoint: s.endpoint,
        rule: 'cache_ttl_low',
        title: 'Raise cache TTL',
        detail: `${s.endpoint} cache hit rate is ${s.cache_hit_rate_pct}%. These responses are highly stable — increase Redis TTL from current setting to 30+ minutes to reduce upstream calls and carbon cost.`,
        impact: 'high',
      });
    }

    // Rule 2: Cache nearly bypassed entirely
    else if (s.cache_hit_rate_pct < 30 && s.calls > 50) {
      recs.push({
        endpoint: s.endpoint,
        rule: 'cache_bypass',
        title: 'Cache bypass suspected',
        detail: `${s.endpoint} cache hit rate is only ${s.cache_hit_rate_pct}%. Verify the caching middleware is correctly calling redis.set after every upstream fetch.`,
        impact: 'high',
      });
    }

    // Rule 3: High uncached latency — candidate for edge caching
    if (s.avg_latency_ms > 200 && s.cache_hit_rate_pct < 70) {
      recs.push({
        endpoint: s.endpoint,
        rule: 'high_latency_uncached',
        title: 'Consider edge caching',
        detail: `${s.endpoint} averages ${Math.round(s.avg_latency_ms)}ms on cache misses. As a read-only endpoint, it is a strong candidate for Cloudflare Workers or CDN-level caching to serve responses in <10ms globally.`,
        impact: 'medium',
      });
    }

    // Rule 4: High client error rate
    if (s.error_rate_pct > 10) {
      recs.push({
        endpoint: s.endpoint,
        rule: 'error_spike_4xx',
        title: 'Add stricter input validation',
        detail: `${s.endpoint} has a ${s.error_rate_pct}% error rate. Moving schema validation to the middleware layer will reject malformed requests before they hit upstream providers, reducing wasted compute.`,
        impact: 'medium',
      });
    }

    // Rule 5: Low volume email endpoint — suggest batching
    if (s.endpoint === 'email' && s.calls < 100) {
      recs.push({
        endpoint: s.endpoint,
        rule: 'low_volume_overhead',
        title: 'Batch email validation calls',
        detail: `The email endpoint has low volume (${s.calls} calls in the selected window). If callers are validating one address at a time, batching into a single multi-address call would reduce per-call HTTP overhead by up to 80%.`,
        impact: 'low',
      });
    }
  }

  // Sort by impact: high → medium → low
  const order = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => order[a.impact] - order[b.impact]);
}
