import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '0 auto',
        paddingTop: 'clamp(24px, 4vw, 48px)',
      }}
    >
      <div
        style={{
          background: 'var(--surface-100)',
          border: '1px solid var(--border-primary)',
          borderRadius: 16,
          padding: 'clamp(28px, 4vw, 44px)',
          boxShadow: 'rgba(0,0,0,0.08) 0px 20px 60px, rgba(0,0,0,0.04) 0px 8px 24px',
        }}
      >
        <p className="text-eyebrow" style={{ marginBottom: 10 }}>Welcome back</p>
        <h1
          className="text-section"
          style={{ margin: '0 0 32px', fontSize: '2rem', letterSpacing: '-0.5px' }}
        >
          Login
        </h1>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              style={{
                display: 'block',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className="input"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              style={{
                display: 'block',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                color: 'var(--color-error)',
                background: 'rgba(207,45,86,0.08)',
                border: '1px solid rgba(207,45,86,0.20)',
                borderRadius: 8,
                padding: '8px 12px',
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-dark"
            style={{
              width: '100%',
              padding: '12px 16px',
              marginTop: 4,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginTop: 20,
            textAlign: 'center',
          }}
        >
          Need an account?{' '}
          <Link
            to="/register"
            style={{
              color: 'var(--color-accent)',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'color 150ms ease',
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
