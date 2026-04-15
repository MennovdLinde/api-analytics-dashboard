import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Anomaly { endpoint: string; type: string; severity: 'warning' | 'critical'; message: string; detectedAt: string; }

const TYPE_LABELS: Record<string, string> = {
  latency_spike: 'Latency spike',
  error_surge: 'Error surge',
  cache_degradation: 'Cache degradation',
};

export function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState('');

  function fetchAnomalies() {
    api.get('/api/anomalies')
      .then(r => { setAnomalies(r.data.anomalies ?? []); setLastChecked(new Date().toLocaleTimeString()); })
      .catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchAnomalies();
    const id = setInterval(fetchAnomalies, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>Anomalies</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Auto-refreshes every 30s · Last checked: {lastChecked || '…'}</p>
        </div>
        <button onClick={fetchAnomalies} style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 6, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>
          Refresh now
        </button>
      </div>

      {!loading && anomalies.length === 0 && (
        <div style={{ background: '#064e3b', border: '1px solid #059669', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 20, color: '#34d399', fontWeight: 700 }}>✓ All systems nominal</p>
          <p style={{ color: '#6ee7b7', marginTop: 8, fontSize: 14 }}>No latency spikes, error surges, or cache degradation detected in the last hour.</p>
        </div>
      )}

      {anomalies.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['Endpoint', 'Type', 'Severity', 'Message', 'Detected'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', color: '#64748b', textAlign: 'left', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {anomalies.map((a, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #0f172a' }}>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#e2e8f0' }}>/v1/{a.endpoint}</td>
                  <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{TYPE_LABELS[a.type] ?? a.type}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      background: a.severity === 'critical' ? '#450a0a' : '#451a03',
                      color: a.severity === 'critical' ? '#f87171' : '#fbbf24',
                      borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600,
                    }}>
                      {a.severity.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#94a3b8', maxWidth: 400 }}>{a.message}</td>
                  <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 12 }}>
                    {new Date(a.detectedAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detection rules info */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>Detection rules</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#64748b' }}>
          <p><span style={{ color: '#38bdf8' }}>Latency spike</span> — p95 {'>'} 2.5× 7-day baseline average AND {'>'} 150ms absolute floor</p>
          <p><span style={{ color: '#fbbf24' }}>Error surge</span> — error rate {'>'} 5% AND {'>'} 3× 7-day baseline rate</p>
          <p><span style={{ color: '#f472b6' }}>Cache degradation</span> — hit rate drops 20+ percentage points below baseline AND below 50% absolute</p>
        </div>
      </div>
    </div>
  );
}
