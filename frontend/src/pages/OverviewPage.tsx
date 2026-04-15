import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { api } from '../api/client';

const EP_COLORS = { geo: '#38bdf8', currency: '#34d399', weather: '#fbbf24', email: '#f472b6' };

interface Summary { endpoint: string; calls: number; error_rate_pct: number; cache_hit_rate_pct: number; avg_latency_ms: number; }
interface Bucket { bucket: string; geo: number; currency: number; weather: number; email: number; }
interface Anomaly { endpoint: string; type: string; severity: string; message: string; }

export function OverviewPage() {
  const [summary, setSummary] = useState<Summary[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [window, setWindow] = useState<'1h' | '24h' | '7d'>('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/api/metrics/summary?window=${window}`),
      api.get(`/api/metrics/throughput?window=${window}`),
      api.get('/api/anomalies'),
    ]).then(([s, t, a]) => {
      setSummary(s.data.endpoints ?? []);
      setBuckets(t.data.buckets ?? []);
      setAnomalies(a.data.anomalies ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [window]);

  const totalCalls = summary.reduce((s, e) => s + e.calls, 0);
  const avgError   = summary.length ? (summary.reduce((s, e) => s + e.error_rate_pct, 0) / summary.length).toFixed(1) : '0';
  const avgCache   = summary.length ? (summary.reduce((s, e) => s + e.cache_hit_rate_pct, 0) / summary.length).toFixed(0) : '0';
  const maxLatency = summary.length ? Math.max(...summary.map(e => e.avg_latency_ms)).toFixed(0) : '0';

  const chartData = buckets.map(b => ({ ...b, bucket: new Date(b.bucket).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>Overview</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Real-time API performance analytics</p>
        </div>
        <select value={window} onChange={e => setWindow(e.target.value as typeof window)}
          style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 14 }}>
          <option value="1h">Last 1 hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
        </select>
      </div>

      {anomalies.length > 0 && (
        <div style={{ background: '#7f1d1d', border: '1px solid #991b1b', borderRadius: 8, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fca5a5', fontWeight: 700 }}>⚠ {anomalies.length} active anomaly{anomalies.length > 1 ? 'ies' : ''}</span>
          <span style={{ color: '#fca5a5', fontSize: 14 }}>{anomalies.map(a => `${a.endpoint} (${a.type.replace(/_/g, ' ')})`).join(' · ')}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <MetricCard label="Total calls" value={loading ? '…' : totalCalls.toLocaleString()} sub={`last ${window}`} />
        <MetricCard label="Avg error rate" value={loading ? '…' : `${avgError}%`} sub="across all endpoints" accent={parseFloat(avgError) > 5 ? '#ef4444' : '#34d399'} />
        <MetricCard label="Cache hit rate" value={loading ? '…' : `${avgCache}%`} sub="requests from cache" accent="#fbbf24" />
        <MetricCard label="Max avg latency" value={loading ? '…' : `${maxLatency}ms`} sub="highest endpoint avg" accent="#a78bfa" />
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1', marginBottom: 20 }}>Throughput by endpoint</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barSize={12}>
            <XAxis dataKey="bucket" tick={{ fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} labelStyle={{ color: '#cbd5e1' }} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 13 }} />
            {(['geo', 'currency', 'weather', 'email'] as const).map(ep => (
              <Bar key={ep} dataKey={ep} stackId="a" fill={EP_COLORS[ep]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1', marginBottom: 20 }}>Endpoint breakdown</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['Endpoint', 'Calls', 'Error rate', 'Cache hit rate', 'Avg latency'].map(h => (
                <th key={h} style={{ padding: '8px 12px', color: '#64748b', textAlign: 'left', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.map(row => (
              <tr key={row.endpoint} style={{ borderBottom: '1px solid #0f172a' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#e2e8f0' }}>/v1/{row.endpoint}</td>
                <td style={{ padding: '12px', color: '#94a3b8' }}>{row.calls.toLocaleString()}</td>
                <td style={{ padding: '12px', color: row.error_rate_pct > 5 ? '#f87171' : '#34d399' }}>{row.error_rate_pct}%</td>
                <td style={{ padding: '12px', color: row.cache_hit_rate_pct < 50 ? '#fbbf24' : '#34d399' }}>{row.cache_hit_rate_pct}%</td>
                <td style={{ padding: '12px', color: row.avg_latency_ms > 100 ? '#f87171' : '#94a3b8' }}>{row.avg_latency_ms}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
