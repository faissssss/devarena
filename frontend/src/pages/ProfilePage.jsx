import { useEffect, useState } from 'react';

import SectionHeading from '../components/SectionHeading';
import { useAuth } from '../context/AuthContext';
import { unwrapError, userApi } from '../services/api';

const labelStyle = {
  display: 'block',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 6,
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState({ bookmarkCount: 0 });
  const [profileForm, setProfileForm] = useState({ username: user?.username || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    userApi
      .getMe()
      .then((res) => {
        setStats(res.stats || { bookmarkCount: 0 });
        setProfileForm({ username: res.user?.username || '', email: res.user?.email || '' });
      })
      .catch(() => {});
  }, []);

  async function updateProfile(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await userApi.updateMe(profileForm);
      await refreshUser();
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(unwrapError(err, 'Unable to update profile'));
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await userApi.updateMe(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setMessage('Password updated successfully.');
    } catch (err) {
      setError(unwrapError(err, 'Unable to update password'));
    }
  }

  const roleColor = user?.role === 'admin' ? 'var(--color-accent)' : '#1f8a65';
  const roleBg    = user?.role === 'admin' ? 'rgba(245,78,0,0.10)' : 'rgba(31,138,101,0.10)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SectionHeading
        eyebrow="Profile"
        title="Account details and control."
        body="Update your core account settings, review your role, and keep your password fresh."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20, alignItems: 'start' }}>

        {/* Account summary */}
        <aside
          style={{
            background: 'var(--surface-100)',
            border: '1px solid var(--border-primary)',
            borderRadius: 12,
            padding: '24px 24px',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: 'var(--color-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 400,
                color: '#fef9f0',
                letterSpacing: '-0.08px',
              }}
            >
              {(user?.username || 'U')[0].toUpperCase()}
            </span>
          </div>

          <p className="text-eyebrow" style={{ marginBottom: 6 }}>Account summary</p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.375rem',
              fontWeight: 400,
              letterSpacing: '-0.11px',
              color: 'var(--color-dark)',
              margin: '0 0 4px',
            }}
          >
            {user?.username}
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              margin: '0 0 16px',
            }}
          >
            {user?.email}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Role
              </span>
              <span
                style={{
                  background: roleBg,
                  color: roleColor,
                  padding: '2px 8px',
                  borderRadius: 9999,
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                {user?.role}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Bookmarks
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 400,
                  color: 'var(--color-dark)',
                }}
              >
                {stats.bookmarkCount}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Member since
              </span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--color-dark)', fontWeight: 500 }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
        </aside>

        {/* Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Feedback */}
          {message && (
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.875rem',
                color: '#1f8a65',
                background: 'rgba(31,138,101,0.10)',
                border: '1px solid rgba(31,138,101,0.25)',
                borderRadius: 8,
                padding: '10px 14px',
                margin: 0,
              }}
            >
              {message}
            </p>
          )}
          {error && (
            <p
              role="alert"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.875rem',
                color: 'var(--color-error)',
                background: 'rgba(207,45,86,0.08)',
                border: '1px solid rgba(207,45,86,0.20)',
                borderRadius: 8,
                padding: '10px 14px',
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          {/* Edit profile */}
          <form
            onSubmit={updateProfile}
            style={{
              background: 'var(--surface-100)',
              border: '1px solid var(--border-primary)',
              borderRadius: 12,
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                fontWeight: 400,
                letterSpacing: '-0.08px',
                color: 'var(--color-dark)',
                margin: 0,
              }}
            >
              Edit profile
            </h2>
            <div>
              <label htmlFor="profile-username" style={labelStyle}>Username</label>
              <input
                id="profile-username"
                type="text"
                className="input"
                value={profileForm.username}
                onChange={(e) => setProfileForm((c) => ({ ...c, username: e.target.value }))}
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="profile-email" style={labelStyle}>Email</label>
              <input
                id="profile-email"
                type="email"
                className="input"
                value={profileForm.email}
                onChange={(e) => setProfileForm((c) => ({ ...c, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
            <button type="submit" className="btn btn-dark" style={{ alignSelf: 'flex-start', padding: '9px 18px' }}>
              Save profile
            </button>
          </form>

          {/* Change password */}
          <form
            onSubmit={changePassword}
            style={{
              background: 'var(--surface-100)',
              border: '1px solid var(--border-primary)',
              borderRadius: 12,
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                fontWeight: 400,
                letterSpacing: '-0.08px',
                color: 'var(--color-dark)',
                margin: 0,
              }}
            >
              Change password
            </h2>
            <div>
              <label htmlFor="current-password" style={labelStyle}>Current password</label>
              <input
                id="current-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((c) => ({ ...c, currentPassword: e.target.value }))}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label htmlFor="new-password" style={labelStyle}>New password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="new-password"
                  type={showNewPw ? 'text' : 'password'}
                  className="input"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((c) => ({ ...c, newPassword: e.target.value }))}
                  autoComplete="new-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  aria-label={showNewPw ? 'Hide password' : 'Show password'}
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
                  {showNewPw ? (
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
            <button
              type="submit"
              className="btn"
              style={{
                alignSelf: 'flex-start',
                padding: '9px 18px',
                background: 'rgba(207,45,86,0.10)',
                color: 'var(--color-error)',
                border: '1px solid rgba(207,45,86,0.20)',
                borderRadius: 9999,
              }}
            >
              Update password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
