import axios from 'axios';
import { db } from '../db';
import { env } from '../config/env';
import type { Window, EndpointSummary, LatencyPercentiles, ThroughputBucket } from '../types';
import { WINDOW_INTERVALS } from '../types';
import { carbonPer1k } from './carbon';

const ENDPOINTS = ['geo', 'currency', 'weather', 'email'];

export async function getSummary(window: Window): Promise<EndpointSummary[]> {
  const interval = WINDOW_INTERVALS[window];
  const result = await db.query(`
    SELECT
      endpoint,
      COUNT(*)                                                              AS calls,
      ROUND(COUNT(*) FILTER (WHERE status_code >= 400)::numeric
            / NULLIF(COUNT(*), 0) * 100, 2)                                AS error_rate_pct,
      ROUND(COUNT(*) FILTER (WHERE cached = true)::numeric
            / NULLIF(COUNT(*), 0) * 100, 2)                                AS cache_hit_rate_pct,
      ROUND(AVG(latency_ms)::numeric, 1)                                   AS avg_latency_ms
    FROM usage_events
    WHERE ts >= ${interval}
    GROUP BY endpoint
    ORDER BY endpoint
  `);

  return result.rows.map((r) => ({
    endpoint: r.endpoint,
    calls: parseInt(r.calls),
    error_rate_pct: parseFloat(r.error_rate_pct ?? '0'),
    cache_hit_rate_pct: parseFloat(r.cache_hit_rate_pct ?? '0'),
    avg_latency_ms: parseFloat(r.avg_latency_ms ?? '0'),
    carbon_mg_per_1k: carbonPer1k(parseFloat(r.avg_latency_ms ?? '0')),
  }));
}

export async function getLatencyPercentiles(window: Window): Promise<LatencyPercentiles[]> {
  const interval = WINDOW_INTERVALS[window];

  // Fetch raw samples grouped by endpoint
  const raw = await db.query(`
    SELECT endpoint, latency_ms
    FROM usage_events
    WHERE ts >= ${interval} AND status_code < 400
    ORDER BY endpoint, latency_ms
  `);

  // Group into arrays per endpoint
  const grouped: Record<string, number[]> = {};
  for (const row of raw.rows) {
    if (!grouped[row.endpoint]) grouped[row.endpoint] = [];
    grouped[row.endpoint].push(parseInt(row.latency_ms));
  }

  const samples = Object.entries(grouped).map(([endpoint, values]) => ({ endpoint, values }));

  // Try Rust aggregator
  try {
    const resp = await axios.post(`${env.RUST_AGGREGATOR_URL}/percentiles`, { samples }, { timeout: 500 });
    return (resp.data as { results: LatencyPercentiles[] }).results;
  } catch {
    // Fallback: pg percentile_cont
    const fallback = await db.query(`
      SELECT
        endpoint,
        percentile_cont(0.50) WITHIN GROUP (ORDER BY latency_ms) AS p50,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95,
        percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms) AS p99
      FROM usage_events
      WHERE ts >= ${interval} AND status_code < 400
      GROUP BY endpoint
    `);
    return fallback.rows.map((r) => ({
      endpoint: r.endpoint,
      p50: Math.round(r.p50 ?? 0),
      p95: Math.round(r.p95 ?? 0),
      p99: Math.round(r.p99 ?? 0),
    }));
  }
}

export async function getThroughput(window: Window): Promise<ThroughputBucket[]> {
  const interval = WINDOW_INTERVALS[window];
  const result = await db.query(`
    SELECT
      date_trunc('hour', ts)                                    AS bucket,
      COUNT(*) FILTER (WHERE endpoint = 'geo')                  AS geo,
      COUNT(*) FILTER (WHERE endpoint = 'currency')             AS currency,
      COUNT(*) FILTER (WHERE endpoint = 'weather')              AS weather,
      COUNT(*) FILTER (WHERE endpoint = 'email')                AS email
    FROM usage_events
    WHERE ts >= ${interval}
    GROUP BY bucket
    ORDER BY bucket
  `);

  return result.rows.map((r) => ({
    bucket: r.bucket,
    geo: parseInt(r.geo ?? '0'),
    currency: parseInt(r.currency ?? '0'),
    weather: parseInt(r.weather ?? '0'),
    email: parseInt(r.email ?? '0'),
  }));
}

export async function getBaselineStats(): Promise<Record<string, {
  avg_latency: number; stddev_latency: number;
  error_rate_pct: number; cache_hit_rate_pct: number;
}>> {
  const result = await db.query(`
    SELECT
      endpoint,
      AVG(latency_ms)                                               AS avg_latency,
      COALESCE(STDDEV(latency_ms), 0)                              AS stddev_latency,
      ROUND(COUNT(*) FILTER (WHERE status_code >= 400)::numeric
            / NULLIF(COUNT(*), 0) * 100, 2)                        AS error_rate_pct,
      ROUND(COUNT(*) FILTER (WHERE cached = true)::numeric
            / NULLIF(COUNT(*), 0) * 100, 2)                        AS cache_hit_rate_pct
    FROM usage_events
    WHERE ts >= NOW() - INTERVAL '7 days'
    GROUP BY endpoint
  `);

  const baseline: Record<string, { avg_latency: number; stddev_latency: number; error_rate_pct: number; cache_hit_rate_pct: number }> = {};
  for (const r of result.rows) {
    baseline[r.endpoint] = {
      avg_latency: parseFloat(r.avg_latency ?? '0'),
      stddev_latency: parseFloat(r.stddev_latency ?? '0'),
      error_rate_pct: parseFloat(r.error_rate_pct ?? '0'),
      cache_hit_rate_pct: parseFloat(r.cache_hit_rate_pct ?? '0'),
    };
  }
  return baseline;
}

export async function getCurrentHourStats(): Promise<Record<string, {
  p95: number; error_rate_pct: number; cache_hit_rate_pct: number; avg_latency: number;
}>> {
  const result = await db.query(`
    SELECT
      endpoint,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)   AS p95,
      AVG(latency_ms)                                             AS avg_latency,
      ROUND(COUNT(*) FILTER (WHERE status_code >= 400)::numeric
            / NULLIF(COUNT(*), 0) * 100, 2)                       AS error_rate_pct,
      ROUND(COUNT(*) FILTER (WHERE cached = true)::numeric
            / NULLIF(COUNT(*), 0) * 100, 2)                       AS cache_hit_rate_pct
    FROM usage_events
    WHERE ts >= NOW() - INTERVAL '1 hour'
    GROUP BY endpoint
  `);

  const current: Record<string, { p95: number; error_rate_pct: number; cache_hit_rate_pct: number; avg_latency: number }> = {};
  for (const r of result.rows) {
    current[r.endpoint] = {
      p95: Math.round(r.p95 ?? 0),
      avg_latency: parseFloat(r.avg_latency ?? '0'),
      error_rate_pct: parseFloat(r.error_rate_pct ?? '0'),
      cache_hit_rate_pct: parseFloat(r.cache_hit_rate_pct ?? '0'),
    };
  }
  return current;
}
