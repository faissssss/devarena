const providers = [
  {
    key: 'google',
    label: 'Continue with Google',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M21.6 12.23c0-.68-.06-1.33-.17-1.95H12v3.69h5.39a4.62 4.62 0 0 1-2 3.03v2.51h3.24c1.9-1.75 2.97-4.33 2.97-7.28Z"
        />
        <path
          fill="#34A853"
          d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.24-2.51c-.9.6-2.05.95-3.39.95-2.6 0-4.8-1.76-5.58-4.12H3.07v2.59A9.99 9.99 0 0 0 12 22Z"
        />
        <path
          fill="#FBBC05"
          d="M6.42 13.88A6 6 0 0 1 6.1 12c0-.65.11-1.28.32-1.88V7.53H3.07A9.99 9.99 0 0 0 2 12c0 1.61.38 3.14 1.07 4.47l3.35-2.59Z"
        />
        <path
          fill="#EA4335"
          d="M12 5.98c1.47 0 2.8.5 3.85 1.48l2.89-2.89C16.96 2.92 14.7 2 12 2a9.99 9.99 0 0 0-8.93 5.53l3.35 2.59C7.2 7.74 9.4 5.98 12 5.98Z"
        />
      </svg>
    ),
  },
  {
    key: 'github',
    label: 'Continue with GitHub',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.33-1.74-1.33-1.74-1.08-.74.08-.72.08-.72 1.2.08 1.83 1.23 1.83 1.23 1.06 1.82 2.78 1.3 3.46.99.11-.77.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.9 0-1.3.46-2.36 1.22-3.19-.12-.3-.53-1.53.12-3.18 0 0 1-.32 3.3 1.22a11.3 11.3 0 0 1 6 0c2.3-1.54 3.29-1.22 3.29-1.22.66 1.65.25 2.88.12 3.18.76.83 1.22 1.89 1.22 3.19 0 4.59-2.81 5.6-5.49 5.9.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.83.58A12 12 0 0 0 12 .5Z" />
      </svg>
    ),
  },
];

export default function SocialAuthButtons({ busy, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {providers.map((provider) => (
        <button
          key={provider.key}
          type="button"
          onClick={() => onSelect(provider.key)}
          disabled={busy}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '11px 16px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {provider.icon}
          <span>{provider.label}</span>
        </button>
      ))}
    </div>
  );
}
