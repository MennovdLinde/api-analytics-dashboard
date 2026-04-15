import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../api/client';
import { MetricCard } from '../components/MetricCard';

interface Percentiles { endpoint: string; p50: number; p95: number; p99: number; }

function latencyColor(ms: number) {
  if (ms < 50)  return '#34d399';
  if (ms < 200) return '#fbbf24';
  return '#f87171';
}

export function LatencyPage() {
  const [data, setData] = useState<Percentiles[]>([]);
  const [window, setWindow] = useState<'1h' | '24h' | '7d'>('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/metrics/latency?window=${window}`)
      .then(r => setData(r.data.endpoints ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [window]);

  const avgP95 = data.length ? Math.round(data.reduce((s, e) => s + e.p95, 0) / data.length) : 0;
  const maxP99 = data.length ? Math.max(...data.map(e => e.p99)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>Latency</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>p50 / p95 / p99 percentiles per endpoint</p>
        </div>
        <select value={window} onChange={e => setWindow(e.target.value as typeof window)}
          style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 14 }}>
          <option value="1h">Last 1 hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <MetricCard label="Avg p95 latency" value={loading ? '…' : `${avgP95}ms`} sub="across all endpoints" accent={latencyColor(avgP95)} />
        <MetricCard label="Max p99 latency" value={loading ? '…' : `${maxP99}ms`} sub="worst-case tail latency" accent={latencyColor(maxP99)} />
        <MetricCard label="Target" value="< 100ms" sub="all endpoints goal" accent="#a78bfa" />
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1', marginBottom: 20 }}>Percentile comparison</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barCategoryGap="30%">
            <XAxis dataKey="endpoint" tick={{ fill: '#64748b', fontSize: 13 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} unit="ms" />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} formatter={(v: number) => `${v}ms`} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 13 }} />
            <Bar dataKey="p50" name="p50" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="p95" name="p95" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            <Bar dataKey="p99" name="p99" fill="#f472b6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1', marginBottom: 20 }}>Endpoint detail</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['Endpoint', 'p50', 'p95', 'p99', 'Assessment'].map(h => (
                <th key={h} style={{ padding: '8px 12px', color: '#64748b', textAlign: 'left', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.endpoint} style={{ borderBottom: '1px solid #0f172a' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#e2e8f0' }}>/v1/{row.endpoint}</td>
                <td style={{ padding: '12px', color: latencyColor(row.p50) }}>{row.p50}ms</td>
                <td style={{ padding: '12px', color: latencyColor(row.p95) }}>{row.p95}ms</td>
                <td style={{ padding: '12px', color: latencyColor(row.p99) }}>{row.p99}ms</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    background: row.p95 < 50 ? '#064e3b' : row.p95 < 200 ? '#451a03' : '#450a0a',
                    color: row.p95 < 50 ? '#34d399' : row.p95 < 200 ? '#fbbf24' : '#f87171',
                    borderRadius: 4, padding: '2px 8px', fontSize: 12,
                  }}>
                    {row.p95 < 50 ? '● excellent' : row.p95 < 200 ? '● acceptable' : '● needs attention'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
