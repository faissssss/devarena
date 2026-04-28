import { useState, useEffect } from 'react';

const STORAGE_KEY = 'devarena_degraded_warning_dismissed';

export default function DegradedDataWarning({ message }) {
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, isDismissed ? 'true' : 'false');
    } catch (error) {
      console.error('Failed to save warning dismissal state:', error);
    }
  }, [isDismissed]);

  if (isDismissed || !message) {
    return null;
  }

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(251, 191, 36, 0.12)',
        border: '1px solid rgba(251, 191, 36, 0.32)',
        borderRadius: 'var(--radius)',
        padding: '12px 16px',
        marginBottom: 20,
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{
          flexShrink: 0,
          color: '#f59e0b',
        }}
      >
        <path
          d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p
        style={{
          flex: 1,
          fontFamily: 'var(--font-ui)',
          fontSize: '0.875rem',
          color: '#d97706',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        aria-label="Dismiss warning"
        style={{
          flexShrink: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#d97706',
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
