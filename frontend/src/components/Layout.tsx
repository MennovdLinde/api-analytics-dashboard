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
      <aside style={{
        width: 220,
        background: 'var(--sidebar-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderRight: '1px solid var(--sidebar-border)',
        padding: '32px 0',
        display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{
          padding: '0 24px 24px',
          fontSize: 15, fontWeight: 700,
          color: 'var(--accent)',
          letterSpacing: '-0.3px',
          borderBottom: '1px solid var(--sidebar-border)',
          marginBottom: 8,
        }}>
          📊 API Analytics
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 0' }}>
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              padding: '10px 24px',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              textDecoration: 'none',
              borderRadius: 8,
              margin: '0 8px',
              transition: 'background 0.15s, color 0.15s',
              color: isActive ? 'var(--text)' : 'var(--muted)',
              background: isActive ? 'var(--glass-bg)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            })}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main style={{
        flex: 1, padding: 40, overflowY: 'auto',
        color: 'var(--text)',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
