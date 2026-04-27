import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import SocialAuthButtons from '../components/SocialAuthButtons';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, login, continueWithProvider, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect when authentication is complete (only after form submission)
  useEffect(() => {
    if (isAuthenticated && isSubmitting) {
      console.log('[RegisterPage] User authenticated, navigating to home');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isSubmitting, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register(form);
      await login({ email: form.email, password: form.password });
      // Navigation will happen automatically via useEffect when isAuthenticated becomes true
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  }

  async function handleProvider(provider) {
    continueWithProvider(provider, '/');
  }

  const labelStyle = {
    display: 'block',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: 'var(--muted-foreground)',
    marginBottom: 6,
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '0 auto',
        paddingTop: 'clamp(16px, 3vw, 32px)',
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 'clamp(20px, 3vw, 32px)',
          boxShadow: 'rgba(0,0,0,0.08) 0px 20px 60px, rgba(0,0,0,0.04) 0px 8px 24px',
        }}
      >
        <p className="text-eyebrow" style={{ marginBottom: 8 }}>Join the arena</p>
        <h1
          className="text-section"
          style={{ margin: '0 0 24px', fontSize: '1.75rem', letterSpacing: '-0.5px' }}
        >
          Create your account
        </h1>

        <SocialAuthButtons busy={loading} onSelect={handleProvider} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '14px 0',
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            }}
          >
            Or with email
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Username */}
          <div>
            <label htmlFor="reg-username" style={labelStyle}>Username</label>
            <input
              id="reg-username"
              type="text"
              className="input"
              placeholder="devuser"
              required
              minLength={3}
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm((c) => ({ ...c, username: e.target.value }))}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" style={labelStyle}>Email</label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="Min. 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
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
                  color: 'var(--muted-foreground)',
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
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.75rem',
                color: 'var(--muted-foreground)',
                marginTop: 5,
              }}
            >
              At least 8 characters
            </p>
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                color: 'var(--destructive)',
                background: 'transparent',
                border: '1px solid var(--destructive)',
                borderRadius: 'var(--radius)',
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
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px 16px',
              marginTop: 4,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            color: 'var(--muted-foreground)',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--primary)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
