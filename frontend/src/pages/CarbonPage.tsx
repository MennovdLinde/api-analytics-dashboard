import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { api } from '../api/client';

interface CarbonStat { endpoint: string; carbon_mg_per_1k: number; cached_carbon_mg_per_1k: number; savings_pct: number; }

export function CarbonPage() {
  const [data, setData] = useState<CarbonStat[]>([]);
  const [window, setWindow] = useState<'1h' | '24h' | '7d'>('24h');
  const [loading, setLoading] = useState(true);
  const [showFormula, setShowFormula] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/metrics/carbon?window=${window}`)
      .then(r => setData(r.data.endpoints ?? []))
      .catch(() => {}).finally(() => setLoading(false));
  }, [window]);

  const totalSavings = data.length ? (data.reduce((s, e) => s + e.savings_pct, 0) / data.length).toFixed(1) : '0';
  const lowestCarbon = data.length ? data.reduce((a, b) => a.carbon_mg_per_1k < b.carbon_mg_per_1k ? a : b) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>Carbon Cost</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Estimated CO₂ per 1,000 API calls</p>
        </div>
        <select value={window} onChange={e => setWindow(e.target.value as typeof window)}
          style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 14 }}>
          <option value="1h">Last 1 hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <MetricCard label="Avg cache savings" value={loading ? '…' : `${totalSavings}%`} sub="carbon reduced by caching" accent="#34d399" />
        <MetricCard label="Greenest endpoint" value={loading || !lowestCarbon ? '…' : lowestCarbon.endpoint} sub={lowestCarbon ? `${lowestCarbon.carbon_mg_per_1k} mg/1k calls` : ''} accent="#38bdf8" />
        <MetricCard label="Grid intensity" value="400 g/kWh" sub="European avg (conservative)" accent="#a78bfa" />
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1', marginBottom: 20 }}>Carbon cost per 1,000 calls (mg CO₂)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barCategoryGap="30%">
            <XAxis dataKey="endpoint" tick={{ fill: '#64748b', fontSize: 13 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} unit=" mg" />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} formatter={(v: number) => `${v} mg CO₂`} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 13 }} />
            <Bar dataKey="cached_carbon_mg_per_1k" name="Cached calls" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="carbon_mg_per_1k" name="Blended (cache + miss)" fill="#fbbf24" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Formula explainer */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 24 }}>
        <button onClick={() => setShowFormula(v => !v)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          {showFormula ? '▼' : '▶'} How is carbon cost calculated?
        </button>
        {showFormula && (
          <div style={{ marginTop: 16, fontSize: 14, color: '#94a3b8', lineHeight: 1.8 }}>
            <p><strong style={{ color: '#e2e8f0' }}>Formula:</strong> carbon_mg = latency_ms × 0.00012</p>
            <p style={{ marginTop: 8 }}>Derived from:</p>
            <ul style={{ paddingLeft: 20, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Energy per ms: 0.0003 mWh (conservative single-core estimate)</li>
              <li>Grid carbon intensity: 400 g CO₂/kWh (European average, ENTSO-E)</li>
              <li>Switzerland's actual grid is ~100 g/kWh (hydro-heavy) — this is a conservative worst-case</li>
              <li>Cache hit multiplier: 0.05× (cache read ≈ 5% of full upstream compute)</li>
            </ul>
            <p style={{ marginTop: 8, color: '#64748b' }}>Latency is used as a proxy for CPU time. Longer latency = more clock cycles = more joules consumed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
