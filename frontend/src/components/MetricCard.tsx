interface Props { label: string; value: string | number; sub?: string; accent?: string; }
export function MetricCard({ label, value, sub, accent = '#38bdf8' }: Props) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 700, color: accent }}>{value}</span>
      {sub && <span style={{ fontSize: 13, color: '#475569' }}>{sub}</span>}
    </div>
  );
}
