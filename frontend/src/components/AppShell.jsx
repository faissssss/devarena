import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logoDark from '../assets/dev-arena-logos/dev-arena-logo-dark.png';
import logoLight from '../assets/dev-arena-logos/dev-arena-logo-light.png';

const navItems = [
  { to: '/',        label: 'Home' },
  { to: '/explore', label: 'Explore' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/admin',   label: 'Admin' },
  { to: '/profile', label: 'Profile' },
];

export default function AppShell() {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Logo selection based on theme: 
  // 'dark' resolvedTheme means the UI is dark, so we use the light logo.
  // 'light' resolvedTheme means the UI is light, so we use the dark logo.
  const logoSrc = resolvedTheme === 'dark' ? logoLight : logoDark;

  const toggleTheme = () => {
    setTheme((current) => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'system';
      return 'light';
    });
  };

  const getThemeIcon = () => {
    if (theme === 'light') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      );
    }
    if (theme === 'dark') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      );
    }
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  };

  return (
    <div
      className="min-h-dvh"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      {/* ── Navbar ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'var(--background)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 24px',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* Logo */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <Link
              to="/landing"
              style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
            >
              <img 
                src={logoSrc} 
                alt="DevArena" 
                style={{ 
                  height: 32, 
                  width: 'auto',
                  objectFit: 'contain'
                }} 
              />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 400,
                color: 'var(--foreground)',
                letterSpacing: '-0.02em'
              }}>
                DevArena
              </span>
            </Link>
          </div>

          {/* Desktop nav - Centered */}
          <nav
            className="hidden md:flex"
            style={{ alignItems: 'center', gap: 4, flex: 'none' }}
            aria-label="Main navigation"
          >
            {navItems
              .filter((item) => item.label !== 'Admin' || isAdmin)
              .filter((item) => item.label !== 'Dashboard' && item.label !== 'Profile' || isAuthenticated)
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  style={({ isActive }) => ({
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    padding: '5px 12px',
                    borderRadius: 'var(--radius)',
                    textDecoration: 'none',
                    transition: 'background 150ms ease, color 150ms ease',
                    background: isActive ? 'var(--secondary)' : 'transparent',
                    color: isActive ? 'var(--secondary-foreground)' : 'var(--muted-foreground)',
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
          </nav>

          {/* Auth actions */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-ghost"
              style={{ 
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={`Theme: ${theme}`}
              aria-label="Toggle theme"
            >
              {getThemeIcon()}
            </button>

            {isAuthenticated ? (
              <>
                <div className="hidden sm:block" style={{ textAlign: 'right' }}>
                  <p
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--foreground)',
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {user?.username}
                  </p>
                  <p className="text-eyebrow" style={{ margin: 0, fontSize: '0.6rem' }}>
                    {user?.role}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                  aria-label="Logout"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: 'var(--muted-foreground)',
                    padding: '5px 10px',
                    textDecoration: 'none',
                    transition: 'color 150ms ease',
                  }}
                >
                  Login
                </Link>
                <Link to="/register" className="btn btn-dark" style={{ fontSize: '0.75rem', padding: '7px 14px' }}>
                  Sign up
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden btn btn-ghost"
              style={{ padding: '6px 8px', fontSize: '1rem' }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              background: 'var(--background)',
              padding: '12px 24px 16px',
            }}
          >
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }} aria-label="Mobile navigation">
              {navItems
                .filter((item) => item.label !== 'Admin' || isAdmin)
                .filter((item) => item.label !== 'Dashboard' && item.label !== 'Profile' || isAuthenticated)
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    style={({ isActive }) => ({
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius)',
                      textDecoration: 'none',
                      background: isActive ? 'var(--secondary)' : 'transparent',
                      color: isActive ? 'var(--secondary-foreground)' : 'var(--foreground)',
                    })}
                  >
                    {item.label}
                  </NavLink>
                ))}
            </nav>
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '40px 24px 80px',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
