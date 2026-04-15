import { Outlet, NavLink } from 'react-router-dom';

const links = [
  { to: '/overview',        label: 'Overview' },
  { to: '/latency',         label: 'Latency' },
  { to: '/carbon',          label: 'Carbon' },
  { to: '/anomalies',       label: 'Anomalies' },
  { to: '/recommendations', label: 'Recommendations' },
];

export function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, background: '#1e293b', padding: '32px 0', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <div style={{ padding: '0 24px 24px', fontSize: 15, fontWeight: 700, color: '#38bdf8', letterSpacing: '-0.3px' }}>
          📊 API Analytics
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              padding: '10px 24px', fontSize: 14, textDecoration: 'none', borderRadius: 6,
              margin: '0 8px', transition: 'background 0.15s, color 0.15s',
              color: isActive ? '#e2e8f0' : '#94a3b8',
              background: isActive ? '#0f172a' : 'transparent',
            })}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
