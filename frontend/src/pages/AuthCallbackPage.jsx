import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const { completeOAuthLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Completing sign-in...');

  useEffect(() => {
    let active = true;

    async function finishLogin() {
      const token = searchParams.get('token');
      const nextPath = searchParams.get('next') || '/home';
      const error = searchParams.get('error');

      if (error) {
        if (active) {
          setMessage(error);
          setTimeout(() => navigate('/login', { replace: true, state: { oauthError: error } }), 1200);
        }
        return;
      }

      if (!token) {
        if (active) {
          setMessage('Missing OAuth token. Please try again.');
          setTimeout(() => navigate('/login', { replace: true }), 1200);
        }
        return;
      }

      try {
        await completeOAuthLogin(token);
        console.log('[AuthCallback] OAuth login completed successfully, navigating to:', nextPath);
        
        // Add small delay to ensure state settles before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Navigate outside the active check to ensure it always executes
        // Use both React Router navigate and window.location as fallback
        console.log('[AuthCallback] Attempting navigation with React Router');
        navigate(nextPath, { replace: true });
        
        // Fallback: if React Router navigation doesn't work, use window.location
        setTimeout(() => {
          console.log('[AuthCallback] Fallback navigation check - current path:', window.location.pathname);
          if (window.location.pathname === '/auth/callback') {
            console.log('[AuthCallback] Still on callback page, using window.location fallback');
            window.location.href = nextPath;
          }
        }, 200);
      } catch (authError) {
        console.error('[AuthCallback] OAuth login failed:', authError);
        
        // Detect network-specific errors (including timeouts)
        const isNetworkError = 
          authError?.code === 'ERR_NETWORK' || 
          authError?.code === 'ECONNABORTED' ||
          (authError?.message && authError.message.toLowerCase().includes('network')) ||
          (authError?.message && authError.message.toLowerCase().includes('timeout'));
        
        if (active) {
          if (isNetworkError) {
            // Display user-friendly network error message
            setMessage('Network error. Please check your connection and try again.');
            setTimeout(
              () => navigate('/login', { replace: true, state: { oauthError: 'Network error. Please check your connection and try again.' } }),
              1200
            );
          } else {
            // Display generic OAuth error message
            setMessage(authError.message);
            setTimeout(
              () => navigate('/login', { replace: true, state: { oauthError: authError.message } }),
              1200
            );
          }
        }
      }
    }

    finishLogin();
    return () => {
      active = false;
    };
  }, [completeOAuthLogin, navigate, searchParams]);

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        paddingTop: 'clamp(40px, 8vw, 96px)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '32px 28px',
        }}
      >
        <p className="text-eyebrow" style={{ marginBottom: 10 }}>
          AUTH
        </p>
        <h1 className="text-section" style={{ margin: '0 0 12px', fontSize: '1.625rem' }}>
          Signing you in
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: '0.9375rem',
            color: 'var(--muted-foreground)',
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
