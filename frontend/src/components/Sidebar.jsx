import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logoDark from '../assets/dev-arena-logos/dev-arena-logo-dark.png';
import logoLight from '../assets/dev-arena-logos/dev-arena-logo-light.png';

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
  const { isAuthenticated, logout, user } = useAuth();
  const { resolvedTheme } = useTheme();

  const logoSrc = resolvedTheme === 'dark' ? logoLight : logoDark;

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 240,
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px',
        zIndex: 50,
      }}
    >
      {/* Back to Landing Page */}
      <div style={{ marginBottom: 20, paddingLeft: 6 }}>
        <NavLink 
          to="/landing" 
          style={{ 
            fontSize: '0.6875rem', 
            color: 'var(--muted-foreground)', 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: 'var(--font-ui)',
            fontWeight: 500,
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Landing Page
        </NavLink>
      </div>

      {/* Logo */}
      <div style={{ marginBottom: 24, paddingLeft: 6 }}>
        <Link 
          to="/landing"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            textDecoration: 'none'
          }}
        >
          <img 
            src={logoSrc} 
            alt="DevArena" 
            style={{ 
              height: 28, 
              width: 'auto',
              objectFit: 'contain'
            }} 
          />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--foreground)',
            letterSpacing: '-0.02em'
          }}>
            DevArena
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
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
                  borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  transition: 'all 150ms ease',
                  background: 'transparent',
                  color: 'var(--sidebar-foreground)',
                })}
                className={({ isActive }) => isActive ? 'nav-link-active' : ''}
              >
                <Icon />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      {/* Bottom actions - User info and logout */}
      {isAuthenticated && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 8, 
          paddingTop: 12,
          borderTop: '1px solid var(--sidebar-border)',
          marginTop: 'auto'
        }}>
          <div style={{ padding: '8px 14px' }}>
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--sidebar-foreground)',
                margin: '0 0 2px',
                lineHeight: 1.3,
              }}
            >
              {user?.username}
            </p>
            <p 
              className="text-eyebrow" 
              style={{ 
                margin: 0, 
                fontSize: '0.625rem',
                color: 'var(--muted-foreground)'
              }}
            >
              {user?.role}
            </p>
          </div>
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              fontWeight: 500,
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--sidebar-foreground)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
