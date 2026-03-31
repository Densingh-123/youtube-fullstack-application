import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login, signInWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to where they came from (e.g. video page), or home
  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Failed to sign in. Check credentials.');
      console.error(err);
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError('Failed to sign in with Google.');
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', padding: 24
    }}>
      <div style={{
        background: 'var(--yt-surface)', padding: 40, borderRadius: 12, width: '100%', maxWidth: 450,
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)', border: '1px solid var(--yt-border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--yt-text)' }}>Sign In</h2>
          <p style={{ color: 'var(--yt-text-secondary)', marginTop: 8 }}>to continue to YouTube Explorer</p>
        </div>

        {error && <div style={{ background: 'rgba(255,0,0,0.1)', color: 'var(--yt-red)', padding: 12, borderRadius: 8, marginBottom: 20, textAlign: 'center', fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <input
              type="email"
              ref={emailRef}
              required
              placeholder="Email address"
              style={{
                width: '100%', padding: '14px 16px', background: 'var(--yt-bg)', border: '1px solid var(--yt-input-border)',
                borderRadius: 8, color: 'var(--yt-text)', fontSize: 16, outline: 'none'
              }}
            />
          </div>
          <div>
            <input
              type="password"
              ref={passwordRef}
              required
              placeholder="Password"
              style={{
                width: '100%', padding: '14px 16px', background: 'var(--yt-bg)', border: '1px solid var(--yt-input-border)',
                borderRadius: 8, color: 'var(--yt-text)', fontSize: 16, outline: 'none'
              }}
            />
          </div>
          <button disabled={loading} type="submit" style={{
            background: 'var(--yt-input-focus-border)', color: 'white', border: 'none', padding: 14,
            borderRadius: 24, fontSize: 16, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 8, transition: 'background 0.2s'
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--yt-text-secondary)', fontSize: 13 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--yt-border)' }} />
          <span style={{ padding: '0 12px' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--yt-border)' }} />
        </div>

        <button disabled={loading} onClick={handleGoogleSignIn} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          background: 'white', color: '#000', border: 'none', padding: 12, borderRadius: 24,
          fontSize: 15, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer'
        }}>
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign in with Google
        </button>

        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 14 }}>
          <span style={{ color: 'var(--yt-text-secondary)' }}>New to YouTube Explorer? </span>
          <Link to="/register" style={{ color: 'var(--yt-input-focus-border)', textDecoration: 'none', fontWeight: 500 }}>Create an account</Link>
        </div>
      </div>
    </div>
  );
}
