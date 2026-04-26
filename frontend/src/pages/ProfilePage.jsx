import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import SectionHeading from '../components/SectionHeading';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { unwrapError, userApi } from '../services/api';

const labelStyle = {
  display: 'block',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--muted-foreground)',
  marginBottom: 6,
};

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ bookmarkCount: 0 });
  const [profileForm, setProfileForm] = useState({ username: user?.username || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarHover, setAvatarHover] = useState(false);

  useEffect(() => {
    setLoading(true);
    userApi
      .getMe()
      .then((res) => {
        setStats(res.stats || { bookmarkCount: 0 });
        setProfileForm({ username: res.user?.username || '', email: res.user?.email || '' });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  async function updateProfile(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await userApi.updateMe(profileForm);
      await refreshUser();
      setMessage('Profile updated successfully.');
      setTimeout(() => setMessage(''), 3000);
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
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(unwrapError(err, 'Unable to update password'));
    }
  }

  function handleAvatarClick() {
    // Create a hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        // TODO: Implement avatar upload to backend
        setMessage('Avatar upload feature coming soon!');
        setTimeout(() => setMessage(''), 3000);
      }
    };
    input.click();
  }

  function handleLogout() {
    logout();
    navigate('/landing');
  }

  const roleColor = user?.role === 'admin' ? 'var(--color-accent)' : '#1f8a65';
  const roleBg    = user?.role === 'admin' ? 'rgba(245,78,0,0.10)' : 'rgba(31,138,101,0.10)';

  // Skeleton loader for account summary
  function AccountSummarySkeleton() {
    return (
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
        }}
      >
        <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 'var(--radius)', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 10, width: '40%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 20 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="skeleton" style={{ height: 16, width: '100%' }} />
          <div className="skeleton" style={{ height: 16, width: '100%' }} />
          <div className="skeleton" style={{ height: 16, width: '100%' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      {/* Page Header */}
      <SectionHeading
        eyebrow="Profile"
        title="Account details and control"
        body="Manage your profile, security settings, and preferences."
      />

      {/* Toast Notifications */}
      {message && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: '#1f8a65',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: 'rgba(0,0,0,0.16) 0px 8px 24px, rgba(0,0,0,0.10) 0px 4px 12px',
            animation: 'slideInRight 0.3s ease',
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <p
          role="alert"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            color: 'var(--destructive)',
            background: 'transparent',
            border: '1px solid var(--destructive)',
            borderRadius: 'var(--radius)',
            padding: '12px 16px',
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      {/* 2-Column Grid Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 24,
          alignItems: 'start',
        }}
        className="md:grid-cols-[1fr_380px]"
      >
        {/* LEFT COLUMN: Account Summary, Edit Profile, Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Account Summary Card */}
          {loading ? (
            <AccountSummarySkeleton />
          ) : (
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '24px',
              }}
            >
              {/* Avatar with Edit Overlay */}
              <div 
                style={{ position: 'relative', width: 'fit-content', marginBottom: 16, cursor: 'pointer' }}
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                onClick={handleAvatarClick}
              >
                <div
                  className="avatar-box"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 150ms ease',
                    opacity: avatarHover ? 0.8 : 1,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.75rem',
                      fontWeight: 400,
                      letterSpacing: '-0.08px',
                    }}
                  >
                    {(user?.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div
                  className="avatar-edit-icon"
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--radius)',
                    border: '2px solid var(--card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 150ms ease',
                  }}
                  aria-label="Edit avatar"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
              </div>

              <p className="text-eyebrow" style={{ marginBottom: 6 }}>Account summary</p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 400,
                  letterSpacing: '-0.11px',
                  color: 'var(--foreground)',
                  margin: '0 0 4px',
                }}
              >
                {user?.username}
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.875rem',
                  color: 'var(--muted-foreground)',
                  margin: '0 0 20px',
                }}
              >
                {user?.email}
              </p>

              {/* Stats Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  padding: '16px 0',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <div>
                  <p className="text-eyebrow" style={{ marginBottom: 4, fontSize: '0.625rem' }}>Role</p>
                  <span
                    style={{
                      display: 'inline-flex',
                      background: roleBg,
                      color: roleColor,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.625rem',
                      fontWeight: 500,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-ui)',
                    }}
                  >
                    {user?.role}
                  </span>
                </div>
                <div>
                  <p className="text-eyebrow" style={{ marginBottom: 4, fontSize: '0.625rem' }}>Bookmarks</p>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.125rem',
                      fontWeight: 400,
                      color: 'var(--foreground)',
                    }}
                  >
                    {stats.bookmarkCount}
                  </span>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p className="text-eyebrow" style={{ marginBottom: 4, fontSize: '0.625rem' }}>Member since</p>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--foreground)', fontWeight: 500 }}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Edit Profile Card */}
          <form
            onSubmit={updateProfile}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                fontWeight: 400,
                letterSpacing: '-0.08px',
                color: 'var(--foreground)',
                margin: '0 0 16px',
              }}
            >
              Edit profile
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="submit" className="btn btn-dark" style={{ padding: '9px 18px' }}>
                Save profile
              </button>
            </div>
          </form>

          {/* Security Card (Change Password) */}
          <form
            onSubmit={changePassword}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                fontWeight: 400,
                letterSpacing: '-0.08px',
                color: 'var(--foreground)',
                margin: '0 0 6px',
              }}
            >
              Security
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                color: 'var(--muted-foreground)',
                margin: '0 0 16px',
              }}
            >
              Update your password to keep your account secure.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="current-password" style={labelStyle}>Current password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="current-password"
                    type={showCurrentPw ? 'text' : 'password'}
                    className="input"
                    placeholder="••••••••"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((c) => ({ ...c, currentPassword: e.target.value }))}
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw((v) => !v)}
                    aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
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
                    {showCurrentPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
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
                      color: 'var(--muted-foreground)',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showNewPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="submit" className="btn btn-dark" style={{ padding: '9px 18px' }}>
                Update password
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Appearance & Danger Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Appearance Card */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                fontWeight: 400,
                letterSpacing: '-0.08px',
                color: 'var(--foreground)',
                margin: '0 0 6px',
              }}
            >
              Appearance
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                color: 'var(--muted-foreground)',
                margin: '0 0 16px',
              }}
            >
              Customize how DevArena looks on your device.
            </p>

            {/* Theme Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { 
                  value: 'light', 
                  label: 'Light', 
                  icon: (
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
                  )
                },
                { 
                  value: 'dark', 
                  label: 'Dark', 
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )
                },
                { 
                  value: 'system', 
                  label: 'System', 
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  )
                },
              ].map((themeOption) => (
                <button
                  key={themeOption.value}
                  type="button"
                  onClick={() => setTheme(themeOption.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    background: theme === themeOption.value ? 'var(--secondary)' : 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--foreground)',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (theme !== themeOption.value) {
                      e.currentTarget.style.background = 'var(--secondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (theme !== themeOption.value) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', color: theme === themeOption.value ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                    {themeOption.icon}
                  </span>
                  <span style={{ flex: 1 }}>{themeOption.label}</span>
                  {theme === themeOption.value && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Account Actions Card */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                fontWeight: 400,
                letterSpacing: '-0.08px',
                color: 'var(--foreground)',
                margin: '0 0 6px',
              }}
            >
              Account actions
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                color: 'var(--muted-foreground)',
                margin: '0 0 16px',
              }}
            >
              Sign out of your account or manage your session.
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="btn"
              style={{
                padding: '9px 18px',
                background: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--muted)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--secondary)';
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
