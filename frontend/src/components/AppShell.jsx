import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/',        label: 'Home' },
  { to: '/explore', label: 'Explore' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/admin',   label: 'Admin' },
  { to: '/profile', label: 'Profile' },
];

export default function AppShell() {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="min-h-dvh"
      style={{ background: 'var(--color-cream)', color: 'var(--color-dark)' }}
    >
      {/* ── Navbar ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(242,241,237,0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-primary)',
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
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--color-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  fontWeight: 400,
                  letterSpacing: '0.18em',
                  color: '#fef9f0',
                  fontFeatureSettings: '"ss09"',
                }}
              >
                DA
              </span>
            </div>
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.125rem',
                  fontWeight: 400,
                  letterSpacing: '-0.11px',
                  color: 'var(--color-dark)',
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                DevArena
              </p>
              <p className="text-eyebrow" style={{ margin: 0, letterSpacing: '0.28em', fontSize: '0.6rem' }}>
                Competition radar
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex"
            style={{ alignItems: 'center', gap: 4 }}
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
                    borderRadius: 9999,
                    textDecoration: 'none',
                    transition: 'background 150ms ease, color 150ms ease',
                    background: isActive ? 'var(--color-dark)' : 'transparent',
                    color: isActive ? '#fef9f0' : 'var(--text-secondary)',
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
          </nav>

          {/* Auth actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isAuthenticated ? (
              <>
                <div className="hidden sm:block" style={{ textAlign: 'right' }}>
                  <p
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--color-dark)',
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
                    color: 'var(--text-secondary)',
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
              borderTop: '1px solid var(--border-primary)',
              background: 'rgba(242,241,237,0.97)',
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
                      borderRadius: 8,
                      textDecoration: 'none',
                      background: isActive ? 'var(--color-dark)' : 'transparent',
                      color: isActive ? '#fef9f0' : 'var(--color-dark)',
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
