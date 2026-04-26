import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Icons (using simple SVG paths)
const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/explore', label: 'Explore', icon: SearchIcon },
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon, protected: true },
  { to: '/profile', label: 'Profile', icon: UserIcon, protected: true },
];

export default function Sidebar() {
  const { isAuthenticated } = useAuth();

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 240,
        background: 'var(--surface-100)',
        borderRight: '1px solid var(--border-primary)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px',
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 24, paddingLeft: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            className="logo-box"
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                fontWeight: 400,
                letterSpacing: '0.16em',
              }}
              className="logo-box"
            >
              DA
            </span>
          </div>
          <div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.0625rem',
                fontWeight: 400,
                letterSpacing: '-0.11px',
                color: 'var(--color-dark)',
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              DevArena
            </p>
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.5625rem',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Competition radar
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {navItems
          .filter((item) => !item.protected || isAuthenticated)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  transition: 'all 150ms ease',
                  background: isActive ? '#26251e' : 'transparent',
                  color: isActive ? '#fef9f0' : 'var(--text-secondary)',
                })}
                className={({ isActive }) => isActive ? 'nav-link-active' : ''}
              >
                <Icon />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </nav>
    </aside>
  );
}
