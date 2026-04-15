import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Recommendation { endpoint: string; rule: string; title: string; detail: string; impact: 'high' | 'medium' | 'low'; }

const IMPACT_STYLE: Record<string, { bg: string; color: string }> = {
  high:   { bg: '#450a0a', color: '#f87171' },
  medium: { bg: '#451a03', color: '#fbbf24' },
  low:    { bg: '#1e293b', color: '#64748b' },
};

export function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/recommendations')
      .then(r => setRecs(r.data.recommendations ?? []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>Recommendations</h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>Rule-based optimization suggestions based on last 24h data</p>
      </div>

      {!loading && recs.length === 0 && (
        <div style={{ background: '#064e3b', border: '1px solid #059669', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 20, color: '#34d399', fontWeight: 700 }}>✓ No optimization opportunities detected</p>
          <p style={{ color: '#6ee7b7', marginTop: 8, fontSize: 14 }}>Cache hit rates, latency, and error rates are all within healthy thresholds.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {recs.map((rec, i) => (
          <div key={i} style={{ background: '#1e293b', borderRadius: 12, padding: 24, borderLeft: `4px solid ${IMPACT_STYLE[rec.impact].color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{rec.title}</span>
                <code style={{ fontSize: 12, background: '#0f172a', color: '#38bdf8', padding: '2px 8px', borderRadius: 4 }}>/v1/{rec.endpoint}</code>
              </div>
              <span style={{
                background: IMPACT_STYLE[rec.impact].bg,
                color: IMPACT_STYLE[rec.impact].color,
                borderRadius: 4, padding: '3px 10px', fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>
                {rec.impact.toUpperCase()} IMPACT
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{rec.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
